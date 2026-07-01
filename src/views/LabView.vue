<script setup lang="ts">
import type Phaser from 'phaser'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { createPlanetGame } from '@/game/createGame'
import { SOURCE_LABELS } from '@/game/data/sourceLabels'
import {
  type DpsDiagnosticConfig,
  type DpsDiagnosticResult,
  type DpsRow,
  runDpsDiagnostic,
  runSynergyDiagnostic,
  type SynergyDiagnosticResult,
  type SynergyRow,
} from '@/game/dpsDiagnostic'
import {
  describeSynergyRequirements,
  UPGRADE_DEFINITIONS,
  type UpgradeDefinition,
} from '@/game/data/upgrades'
import { gameEventBus } from '@/game/eventBus'
import { soundEngine } from '@/game/sound'
import type { SandboxLayout, SandboxStatsEntry } from '@/game/types'
import { PERKS, applyPrestige, buildStartingStats } from '@/skills/skillTree'

type TreePreset = 'none' | 'legendary' | 'full'

const gameContainer = ref<HTMLDivElement | null>(null)
// the control panel docks beside the canvas on desktop, but collapses into a
// slide-in drawer on mobile — start open on wide screens, closed on phones
const isPanelOpen = ref(typeof window === 'undefined' || window.innerWidth >= 768)
const treePreset = ref<TreePreset>('none')
const isMuted = ref(soundEngine.muted())

function toggleMute(): void {
  isMuted.value = isMuted.value === false
  soundEngine.setMuted({ isMuted: isMuted.value })
}
const cardStacks = ref<Record<string, number>>({})
const statsEntries = ref<Array<SandboxStatsEntry>>([])
const elapsedMs = ref(0)
const dummyFormation = ref<SandboxLayout['formation']>('field')
const dummySpread = ref(100)
const dummiesMoving = ref(false)
/**
 * One HP control for both live dummies and the benchmark. null = invincible
 * (live only; finite dummies die and respawn, for kill-triggered effects).
 */
const targetHp = ref<number | null>(null)
const TARGET_HP_OPTIONS: Array<number | null> = [null, 25, 100, 500, 2000]
/** the benchmark needs a finite target, so ∞ falls back to this when a diagnostic runs */
const DIAG_HP_FALLBACK = 100
const diagEnemyHp = computed(() => targetHp.value ?? DIAG_HP_FALLBACK)
/**
 * One speed control for both live play and diagnostic watch runs: 0.5× slow-mo
 * for inspecting visuals, high multipliers for letting DPS converge on screen.
 */
const SPEED_OPTIONS: Array<number> = [0.5, 1, 2, 5, 16, 32]
const speedMultiplier = ref(1)
/** watch runs need to finish inside their deadline, so playback never drops below this */
const WATCH_SPEED_FLOOR = 8
const watchPlaybackSpeed = computed(() => Math.max(speedMultiplier.value, WATCH_SPEED_FLOOR))
/** simulate prestige zoom-out: wider arena, extra gun emplacements */
const PRESTIGE_OPTIONS: Array<number> = [0, 3, 6, 9]
const prestigeLevel = ref(0)

function setPrestige({ level }: { level: number }): void {
  prestigeLevel.value = level
  scheduleRestart()
}

/**
 * One guns control: null = the run's natural cannon count, 0 = turrets stand but
 * the main gun is silenced (isolates whatever else is being tested), 1+ forces a
 * count for per-gun balance work. Diagnostics grade at this too (auto/0 → 1).
 */
const CANNON_OPTIONS: Array<number | null> = [null, 0, 1, 2, 4, 6]
const cannonOverride = ref<number | null>(null)
const diagCannons = computed(() => {
  if (cannonOverride.value === null || cannonOverride.value === 0) {
    return 1
  }
  return cannonOverride.value
})

function setCannons({ count }: { count: number | null }): void {
  cannonOverride.value = count
  scheduleRestart()
}

function setSpeed({ multiplier }: { multiplier: number }): void {
  speedMultiplier.value = multiplier
  gameEventBus.emit({ event: 'set-speed', payload: { multiplier } })
}

let game: Phaser.Game | null = null
/** refit the canvas on resize/rotation — never rebuild, so nothing restarts */
const onViewportChanged = useDebounceFn(() => {
  game?.scale.refresh()
}, 250)

// useEventListener registers now and auto-removes when the view unmounts
useEventListener(window, ['resize', 'orientationchange'], onViewportChanged)
let restartTimer: ReturnType<typeof setTimeout> | null = null
const busUnsubscribes: Array<() => void> = []

// each perk's id repeated once per rank, so buildStartingStats sums to the full effect
const allPerkRanks = (filter: (perk: (typeof PERKS)[number]) => boolean): Array<string> =>
  PERKS.filter(filter).flatMap((perk) => Array<string>(perk.maxRank).fill(perk.id))

const PRESET_NODE_IDS: Record<TreePreset, Array<string>> = {
  none: [],
  legendary: allPerkRanks((perk) => perk.rarity === 'legendary' && perk.special !== 'prestige'),
  full: allPerkRanks((perk) => perk.special !== 'prestige'),
}

const totalDps = computed(() => statsEntries.value.reduce((sum, entry) => sum + entry.dps, 0))

// ── card tooltip ──────────────────────────────────────────────────────
const mainElement = ref<HTMLElement | null>(null)
const hoveredCard = ref<UpgradeDefinition | null>(null)
const tooltipX = ref(0)
const tooltipY = ref(0)

