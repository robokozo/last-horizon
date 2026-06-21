<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { onMounted, ref } from 'vue'

import SaveTransfer from '@/components/SaveTransfer.vue'
import SynergyGlossary from '@/components/SynergyGlossary.vue'
import WhatsNewOverlay from '@/components/WhatsNewOverlay.vue'
import { PATCH_NOTES } from '@/data/patchNotes'
import { damageNumbersEnabled, screenShakeEnabled } from '@/game/settings'
import { soundEngine } from '@/game/sound'
import { SKILL_NODES } from '@/skills/skillTree'
import { useMetaStore } from '@/stores/metaStore'

const metaStore = useMetaStore()

const isGlossaryOpen = ref(false)
const isConfirmingReset = ref(false)

// ── "what's new" on a fresh version ────────────────────────────────────
// The newest patch entry is the current version; we remember the last one
// the player saw and pop the changes the first time a new version loads.
const latestPatch = PATCH_NOTES[0]
const latestPatchKey = `${latestPatch.date}-${latestPatch.title}`
const lastSeenPatch = useLocalStorage('pd-last-seen-patch', '')
const isWhatsNewOpen = ref(false)

onMounted(() => {
  if (lastSeenPatch.value !== latestPatchKey) {
    isWhatsNewOpen.value = true
  }
})

function dismissWhatsNew(): void {
  lastSeenPatch.value = latestPatchKey
  isWhatsNewOpen.value = false
}

// DEV ONLY — gated to the dev server (import.meta.env.DEV is false in prod, so the
// panel never renders for real players). Temporary helpers for testing the prestige
// flow without grinding. Remove when done.
const isDev = import.meta.env.DEV
function grantDevStardust(): void {
  metaStore.stardust += 1_000_000
}
function grantDevPrestige(): void {
  // jump straight to a higher prestige level so the extra cannons / wider arena
  // can be checked in a run without buying out and prestiging the whole board
  metaStore.prestigeLevel += 1
}
function fillDevBoard(): void {
  // grant exactly what the unbought nodes cost, then buy the board the real way
  // (respects adjacency, keeps treeSpent correct) so stardust nets out unchanged
  const remainingCost = SKILL_NODES.filter(
    (node) => metaStore.unlockedNodeIdSet.has(node.id) === false,
  ).reduce((sum, node) => sum + node.cost, 0)
  metaStore.stardust += remainingCost
  let unlockedAny = true
  while (unlockedAny === true) {
    unlockedAny = false
    // each pass reads a fresh available-set (the getter recomputes as nodes unlock)
    for (const nodeId of metaStore.availableNodeIdSet) {
      if (metaStore.unlockNode({ nodeId }) === true) {
        unlockedAny = true
      }
    }
  }
}

function onResetClick(): void {
  if (isConfirmingReset.value === false) {
    isConfirmingReset.value = true
    return
  }
  metaStore.resetAllProgress()
  isConfirmingReset.value = false
}

// ── settings ──────────────────────────────────────────────────────────
const isSettingsOpen = ref(false)
const volumePercent = ref(Math.round(soundEngine.volume() * 100))
const isMuted = ref(soundEngine.muted())
const isMusicOn = ref(soundEngine.musicEnabled())

function onVolumeInput(): void {
  soundEngine.setVolume({ volume: volumePercent.value / 100 })
}

function toggleMute(): void {
  isMuted.value = isMuted.value === false
  soundEngine.setMuted({ isMuted: isMuted.value })
}

function toggleMusic(): void {
  isMusicOn.value = isMusicOn.value === false
  soundEngine.setMusicEnabled({ isEnabled: isMusicOn.value })
}

// ── run history (export for DPS analysis) ──────────────────────────────
const historyCopyState = ref<'idle' | 'copied' | 'failed'>('idle')
const isConfirmingHistoryClear = ref(false)

async function copyRunHistory(): Promise<void> {
  try {
    await navigator.clipboard.writeText(metaStore.exportRunHistory())
    historyCopyState.value = 'copied'
  } catch {
    historyCopyState.value = 'failed'
  }
  setTimeout(() => {
    historyCopyState.value = 'idle'
  }, 2_000)
}

