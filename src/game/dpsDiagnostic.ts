import { UPGRADE_DEFINITIONS } from '@/game/data/upgrades'
import { gameEventBus } from '@/game/eventBus'
import type { RunStats, SandboxStatsEntry } from '@/game/types'
import { buildStartingStats } from '@/skills/skillTree'

/**
 * Automated DPS benchmark for the training range. For every damage weapon, at
 * every upgrade tier, it points a freshly-built loadout at a never-ending,
 * seeded stream of identical non-damaging invaders and fast-forwards a fixed
 * window, then reports the weapon's damage-per-second.
 *
 * Because the stream is driven by a seeded RNG that only the spawner touches,
 * every weapon and every tier faces the exact same swarm — the only variable is
 * the weapon under test. The run executes inside an already-running sandbox
 * GameScene via the synchronous fast-forward bus, so no rendering happens.
 */

/** the weapons that deal direct damage, paired with the stat source they log under */
export const DPS_WEAPONS: Array<{ cardId: string; source: string }> = [
  { cardId: 'salvo', source: 'main' },
  { cardId: 'flak', source: 'flak' },
  { cardId: 'flame', source: 'flame' },
  { cardId: 'devourer', source: 'devourer' },
  { cardId: 'rocket', source: 'rocket' },
  { cardId: 'chain', source: 'chain' },
  { cardId: 'nova', source: 'nova' },
  { cardId: 'railgun', source: 'railgun' },
  { cardId: 'lance', source: 'lance' },
  { cardId: 'airstrike', source: 'airstrike' },
  { cardId: 'bfg', source: 'bfg' },
  { cardId: 'orbital-laser', source: 'orbital-laser' },
  { cardId: 'mines', source: 'mines' },
]

export interface DpsCell {
  tier: number
  dps: number
  totalDamage: number
}

export interface DpsRow {
  cardId: string
  name: string
  source: string
  cells: Array<DpsCell>
}

export interface DpsDiagnosticConfig {
  /** hit points of every invader in the stream */
  enemyHp: number
  /** seeds the swarm — same value ⇒ same wave for every weapon */
  seed: number
  /** simulated time per measurement, in ms (default 3 minutes) */
  durationMs: number
  /**
   * how many cannons are deployed. Per-cannon weapons (main/salvo, flak, flame,
   * lance, mines) scale with this; battlefield-wide ones (BFG, orbital, nova) do
   * not — so the count strongly changes the relative picture. Default 1.
   */
  cannonCount?: number
  /** upgrade tiers to measure, e.g. [1,2,3,4,5] */
  tiers: Array<number>
  /** spawn a seeded mix of real archetypes instead of one uniform-HP dummy */
  enemyMix?: boolean
  /** mixed mode only: multiplies the roster's base HP (models later waves) */
  mixHpScale?: number
  /**
   * 'fast' (default) blasts each run synchronously with no rendering — the way
   * to get numbers quickly. 'watch' instead advances the live render loop at a
   * high speed multiplier so you can actually see each run play out.
   */
  mode?: 'fast' | 'watch'
  /** watch mode only: game-speed multiplier for the live playback */
  watchSpeed?: number
  /** fired after each weapon completes, for progress UI */
  onProgress?: (info: { done: number; total: number; label: string }) => void
  /** fired as each individual run begins — drives the "now testing X ★N" overlay */
  onMeasureStart?: (info: {
    cardId: string
    name: string
    tier: number
    source: string
    mainGunFiring: boolean
  }) => void
}