const hoveredSynergyOf = computed(() => {
  if (hoveredCard.value === null) {
    return null
  }
  return describeSynergyRequirements({ definition: hoveredCard.value })
})

function onCardHover({
  definition,
  event,
}: {
  definition: UpgradeDefinition
  event: PointerEvent
}): void {
  hoveredCard.value = definition
  const bounds = mainElement.value?.getBoundingClientRect()
  if (bounds === undefined) {
    return
  }
  tooltipX.value = Math.min(event.clientX - bounds.left + 16, bounds.width - 310)
  tooltipY.value = Math.min(event.clientY - bounds.top + 16, bounds.height - 130)
}

function onCardHoverEnd(): void {
  hoveredCard.value = null
}

const weaponDefinitions = UPGRADE_DEFINITIONS.filter(
  (definition) => definition.category === 'weapon',
)
const tacticDefinitions = UPGRADE_DEFINITIONS.filter(
  (definition) => definition.category === 'tactic',
)

function buildSandboxStats() {
  const stats = buildStartingStats({ unlockedNodeIds: PRESET_NODE_IDS[treePreset.value] })
  let finalStats = stats
  for (const definition of UPGRADE_DEFINITIONS) {
    const stacks = cardStacks.value[definition.id] ?? 0
    for (let index = 0; index < stacks; index += 1) {
      finalStats = definition.apply(finalStats)
    }
  }
  return finalStats
}

function startGame(): void {
  if (gameContainer.value === null) {
    return
  }
  game = createPlanetGame({
    parent: gameContainer.value,
    sceneData: {
      startingStats: {
        ...applyPrestige({ stats: buildSandboxStats(), prestigeLevel: prestigeLevel.value }),
        ...(cannonOverride.value !== null && cannonOverride.value > 0
          ? { cannonCount: cannonOverride.value }
          : {}),
      },
      stardustMultiplier: 1,
      mode: 'sandbox',
      prestigeLevel: prestigeLevel.value,
      initialCardStacks: { ...cardStacks.value },
      sandboxLayout: {
        formation: dummyFormation.value,
        spread: dummySpread.value / 100,
        isMoving: dummiesMoving.value,
        // guns 0 = turrets stand but the main gun holds fire
        isMainGunEnabled: cannonOverride.value !== 0,
        dummyHp: targetHp.value,
        // stream-only fields; the engine ignores them for field/boss
        enemyMix: enemyMix.value,
        mixHpScale: enemyMixScale.value,
      },
    },
  })
  // a fresh scene boots at 1× — re-apply the chosen speed once it is listening
  // (same readiness window the benchmark relies on)
  if (speedMultiplier.value !== 1) {
    setTimeout(() => {
      gameEventBus.emit({ event: 'set-speed', payload: { multiplier: speedMultiplier.value } })
    }, 600)
  }
}

function setFormation({ formation }: { formation: SandboxLayout['formation'] }): void {
  dummyFormation.value = formation
  scheduleRestart()
}

function toggleMotion(): void {
  dummiesMoving.value = dummiesMoving.value === false
  scheduleRestart()
}

function setTargetHp({ hp }: { hp: number | null }): void {
  targetHp.value = hp
  scheduleRestart()
}

function onSpreadInput(): void {
  scheduleRestart()
}

function destroyGame(): void {
  if (game !== null) {
    game.destroy(true)
    game = null
  }
}

function restartNow(): void {
  statsEntries.value = []
  elapsedMs.value = 0
  destroyGame()
  startGame()
}

/** any config change rebuilds the range so stats and visuals stay exact */
function scheduleRestart(): void {
  if (restartTimer !== null) {
    clearTimeout(restartTimer)
  }
  restartTimer = setTimeout(() => {
    restartTimer = null
    restartNow()
  }, 350)
}

function adjustCard({ cardId, step }: { cardId: string; step: number }): void {
  const definition = UPGRADE_DEFINITIONS.find((candidate) => candidate.id === cardId)
  if (definition === undefined) {
    return
  }
  const current = cardStacks.value[cardId] ?? 0
  // allow up to +3 over base cap to simulate the Weapon Level Cap perk (max 3 ranks)
  const next = Math.max(0, Math.min(definition.maxStacks + 3, current + step))
  cardStacks.value = { ...cardStacks.value, [cardId]: next }
  scheduleRestart()
}

function setPreset({ preset }: { preset: TreePreset }): void {
  treePreset.value = preset
  scheduleRestart()
}

function resetAll(): void {
  cardStacks.value = {}
  treePreset.value = 'none'
  scheduleRestart()
}

// ── automated DPS diagnostic ───────────────────────────────────────────
// Sweeps every damage weapon across every upgrade tier against a seeded,
// never-ending stream of uniform non-damaging invaders, 3 minutes each.