function downloadRunHistory(): void {
  const blob = new Blob([metaStore.exportRunHistory()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `last-horizon-runs-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function onClearHistoryClick(): void {
  if (isConfirmingHistoryClear.value === false) {
    isConfirmingHistoryClear.value = true
    return
  }
  metaStore.clearRunHistory()
  isConfirmingHistoryClear.value = false
}
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-10 p-8">
    <header class="text-center">
      <h1
        class="text-5xl font-black tracking-widest text-sky-300 drop-shadow-[0_0_18px_rgba(56,189,248,0.45)]"
      >
        LAST HORIZON
      </h1>
      <p class="mt-3 text-slate-400">The invasion has begun. Hold the line.</p>
    </header>

    <section class="flex flex-wrap items-center justify-center gap-3">
      <span
        class="flex items-center gap-3 rounded-full border border-amber-400/30 bg-amber-400/10 px-6 py-2"
      >
        <span class="text-2xl">✦</span>
        <span class="text-xl font-bold text-amber-300">{{ Math.floor(metaStore.stardust) }}</span>
        <span class="text-sm text-amber-200/70">stardust</span>
      </span>
      <span
        v-if="metaStore.prestigeLevel > 0"
        class="flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-5 py-2"
        title="Each prestige pulls the view back and staffs another gun emplacement"
      >
        <span class="text-xl font-bold text-sky-300">⟴ {{ metaStore.prestigeLevel }}</span>
        <span class="text-sm text-sky-200/70">prestige</span>
      </span>
    </section>

    <p v-if="metaStore.isParagonComplete === true" class="-mt-6 text-sm font-semibold text-sky-300">
      The paragon board is complete — prestige awaits in the Paragon Tree.
    </p>

    <nav class="flex flex-col items-center gap-4">
      <RouterLink
        to="/game"
        class="w-64 rounded-xl bg-sky-500 px-8 py-4 text-center text-xl font-bold text-slate-950 transition hover:bg-sky-400 hover:shadow-[0_0_24px_rgba(56,189,248,0.5)]"
      >
        Launch Run
      </RouterLink>
      <RouterLink
        to="/skills"
        class="w-64 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-8 py-4 text-center text-xl font-bold text-fuchsia-300 transition hover:bg-fuchsia-500/20"
      >
        Paragon Tree
      </RouterLink>
      <RouterLink
        to="/lab"
        class="w-64 rounded-xl border border-lime-400/40 bg-lime-500/10 px-8 py-4 text-center text-xl font-bold text-lime-300 transition hover:bg-lime-500/20"
      >
        Training Range
      </RouterLink>
    </nav>

    <section class="grid grid-cols-4 gap-6 text-center text-sm">
      <div>
        <p class="text-2xl font-bold text-slate-200">{{ metaStore.lifetime.runs }}</p>
        <p class="text-slate-500">runs</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-slate-200">{{ metaStore.lifetime.bestWave }}</p>
        <p class="text-slate-500">best wave</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-slate-200">{{ metaStore.lifetime.kills }}</p>
        <p class="text-slate-500">kills</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-slate-200">
          {{ Math.floor(metaStore.lifetime.totalStardustEarned) }}
        </p>
        <p class="text-slate-500">stardust earned</p>
      </div>
    </section>

    <section
      v-if="metaStore.favoriteWeapons.length > 0"
      class="flex w-full max-w-md flex-col items-center gap-2"
    >
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Favorite weapons</p>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <span
          v-for="(weapon, index) in metaStore.favoriteWeapons.slice(0, 6)"
          :key="weapon.id"
          class="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
          :class="
            index === 0
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
              : 'border-slate-700 bg-slate-900/60 text-slate-300'
          "
        >
          <span class="font-semibold">{{ weapon.name }}</span>
          <span class="text-slate-500">×{{ weapon.count }}</span>
        </span>
      </div>
    </section>

    <section class="flex w-full max-w-md flex-col items-center gap-3">
      <div class="flex items-center gap-5">
        <button
          type="button"
          class="cursor-pointer text-xs font-semibold text-slate-500 transition hover:text-slate-300"
          @click="isSettingsOpen = isSettingsOpen === false"
        >
          ⚙ Settings &amp; save {{ isSettingsOpen === true ? '▴' : '▾' }}
        </button>
        <RouterLink
          to="/patch-notes"
          class="text-xs font-semibold text-slate-500 transition hover:text-slate-300"
        >
          📜 Patch notes
        </RouterLink>
        <button
          type="button"
          class="cursor-pointer text-xs font-semibold text-slate-500 transition hover:text-slate-300"
          @click="isGlossaryOpen = true"
        >
          ⛓ Synergies
        </button>
      </div>

      <div
        v-if="isSettingsOpen === true"
        class="flex w-full flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm"
      >
        <label class="flex items-center gap-3 text-slate-300">
          <span class="w-28 shrink-0 text-slate-400">Volume</span>
          <input
            v-model.number="volumePercent"
            type="range"
            min="0"
            max="100"
            step="5"
            class="flex-1 accent-sky-400"
            @input="onVolumeInput()"
          />
          <span class="w-10 text-right font-bold">{{ volumePercent }}%</span>
        </label>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            :class="
              isMuted === false
                ? 'bg-sky-500/20 text-sky-300'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            "
            @click="toggleMute()"
          >
            {{ isMuted === true ? '🔇 Muted' : '🔊 Sound on' }}
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            :class="
              isMusicOn === true
                ? 'bg-sky-500/20 text-sky-300'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            "
            @click="toggleMusic()"
          >
            ♫ Music {{ isMusicOn === true ? 'on' : 'off' }}
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            :class="
              screenShakeEnabled === true
                ? 'bg-sky-500/20 text-sky-300'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            "
            @click="screenShakeEnabled = screenShakeEnabled === false"
          >
            Screen shake {{ screenShakeEnabled === true ? 'on' : 'off' }}
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            :class="
              damageNumbersEnabled === true
                ? 'bg-sky-500/20 text-sky-300'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            "
            @click="damageNumbersEnabled = damageNumbersEnabled === false"
          >
            Damage numbers {{ damageNumbersEnabled === true ? 'on' : 'off' }}
          </button>
        </div>

        <SaveTransfer />

        <div class="flex flex-col gap-2 border-t border-slate-800 pt-3">
          <span class="text-xs font-semibold text-slate-400">
            Run history — {{ metaStore.runHistory.length }} run{{
              metaStore.runHistory.length === 1 ? '' : 's'
            }}
            logged (for DPS analysis)
          </span>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="cursor-pointer rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="metaStore.runHistory.length === 0"
              @click="downloadRunHistory()"
            >
              ⬇ Download JSON
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="metaStore.runHistory.length === 0"
              @click="copyRunHistory()"
            >
              {{
                historyCopyState === 'copied'
                  ? '✓ Copied'
                  : historyCopyState === 'failed'
                    ? 'Copy failed'
                    : '📋 Copy JSON'
              }}
            </button>
            <button
              v-if="metaStore.runHistory.length > 0"
              type="button"
              class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400/70 transition hover:text-red-400"
              @click="onClearHistoryClick()"
              @mouseleave="isConfirmingHistoryClear = false"
            >
              {{ isConfirmingHistoryClear === true ? 'Confirm clear?' : 'Clear' }}
            </button>
          </div>
        </div>

        <div
          v-if="isDev === true"
          class="flex flex-col gap-2 border-t border-dashed border-amber-500/40 pt-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
              @click="grantDevStardust()"
            >
              DEV: +1,000,000 stardust
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
              @click="grantDevPrestige()"
            >
              DEV: +1 prestige (now {{ metaStore.prestigeLevel }})
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
              :disabled="metaStore.isParagonComplete === true"
              @click="fillDevBoard()"
            >
              DEV: fill paragon board
            </button>
          </div>
          <span class="text-[10px] text-slate-500">localhost only — for testing prestige</span>
        </div>

        <div class="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            type="button"
            class="cursor-pointer rounded-lg border px-4 py-1.5 text-xs font-semibold transition"
            :class="
              isConfirmingReset === true
                ? 'border-red-500 bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'border-red-500/30 text-red-400/70 hover:bg-red-500/10 hover:text-red-400'
            "
            @click="onResetClick()"
          >
            {{
              isConfirmingReset === true ? 'Click again to wipe everything' : 'Reset all progress'
            }}
          </button>
          <button
            v-if="isConfirmingReset === true"
            type="button"
            class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
            @click="isConfirmingReset = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>

    <SynergyGlossary v-if="isGlossaryOpen === true" @close="isGlossaryOpen = false" />
    <WhatsNewOverlay
      v-if="isWhatsNewOpen === true"
      :entry="latestPatch"
      @close="dismissWhatsNew()"
    />
  </main>
</template>