export interface DpsDiagnosticResult {
  enemyHp: number
  seed: number
  durationMs: number
  cannonCount: number
  tiers: Array<number>
  rows: Array<DpsRow>
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

function sleep({ ms }: { ms: number }): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/** core paragon only — no flat stat bonuses, so the numbers are the cards' own */
function buildLoadoutStats({
  cardStacks,
  cannonCount,
}: {
  cardStacks: Record<string, number>
  cannonCount: number
}): RunStats {
  let stats = buildStartingStats({ unlockedNodeIds: [] })
  for (const [cardId, stacks] of Object.entries(cardStacks)) {
    const definition = UPGRADE_DEFINITIONS.find((candidate) => candidate.id === cardId)
    if (definition === undefined) {
      continue
    }
    for (let index = 0; index < stacks; index += 1) {
      stats = definition.apply(stats)
    }
  }
  return { ...stats, cannonCount }
}

export async function runDpsDiagnostic({
  enemyHp,
  seed,
  durationMs,
  cannonCount = 1,
  tiers,
  enemyMix = false,
  mixHpScale = 1,
  mode = 'fast',
  watchSpeed = 16,
  onProgress,
  onMeasureStart,
}: DpsDiagnosticConfig): Promise<DpsDiagnosticResult> {
  // capture the stats the scene emits at the end of every fast-forward, and
  // continuously during watch-mode playback
  let latest: { entries: Array<SandboxStatsEntry>; elapsedMs: number } = {
    entries: [],
    elapsedMs: 0,
  }
  const unsubscribe = gameEventBus.on({
    event: 'sandbox-stats',
    handler: (payload) => {
      latest = payload
    },
  })

  /** watch mode: let the live loop run at speed until the sim clock crosses the window */
  async function playUntilWindowElapsed(): Promise<void> {
    gameEventBus.emit({ event: 'set-speed', payload: { multiplier: watchSpeed } })
    // generous real-time ceiling in case a frame stalls — never hang the sweep
    const realDeadline = Date.now() + (durationMs / watchSpeed) * 2 + 8_000
    while (latest.elapsedMs < durationMs && Date.now() < realDeadline) {
      await sleep({ ms: 80 })
    }
  }

  const rows: Array<DpsRow> = []
  const total = DPS_WEAPONS.length
  try {
    let done = 0
    for (const weapon of DPS_WEAPONS) {
      const definition = UPGRADE_DEFINITIONS.find((candidate) => candidate.id === weapon.cardId)
      const row: DpsRow = {
        cardId: weapon.cardId,
        name: definition?.name ?? weapon.cardId,
        source: weapon.source,
        cells: [],
      }
      for (const tier of tiers) {
        const cardStacks = { [weapon.cardId]: tier }
        // the main gun IS the 'salvo' weapon — fire it only on that row, so every
        // other weapon is measured with the main cannon silenced (pure isolation)
        const mainGunFiring = weapon.source === 'main'
        onMeasureStart?.({
          cardId: weapon.cardId,
          name: row.name,
          tier,
          source: weapon.source,
          mainGunFiring,
        })
        // configure resets the range (elapsed, damage, swarm seed) synchronously
        gameEventBus.emit({
          event: 'sandbox-configure',
          payload: {
            stats: buildLoadoutStats({ cardStacks, cannonCount }),
            cardStacks,
            layout: {
              formation: 'stream',
              spread: 1,
              isMoving: false,
              isMainGunEnabled: mainGunFiring,
              dummyHp: enemyHp,
              seed,
              enemyMix,
              mixHpScale,
            },
          },
        })

        if (mode === 'watch') {
          // play it out on the live render loop so it can be watched
          await playUntilWindowElapsed()
        } else {
          // blast the whole window synchronously, no rendering — fastest numbers
          gameEventBus.emit({ event: 'sandbox-fastforward', payload: { gameMs: durationMs } })
        }

        const entry = latest.entries.find((candidate) => candidate.source === weapon.source)
        row.cells.push({
          tier,
          dps: entry?.dps ?? 0,
          totalDamage: entry?.total ?? 0,
        })
      }
      rows.push(row)
      done += 1
      onProgress?.({ done, total, label: row.name })
      // let the UI repaint and keep the page responsive between weapons
      await yieldToBrowser()
    }
  } finally {
    unsubscribe()
    // hand the range back at normal speed
    gameEventBus.emit({ event: 'set-speed', payload: { multiplier: 1 } })
  }

  return { enemyHp, seed, durationMs, cannonCount, tiers, rows }
}

// ── synergy tactics ────────────────────────────────────────────────────
// Synergy tactics don't fire on their own — they buff or extend their parent
// weapons. So we measure each one's *marginal* damage: total field DPS with the
// tactic on, minus the same loadout with it off. The parents are held at the
// tier the tactic unlocks at, and only the tactic's rank changes.

export interface SynergyCell {
  tier: number
  /** total DPS of the whole loadout (parents + tactic) at this tactic rank */
  totalDps: number
  /** totalDps minus the parents-only baseline — the tactic's own contribution */
  deltaDps: number
}

export interface SynergyRow {
  cardId: string
  name: string
  /** human label of the parent requirement, e.g. "Tesla Arc ★2 + Cloud Cover ★2" */
  requires: string
  /** DPS of the parents alone, with the tactic off */
  baselineDps: number
  cells: Array<SynergyCell>
}

export interface SynergyDiagnosticResult {
  enemyHp: number
  seed: number
  durationMs: number
  cannonCount: number
  tiers: Array<number>
  rows: Array<SynergyRow>
}

function sumDps({ entries }: { entries: Array<SandboxStatsEntry> }): number {
  return entries.reduce((total, entry) => total + entry.dps, 0)
}

export async function runSynergyDiagnostic({
  enemyHp,
  seed,
  durationMs,
  cannonCount = 1,
  tiers,
  enemyMix = false,
  mixHpScale = 1,
  mode = 'fast',
  watchSpeed = 16,
  onProgress,
  onMeasureStart,
}: DpsDiagnosticConfig): Promise<SynergyDiagnosticResult> {
  let latest: { entries: Array<SandboxStatsEntry>; elapsedMs: number } = {
    entries: [],
    elapsedMs: 0,
  }
  const unsubscribe = gameEventBus.on({
    event: 'sandbox-stats',
    handler: (payload) => {
      latest = payload
    },
  })

  async function runWindow(): Promise<void> {
    if (mode === 'watch') {
      gameEventBus.emit({ event: 'set-speed', payload: { multiplier: watchSpeed } })
      const realDeadline = Date.now() + (durationMs / watchSpeed) * 2 + 8_000
      while (latest.elapsedMs < durationMs && Date.now() < realDeadline) {
        await sleep({ ms: 80 })
      }
    } else {
      gameEventBus.emit({ event: 'sandbox-fastforward', payload: { gameMs: durationMs } })
    }
  }

  // measure the total field DPS for a given loadout
  async function measureTotal({
    cardStacks,
    isMainGunEnabled,
  }: {
    cardStacks: Record<string, number>
    isMainGunEnabled: boolean
  }): Promise<number> {
    gameEventBus.emit({
      event: 'sandbox-configure',
      payload: {
        stats: buildLoadoutStats({ cardStacks, cannonCount }),
        cardStacks,
        layout: {
          formation: 'stream',
          spread: 1,
          isMoving: false,
          isMainGunEnabled,
          dummyHp: enemyHp,
          seed,
          enemyMix,
          mixHpScale,
        },
      },
    })
    await runWindow()
    return sumDps({ entries: latest.entries })
  }

  const synergies = UPGRADE_DEFINITIONS.filter(
    (definition) => definition.category === 'tactic' && definition.requires !== undefined,
  )
  const rows: Array<SynergyRow> = []
  const total = synergies.length
  try {
    let done = 0
    for (const synergy of synergies) {
      const parents = synergy.requires ?? []
      const baseStacks: Record<string, number> = {}
      for (const parent of parents) {
        baseStacks[parent.id] = parent.stacks
      }
      // a parent of Salvo means the main gun is part of the combo — let it fire
      const isMainGunEnabled = (baseStacks.salvo ?? 0) > 0
      const requiresLabel = parents
        .map((parent) => {
          const parentDef = UPGRADE_DEFINITIONS.find((candidate) => candidate.id === parent.id)
          return `${parentDef?.name ?? parent.id} ★${parent.stacks}`
        })
        .join(' + ')

      onMeasureStart?.({
        cardId: synergy.id,
        name: synergy.name,
        tier: 0,
        source: synergy.id,
        mainGunFiring: isMainGunEnabled,
      })
      const baselineDps = await measureTotal({ cardStacks: { ...baseStacks }, isMainGunEnabled })

      const cells: Array<SynergyCell> = []
      for (const tier of tiers) {
        onMeasureStart?.({
          cardId: synergy.id,
          name: synergy.name,
          tier,
          source: synergy.id,
          mainGunFiring: isMainGunEnabled,
        })
        const totalDps = await measureTotal({
          cardStacks: { ...baseStacks, [synergy.id]: tier },
          isMainGunEnabled,
        })
        cells.push({ tier, totalDps, deltaDps: totalDps - baselineDps })
      }

      rows.push({
        cardId: synergy.id,
        name: synergy.name,
        requires: requiresLabel,
        baselineDps,
        cells,
      })
      done += 1
      onProgress?.({ done, total, label: synergy.name })
      await yieldToBrowser()
    }
  } finally {
    unsubscribe()
    gameEventBus.emit({ event: 'set-speed', payload: { multiplier: 1 } })
  }

  return { enemyHp, seed, durationMs, cannonCount, tiers, rows }
}