const DIAG_TIERS = [1, 2, 3, 4, 5]
const DIAG_DURATION_MS = 180_000
/** watch mode plays each run live, so a shorter window keeps the sweep watchable */
const WATCH_DURATION_MS = 24_000
const DIAG_SEED = 1337
/** the HP values the one-click sweep grades against, back to back */
const DIAG_HP_SWEEP = [25, 100, 1000] as const
/** uniform single-HP wave vs a seeded mix of real archetypes — live stream and diagnostics share it */
const enemyMix = ref(false)
/** mixed mode: roster HP multiplier (models later, tankier waves) */
const enemyMixScale = ref<number>(1)
const DIAG_MIX_SCALES = [1, 4, 16] as const
const isDiagnosing = ref(false)
const diagStatus = ref('')
const diagWatchLabel = ref('')
const diagRows = ref<Array<DpsRow>>([])
const synergyRows = ref<Array<SynergyRow>>([])
/** one entry per swept HP, in DIAG_HP_SWEEP order — drives the stacked-column tables */
const multiWeaponResults = ref<Array<DpsDiagnosticResult>>([])
const multiSynergyResults = ref<Array<SynergyDiagnosticResult>>([])
const diagMeta = ref<{
  enemyHp: number
  seed: number
  durationMs: number
  cannonCount: number
} | null>(null)

/** stack each HP's weapon DPS into one row per weapon: groups[hpIndex] = [dps per tier] */
const multiWeaponTable = computed(() => {
  const results = multiWeaponResults.value
  if (results.length === 0) {
    return null
  }
  return {
    hps: results.map((result) => result.enemyHp),
    tiers: results[0].tiers,
    rows: results[0].rows.map((row, rowIndex) => ({
      name: row.name,
      groups: results.map((result) => result.rows[rowIndex].cells.map((cell) => cell.dps)),
    })),
  }
})

/** same idea for synergies, stacking the Δ-DPS-over-parents for each HP */
const multiSynergyTable = computed(() => {
  const results = multiSynergyResults.value
  if (results.length === 0) {
    return null
  }
  return {
    hps: results.map((result) => result.enemyHp),
    tiers: results[0].tiers,
    rows: results[0].rows.map((row, rowIndex) => ({
      name: row.name,
      requires: row.requires.replace(/ ★2/g, ''),
      groups: results.map((result) => result.rows[rowIndex].cells.map((cell) => cell.deltaDps)),
    })),
  }
})

function setEnemyMix({ mixed }: { mixed: boolean }): void {
  enemyMix.value = mixed
  scheduleRestart()
}
function setMixScale({ scale }: { scale: number }): void {
  enemyMixScale.value = scale
  scheduleRestart()
}

/** shared driver for the weapon sweep — fast (silent, instant) or watch (live, fast playback) */
async function runDiagnostic({
  mode,
}: {
  mode: 'fast' | 'watch'
}): Promise<DpsDiagnosticResult | null> {
  if (isDiagnosing.value === true) {
    return null
  }
  isDiagnosing.value = true
  diagRows.value = []
  synergyRows.value = []
  multiWeaponResults.value = []
  multiSynergyResults.value = []
  diagStatus.value = 'Warming up…'
  diagWatchLabel.value = ''
  treePreset.value = 'none'
  cardStacks.value = {}
  await new Promise((resolve) => setTimeout(resolve, 600))

  let result: DpsDiagnosticResult | null = null
  try {
    result = await runDpsDiagnostic({
      enemyHp: diagEnemyHp.value,
      seed: DIAG_SEED,
      durationMs: mode === 'watch' ? WATCH_DURATION_MS : DIAG_DURATION_MS,
      cannonCount: diagCannons.value,
      tiers: DIAG_TIERS,
      enemyMix: enemyMix.value,
      mixHpScale: enemyMixScale.value,
      mode,
      watchSpeed: watchPlaybackSpeed.value,
      onProgress: ({ done, total, label }) => {
        diagStatus.value = `${label} (${done}/${total})`
      },
      onMeasureStart: ({ name, tier, mainGunFiring }) => {
        diagWatchLabel.value = `${name} ★${tier}${mainGunFiring === true ? '' : ' · main cannon silenced'}`
      },
    })
    diagRows.value = result.rows
    diagMeta.value = {
      enemyHp: result.enemyHp,
      seed: result.seed,
      durationMs: result.durationMs,
      cannonCount: result.cannonCount,
    }
    diagStatus.value = 'Done'
  } catch (error) {
    diagStatus.value = `Failed — ${String(error)}`
  } finally {
    isDiagnosing.value = false
    diagWatchLabel.value = ''
    cardStacks.value = {}
    restartNow()
  }
  return result
}

async function runSynergies({
  mode,
}: {
  mode: 'fast' | 'watch'
}): Promise<SynergyDiagnosticResult | null> {
  if (isDiagnosing.value === true) {
    return null
  }
  isDiagnosing.value = true
  diagRows.value = []
  synergyRows.value = []
  multiWeaponResults.value = []
  multiSynergyResults.value = []
  diagStatus.value = 'Warming up…'
  diagWatchLabel.value = ''
  treePreset.value = 'none'
  cardStacks.value = {}
  await new Promise((resolve) => setTimeout(resolve, 600))

  let result: SynergyDiagnosticResult | null = null
  try {
    result = await runSynergyDiagnostic({
      enemyHp: diagEnemyHp.value,
      seed: DIAG_SEED,
      durationMs: mode === 'watch' ? WATCH_DURATION_MS : DIAG_DURATION_MS,
      cannonCount: diagCannons.value,
      tiers: DIAG_TIERS,
      enemyMix: enemyMix.value,
      mixHpScale: enemyMixScale.value,
      mode,
      watchSpeed: watchPlaybackSpeed.value,
      onProgress: ({ done, total, label }) => {
        diagStatus.value = `${label} (${done}/${total})`
      },
      onMeasureStart: ({ name, tier, mainGunFiring }) => {
        diagWatchLabel.value =
          tier === 0
            ? `${name} — baseline (tactic off)`
            : `${name} ★${tier}${mainGunFiring === true ? '' : ' · main cannon silenced'}`
      },
    })
    synergyRows.value = result.rows
    diagMeta.value = {
      enemyHp: result.enemyHp,
      seed: result.seed,
      durationMs: result.durationMs,
      cannonCount: result.cannonCount,
    }
    diagStatus.value = 'Done'
  } catch (error) {
    diagStatus.value = `Failed — ${String(error)}`
  } finally {
    isDiagnosing.value = false
    diagWatchLabel.value = ''
    cardStacks.value = {}
    restartNow()
  }
  return result
}

/** one-click sweep: run the chosen kind against every HP in DIAG_HP_SWEEP, back to
 * back, stacking the columns into a single table (always the fast, silent mode) */
async function runHpSweep({ kind }: { kind: 'weapons' | 'synergies' }): Promise<void> {
  if (isDiagnosing.value === true) {
    return
  }
  isDiagnosing.value = true
  diagRows.value = []
  synergyRows.value = []
  multiWeaponResults.value = []
  multiSynergyResults.value = []
  diagStatus.value = 'Warming up…'
  treePreset.value = 'none'
  cardStacks.value = {}
  await new Promise((resolve) => setTimeout(resolve, 600))

  try {
    for (let index = 0; index < DIAG_HP_SWEEP.length; index += 1) {
      const enemyHp = DIAG_HP_SWEEP[index]
      const shared = {
        enemyHp,
        seed: DIAG_SEED,
        durationMs: DIAG_DURATION_MS,
        cannonCount: diagCannons.value,
        tiers: DIAG_TIERS,
        enemyMix: enemyMix.value,
        mixHpScale: enemyMixScale.value,
        mode: 'fast' as const,
        onProgress: ({ done, total, label }: { done: number; total: number; label: string }) => {
          diagStatus.value = `${enemyHp} HP (${index + 1}/${DIAG_HP_SWEEP.length}) — ${label} (${done}/${total})`
        },
      }
      if (kind === 'weapons') {
        const result = await runDpsDiagnostic(shared)
        multiWeaponResults.value = [...multiWeaponResults.value, result]
      } else {
        const result = await runSynergyDiagnostic(shared)
        multiSynergyResults.value = [...multiSynergyResults.value, result]
      }
    }
    diagMeta.value = {
      enemyHp: 0,
      seed: DIAG_SEED,
      durationMs: DIAG_DURATION_MS,
      cannonCount: diagCannons.value,
    }
    diagStatus.value = 'Done'
  } catch (error) {
    diagStatus.value = `Failed — ${String(error)}`
  } finally {
    isDiagnosing.value = false
    cardStacks.value = {}
    restartNow()
  }
}

/** automation hooks: drive the sweeps from a headless browser and read JSON back */
interface DiagnosticWindow extends Window {
  __runDpsDiagnostic?: (options?: Partial<DpsDiagnosticConfig>) => Promise<DpsDiagnosticResult>
  __runSynergyDiagnostic?: (
    options?: Partial<DpsDiagnosticConfig>,
  ) => Promise<SynergyDiagnosticResult>
  __runHpSweep?: (options?: {
    kind?: 'weapons' | 'synergies'
    hps?: Array<number>
    cannonCount?: number
    durationMs?: number
    tiers?: Array<number>
    seed?: number
    enemyMix?: boolean
    mixHpScale?: number
  }) => Promise<Array<DpsDiagnosticResult | SynergyDiagnosticResult>>
}

function exposeDiagnosticHook(): void {
  const diagnosticWindow = window as DiagnosticWindow
  diagnosticWindow.__runDpsDiagnostic = async (options = {}) => {
    treePreset.value = 'none'
    cardStacks.value = {}
    await new Promise((resolve) => setTimeout(resolve, 700))
    const result = await runDpsDiagnostic({
      enemyHp: options.enemyHp ?? diagEnemyHp.value,
      seed: options.seed ?? DIAG_SEED,
      durationMs: options.durationMs ?? DIAG_DURATION_MS,
      cannonCount: options.cannonCount ?? diagCannons.value,
      tiers: options.tiers ?? DIAG_TIERS,
      enemyMix: options.enemyMix ?? enemyMix.value,
      mixHpScale: options.mixHpScale ?? enemyMixScale.value,
      mode: options.mode ?? 'fast',
      watchSpeed: options.watchSpeed ?? watchPlaybackSpeed.value,
    })
    diagRows.value = result.rows
    return result
  }
  diagnosticWindow.__runSynergyDiagnostic = async (options = {}) => {
    treePreset.value = 'none'
    cardStacks.value = {}
    await new Promise((resolve) => setTimeout(resolve, 700))
    const result = await runSynergyDiagnostic({
      enemyHp: options.enemyHp ?? diagEnemyHp.value,
      seed: options.seed ?? DIAG_SEED,
      durationMs: options.durationMs ?? DIAG_DURATION_MS,
      cannonCount: options.cannonCount ?? diagCannons.value,
      tiers: options.tiers ?? DIAG_TIERS,
      enemyMix: options.enemyMix ?? enemyMix.value,
      mixHpScale: options.mixHpScale ?? enemyMixScale.value,
      mode: options.mode ?? 'fast',
      watchSpeed: options.watchSpeed ?? watchPlaybackSpeed.value,
    })
    synergyRows.value = result.rows
    return result
  }
  diagnosticWindow.__runHpSweep = async (options = {}) => {
    treePreset.value = 'none'
    cardStacks.value = {}
    await new Promise((resolve) => setTimeout(resolve, 700))
    const hps = options.hps ?? [...DIAG_HP_SWEEP]
    const kind = options.kind ?? 'weapons'
    const results: Array<DpsDiagnosticResult | SynergyDiagnosticResult> = []
    for (const enemyHp of hps) {
      const shared = {
        enemyHp,
        seed: options.seed ?? DIAG_SEED,
        durationMs: options.durationMs ?? DIAG_DURATION_MS,
        cannonCount: options.cannonCount ?? diagCannons.value,
        tiers: options.tiers ?? DIAG_TIERS,
        enemyMix: options.enemyMix ?? enemyMix.value,
        mixHpScale: options.mixHpScale ?? enemyMixScale.value,
        mode: 'fast' as const,
      }
      results.push(
        kind === 'synergies' ? await runSynergyDiagnostic(shared) : await runDpsDiagnostic(shared),
      )
    }
    if (kind === 'synergies') {
      multiSynergyResults.value = results as Array<SynergyDiagnosticResult>
    } else {
      multiWeaponResults.value = results as Array<DpsDiagnosticResult>
    }
    return results
  }
}

onMounted(() => {
  busUnsubscribes.push(
    gameEventBus.on({
      event: 'sandbox-stats',
      handler: (payload) => {
        statsEntries.value = payload.entries
        elapsedMs.value = payload.elapsedMs
      },
    }),
  )
  exposeDiagnosticHook()
  startGame()
})

onUnmounted(() => {
  destroyGame()
  const diagnosticWindow = window as DiagnosticWindow
  delete diagnosticWindow.__runDpsDiagnostic
  delete diagnosticWindow.__runSynergyDiagnostic
  delete diagnosticWindow.__runHpSweep
  for (const unsubscribe of busUnsubscribes) {
    unsubscribe()
  }
})
</script>

<template>
  <main ref="mainElement" class="relative flex h-screen overflow-hidden">
    <!-- mobile: tap the dimmed backdrop to close the drawer -->
    <div
      v-if="isPanelOpen === true"
      class="absolute inset-0 z-10 bg-black/50 md:hidden"
      @click="isPanelOpen = false"
    />
    <aside
      class="absolute inset-y-0 left-0 z-20 flex w-[88vw] max-w-104 transform flex-col gap-3 overflow-y-auto border-r border-slate-800 bg-slate-950/95 p-4 transition-transform duration-200 md:static md:z-10 md:w-104 md:max-w-none md:translate-x-0"
      :class="isPanelOpen === true ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between">
        <RouterLink to="/" class="text-sm font-semibold text-slate-400 hover:text-slate-200">
          ← Home
        </RouterLink>
        <span class="flex items-center gap-2">
          <h1 class="text-sm font-black tracking-widest text-lime-300">TRAINING RANGE</h1>
          <button
            type="button"
            class="cursor-pointer rounded px-1 text-sm"
            :aria-label="isMuted === true ? 'Unmute sound' : 'Mute sound'"
            @click="toggleMute()"
          >
            {{ isMuted === true ? '🔇' : '🔊' }}
          </button>
          <button
            type="button"
            class="cursor-pointer rounded px-1 text-lg leading-none text-slate-400 hover:text-slate-200 md:hidden"
            aria-label="Close controls"
            @click="isPanelOpen = false"
          >
            ✕
          </button>
        </span>
      </div>

      <!-- ── setup: presets, targets, motion ──────────────────────── -->
      <div class="flex flex-col gap-2 rounded-xl bg-slate-900/50 p-2.5">
        <div class="flex items-center gap-1.5">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Perks
          </p>
          <button
            v-for="preset in ['none', 'legendary', 'full'] as Array<TreePreset>"
            :key="preset"
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition"
            :class="
              treePreset === preset
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            @click="setPreset({ preset })"
          >
            {{ preset }}
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Targets
          </p>
          <button
            v-for="formation in ['field', 'boss', 'stream'] as Array<SandboxLayout['formation']>"
            :key="formation"
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition"
            :class="
              dummyFormation === formation
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            @click="setFormation({ formation })"
          >
            {{
              formation === 'field'
                ? 'Target field'
                : formation === 'boss'
                  ? 'Single boss'
                  : 'Stream'
            }}
          </button>
        </div>

        <div class="flex items-center gap-1.5" data-testid="enemy-mix">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Enemies
          </p>
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              enemyMix === false
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            :disabled="isDiagnosing === true"
            @click="enemyMix === true && setEnemyMix({ mixed: false })"
          >
            Uniform
          </button>
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              enemyMix === true
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            :disabled="isDiagnosing === true"
            @click="enemyMix === false && setEnemyMix({ mixed: true })"
          >
            Realistic
          </button>
        </div>

        <div v-if="enemyMix === true" class="flex items-center gap-1.5" data-testid="mix-scale">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Mix HP ×
          </p>
          <button
            v-for="option in DIAG_MIX_SCALES"
            :key="option"
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              enemyMixScale === option
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            :disabled="isDiagnosing === true"
            @click="setMixScale({ scale: option })"
          >
            ×{{ option }}
          </button>
        </div>

        <div class="flex items-center gap-1.5" data-testid="dummy-motion">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Motion
          </p>
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              dummiesMoving === false
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            @click="dummiesMoving === true && toggleMotion()"
          >
            Static
          </button>
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              dummiesMoving === true
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            @click="dummiesMoving === false && toggleMotion()"
          >
            Moving
          </button>
        </div>

        <div class="flex items-center gap-1.5" data-testid="enemy-hp">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Enemy HP
          </p>
          <button
            v-for="option in TARGET_HP_OPTIONS"
            :key="option ?? 'invincible'"
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              targetHp === option
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            :disabled="isDiagnosing === true"
            @click="setTargetHp({ hp: option })"
          >
            {{ option === null ? '∞' : option }}
          </button>
        </div>

        <div class="flex items-center gap-1.5" data-testid="sim-cannons">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Guns
          </p>
          <button
            v-for="option in CANNON_OPTIONS"
            :key="option ?? 'auto'"
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              cannonOverride === option
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            :disabled="isDiagnosing === true"
            @click="setCannons({ count: option })"
          >
            {{ option ?? 'auto' }}
          </button>
        </div>
        <p v-if="cannonOverride === 0" class="text-xs text-slate-500" data-testid="guns-zero-note">
          0 keeps the turrets standing but silences the main gun — other weapons still fire.
        </p>

        <div class="flex items-center gap-1.5" data-testid="sim-prestige">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Prestige
          </p>
          <button
            v-for="option in PRESTIGE_OPTIONS"
            :key="option"
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              prestigeLevel === option
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            @click="setPrestige({ level: option })"
          >
            ⟴{{ option }}
          </button>
        </div>

        <div class="flex items-center gap-1.5" data-testid="sim-speed">
          <p class="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            Speed
          </p>
          <button
            v-for="option in SPEED_OPTIONS"
            :key="option"
            type="button"
            class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition"
            :class="
              speedMultiplier === option
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
            :disabled="isDiagnosing === true"
            @click="setSpeed({ multiplier: option })"
          >
            ×{{ option }}
          </button>
        </div>

        <label
          v-if="dummyFormation === 'field'"
          class="flex items-center gap-2 text-xs text-slate-400"
        >
          <span class="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-500">
            Spread
          </span>
          <input
            v-model.number="dummySpread"
            type="range"
            min="30"
            max="160"
            step="10"
            class="flex-1 accent-lime-400"
            @change="onSpreadInput()"
          />
          <span class="w-9 text-right font-bold text-slate-200">{{ dummySpread }}%</span>
        </label>
      </div>

      <!-- ── live dps ─────────────────────────────────────────────── -->
      <div class="flex flex-col gap-1">
        <p
          class="flex items-baseline justify-between text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          DPS ({{ (elapsedMs / 1000).toFixed(0) }}s)
          <span class="text-sm normal-case tracking-normal text-lime-300">
            Σ {{ totalDps.toFixed(1) }}
          </span>
        </p>
        <div class="grid grid-cols-2 gap-1">
          <div
            v-for="entry in statsEntries"
            :key="entry.source"
            class="flex items-center justify-between rounded bg-slate-900/70 px-2 py-1 text-xs"
          >
            <span class="truncate text-slate-300">
              {{ SOURCE_LABELS[entry.source] ?? entry.source }}
            </span>
            <span class="font-bold text-slate-100">{{ entry.dps.toFixed(1) }}</span>
          </div>
        </div>
        <p v-if="statsEntries.length === 0" class="text-xs text-slate-600">
          Add cards to start measuring…
        </p>
      </div>

      <!-- ── cards ────────────────────────────────────────────────── -->
      <div class="flex flex-col gap-1">
        <p class="flex items-baseline justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Weapons</span>
          <button
            type="button"
            class="cursor-pointer text-xs font-semibold text-red-400 hover:text-red-300"
            @click="resetAll()"
          >
            Reset everything
          </button>
        </p>
        <div class="grid grid-cols-2 gap-1">
          <div
            v-for="definition in weaponDefinitions"
            :key="definition.id"
            class="flex items-center justify-between gap-1 rounded-lg bg-slate-900/70 px-2 py-1"
            @pointerenter="(event) => onCardHover({ definition, event })"
            @pointermove="(event) => onCardHover({ definition, event })"
            @pointerleave="onCardHoverEnd()"
          >
            <span class="truncate text-xs font-semibold text-slate-200">
              {{ definition.name }}
            </span>
            <span class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="h-5 w-5 cursor-pointer rounded bg-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-600"
                @click="adjustCard({ cardId: definition.id, step: -1 })"
              >
                −
              </button>
              <span class="w-4 text-center text-xs font-bold text-amber-300">
                {{ cardStacks[definition.id] ?? 0 }}
              </span>
              <button
                type="button"
                class="h-5 w-5 cursor-pointer rounded bg-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-600"
                @click="adjustCard({ cardId: definition.id, step: 1 })"
              >
                +
              </button>
            </span>
          </div>
        </div>

        <p class="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
          Synergy tactics
        </p>
        <div class="grid grid-cols-2 gap-1">
          <div
            v-for="definition in tacticDefinitions"
            :key="definition.id"
            class="flex items-center justify-between gap-1 rounded-lg bg-slate-900/70 px-2 py-1"
            @pointerenter="(event) => onCardHover({ definition, event })"
            @pointermove="(event) => onCardHover({ definition, event })"
            @pointerleave="onCardHoverEnd()"
          >
            <span class="truncate text-xs font-semibold text-slate-200">
              {{ definition.name }}
            </span>
            <span class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="h-5 w-5 cursor-pointer rounded bg-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-600"
                @click="adjustCard({ cardId: definition.id, step: -1 })"
              >
                −
              </button>
              <span class="w-4 text-center text-xs font-bold text-amber-300">
                {{ cardStacks[definition.id] ?? 0 }}
              </span>
              <button
                type="button"
                class="h-5 w-5 cursor-pointer rounded bg-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-600"
                @click="adjustCard({ cardId: definition.id, step: 1 })"
              >
                +
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- ── dps diagnostic ───────────────────────────────────────── -->
      <div class="flex flex-col gap-1.5">
        <p class="text-xs text-slate-500" data-testid="diag-hp-note">
          Diagnostics grade with the setup above:
          <span class="font-semibold text-slate-400">Enemy HP</span> (∞ → {{ DIAG_HP_FALLBACK }}),
          <span class="font-semibold text-slate-400">Enemies</span> mix,
          <span class="font-semibold text-slate-400">Guns</span> (auto/0 → 1), and
          <span class="font-semibold text-slate-400">Speed</span> for watch runs (min ×{{
            WATCH_SPEED_FLOOR
          }}).
        </p>

        <button
          type="button"
          class="cursor-pointer rounded-lg bg-lime-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          :disabled="isDiagnosing === true"
          data-testid="run-diagnostic"
          @click="runDiagnostic({ mode: 'fast' })"
        >
          {{
            isDiagnosing === true ? diagStatus : 'Run DPS diagnostic (every tier · 3 min · seeded)'
          }}
        </button>
        <div class="flex gap-1.5">
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-slate-50 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            :disabled="isDiagnosing === true"
            data-testid="watch-diagnostic"
            @click="runDiagnostic({ mode: 'watch' })"
          >
            ▶ Watch weapons
          </button>
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-bold text-slate-50 transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            :disabled="isDiagnosing === true"
            data-testid="run-synergies"
            @click="runSynergies({ mode: 'fast' })"
          >
            Synergies
          </button>
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg bg-fuchsia-800 px-3 py-2 text-xs font-bold text-slate-50 transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            :disabled="isDiagnosing === true"
            data-testid="watch-synergies"
            @click="runSynergies({ mode: 'watch' })"
          >
            ▶ Watch
          </button>
        </div>
        <div class="flex gap-1.5">
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            :disabled="isDiagnosing === true"
            data-testid="sweep-weapons"
            @click="runHpSweep({ kind: 'weapons' })"
          >
            Sweep HP · weapons
          </button>
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-slate-50 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            :disabled="isDiagnosing === true"
            data-testid="sweep-synergies"
            @click="runHpSweep({ kind: 'synergies' })"
          >
            Sweep HP · synergies
          </button>
        </div>
        <p class="text-[10px] text-slate-600">
          Sweep grades every tier against {{ DIAG_HP_SWEEP.join(' / ') }} HP, columns stacked.
        </p>
        <p v-if="isDiagnosing === false && diagStatus !== ''" class="text-xs text-slate-500">
          {{ diagStatus }}
          <span v-if="diagMeta !== null">
            — {{ diagMeta.enemyHp }} HP · {{ diagMeta.cannonCount }} cannon(s) · seed
            {{ diagMeta.seed }} · {{ (diagMeta.durationMs / 1000).toFixed(0) }}s each
          </span>
        </p>

        <table v-if="diagRows.length > 0" class="w-full text-xs" data-testid="diagnostic-table">
          <thead>
            <tr class="text-left text-slate-500">
              <th class="py-0.5 font-semibold">Weapon</th>
              <th v-for="tier in DIAG_TIERS" :key="tier" class="py-0.5 text-right font-semibold">
                ★{{ tier }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in diagRows" :key="row.cardId" class="border-t border-slate-800">
              <td class="py-0.5 text-slate-300">{{ row.name }}</td>
              <td
                v-for="cell in row.cells"
                :key="cell.tier"
                class="py-0.5 text-right font-bold text-slate-100"
              >
                {{ cell.dps.toFixed(1) }}
              </td>
            </tr>
          </tbody>
        </table>

        <table v-if="synergyRows.length > 0" class="w-full text-xs" data-testid="synergy-table">
          <caption class="pb-0.5 text-left text-[10px] text-slate-500">
            Synergy — Δ DPS over its required parents
          </caption>
          <thead>
            <tr class="text-left text-slate-500">
              <th class="py-0.5 font-semibold">Synergy</th>
              <th class="py-0.5 font-semibold">Requires</th>
              <th v-for="tier in DIAG_TIERS" :key="tier" class="py-0.5 text-right font-semibold">
                ★{{ tier }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in synergyRows" :key="row.cardId" class="border-t border-slate-800">
              <td class="py-0.5 pr-1 text-slate-300">{{ row.name }}</td>
              <td class="py-0.5 pr-1 text-[10px] text-slate-500">
                {{ row.requires.replace(/ ★2/g, '') }}
              </td>
              <td
                v-for="cell in row.cells"
                :key="cell.tier"
                class="py-0.5 text-right font-bold"
                :class="cell.deltaDps >= 0 ? 'text-fuchsia-300' : 'text-red-400'"
              >
                {{ cell.deltaDps >= 0 ? '+' : '' }}{{ cell.deltaDps.toFixed(1) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ── stacked HP-sweep: weapons ─────────────────────────── -->
        <table
          v-if="multiWeaponTable !== null"
          class="w-full text-[11px]"
          data-testid="sweep-weapon-table"
        >
          <thead>
            <tr class="text-slate-400">
              <th class="py-0.5 text-left font-semibold" rowspan="2">Weapon</th>
              <th
                v-for="hp in multiWeaponTable.hps"
                :key="hp"
                class="border-l border-slate-800 py-0.5 text-center font-semibold text-amber-300"
                :colspan="multiWeaponTable.tiers.length"
              >
                {{ hp }} HP
              </th>
            </tr>
            <tr class="text-slate-600">
              <template v-for="hp in multiWeaponTable.hps" :key="hp">
                <th
                  v-for="(tier, tierIndex) in multiWeaponTable.tiers"
                  :key="`${hp}-${tier}`"
                  class="py-0.5 text-right font-semibold"
                  :class="tierIndex === 0 ? 'border-l border-slate-800' : ''"
                >
                  ★{{ tier }}
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in multiWeaponTable.rows"
              :key="row.name"
              class="border-t border-slate-800"
            >
              <td class="py-0.5 pr-1 text-slate-300">{{ row.name }}</td>
              <template v-for="(group, groupIndex) in row.groups" :key="groupIndex">
                <td
                  v-for="(dps, tierIndex) in group"
                  :key="tierIndex"
                  class="py-0.5 text-right font-bold text-slate-100"
                  :class="tierIndex === 0 ? 'border-l border-slate-800' : ''"
                >
                  {{ dps.toFixed(1) }}
                </td>
              </template>
            </tr>
          </tbody>
        </table>

        <!-- ── stacked HP-sweep: synergies ───────────────────────── -->
        <table
          v-if="multiSynergyTable !== null"
          class="w-full text-[11px]"
          data-testid="sweep-synergy-table"
        >
          <caption class="pb-0.5 text-left text-[10px] text-slate-500">
            Synergy Δ DPS over parents, per target HP
          </caption>
          <thead>
            <tr class="text-slate-400">
              <th class="py-0.5 text-left font-semibold" rowspan="2">Synergy</th>
              <th
                v-for="hp in multiSynergyTable.hps"
                :key="hp"
                class="border-l border-slate-800 py-0.5 text-center font-semibold text-amber-300"
                :colspan="multiSynergyTable.tiers.length"
              >
                {{ hp }} HP
              </th>
            </tr>
            <tr class="text-slate-600">
              <template v-for="hp in multiSynergyTable.hps" :key="hp">
                <th
                  v-for="(tier, tierIndex) in multiSynergyTable.tiers"
                  :key="`${hp}-${tier}`"
                  class="py-0.5 text-right font-semibold"
                  :class="tierIndex === 0 ? 'border-l border-slate-800' : ''"
                >
                  ★{{ tier }}
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in multiSynergyTable.rows"
              :key="row.name"
              class="border-t border-slate-800"
            >
              <td class="py-0.5 pr-1 text-slate-300" :title="row.requires">{{ row.name }}</td>
              <template v-for="(group, groupIndex) in row.groups" :key="groupIndex">
                <td
                  v-for="(delta, tierIndex) in group"
                  :key="tierIndex"
                  class="py-0.5 text-right font-bold"
                  :class="[
                    tierIndex === 0 ? 'border-l border-slate-800' : '',
                    delta >= 0 ? 'text-fuchsia-300' : 'text-red-400',
                  ]"
                >
                  {{ delta >= 0 ? '+' : '' }}{{ delta.toFixed(1) }}
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </aside>

    <div class="relative flex-1">
      <div ref="gameContainer" class="h-full w-full overflow-hidden" />
      <!-- mobile: open the controls drawer -->
      <button
        v-if="isPanelOpen === false"
        type="button"
        class="absolute left-2 top-2 z-30 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm font-bold text-lime-300 shadow-lg md:hidden"
        aria-label="Open controls"
        @click="isPanelOpen = true"
      >
        ☰ Controls
      </button>
      <div
        v-if="diagWatchLabel !== ''"
        class="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-sky-500/50 bg-slate-950/85 px-4 py-1.5 text-sm font-bold text-sky-200 shadow-lg"
        data-testid="watch-label"
      >
        Now testing: {{ diagWatchLabel }}
      </div>
    </div>

    <div
      v-if="hoveredCard !== null"
      class="pointer-events-none absolute z-30 w-72 rounded-lg border border-slate-700 bg-slate-950/95 p-3 shadow-xl"
      :style="{ left: `${tooltipX}px`, top: `${tooltipY}px` }"
      data-testid="card-tooltip"
    >
      <p class="flex items-baseline justify-between gap-2">
        <span class="text-sm font-bold text-slate-100">{{ hoveredCard.name }}</span>
        <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {{ hoveredCard.rarity }} {{ hoveredCard.category }}
        </span>
      </p>
      <p class="mt-1 text-xs leading-relaxed text-slate-300">{{ hoveredCard.description }}</p>
      <p v-if="hoveredSynergyOf !== null" class="mt-1.5 text-xs font-semibold text-fuchsia-300">
        ⛓ Synergy of {{ hoveredSynergyOf }}
      </p>
    </div>
  </main>
</template>
