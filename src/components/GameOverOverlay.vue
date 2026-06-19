<script setup lang="ts">
import { computed, ref } from 'vue'

import { SOURCE_LABELS } from '@/game/data/sourceLabels'
import { UPGRADE_DEFINITIONS } from '@/game/data/upgrades'
import type { RunResult } from '@/game/types'
import { ROOT_NODE_ID, SKILL_NODES_BY_ID } from '@/skills/skillTree'

const { result, unlockedNodeIds, prestigeLevel } = defineProps<{
  result: RunResult
  unlockedNodeIds: Array<string>
  prestigeLevel: number
}>()

const emit = defineEmits<{
  restart: []
}>()

const UPGRADE_BY_ID = new Map(UPGRADE_DEFINITIONS.map((definition) => [definition.id, definition]))

const durationLabel = computed(() => {
  const totalSeconds = Math.floor(result.elapsedMs / 1_000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
})

const elapsedSeconds = computed(() => Math.max(1, result.elapsedMs / 1_000))

const damageRows = computed(() => {
  const totalDamage = result.damageBySource.reduce((sum, entry) => sum + entry.total, 0)
  return result.damageBySource.slice(0, 8).map((entry) => ({
    source: entry.source,
    label: SOURCE_LABELS[entry.source] ?? entry.source,
    total: entry.total,
    percent: totalDamage > 0 ? (entry.total / totalDamage) * 100 : 0,
  }))
})

function formatDamage(total: number): string {
  if (total >= 1_000_000) {
    return `${(total / 1_000_000).toFixed(1)}M`
  }
  if (total >= 10_000) {
    return `${(total / 1_000).toFixed(0)}k`
  }
  return String(Math.round(total))
}

// ── copyable run report ─────────────────────────────────────────────────
const cardLines = computed(() => {
  const entries = Object.entries(result.cardStacks)
  const weapons: Array<string> = []
  const tactics: Array<string> = []
  for (const [id, tier] of entries) {
    const definition = UPGRADE_BY_ID.get(id)
    const line = `  ${definition?.name ?? id} ★${tier}`
    if (definition?.category === 'tactic') {
      tactics.push(line)
    } else {
      weapons.push(line)
    }
  }
  weapons.sort()
  tactics.sort()
  return { weapons, tactics }
})

const nodeNames = computed(() =>
  unlockedNodeIds
    .filter((id) => id !== ROOT_NODE_ID)
    .map((id) => SKILL_NODES_BY_ID.get(id)?.name ?? id)
    .sort(),
)

const reportText = computed(() => {
  const lines: Array<string> = []
  lines.push('Last Horizon — Run Summary')
  lines.push(
    `Wave ${result.waveReached} · Level ${result.level} · ${durationLabel.value} · ${result.kills} kills · ✦+${result.stardustEarned}`,
  )
  lines.push(`Prestige: ${prestigeLevel}`)
  lines.push('')

  lines.push('Weapons:')
  lines.push(...(cardLines.value.weapons.length > 0 ? cardLines.value.weapons : ['  (none)']))
  if (cardLines.value.tactics.length > 0) {
    lines.push('Synergy tactics:')
    lines.push(...cardLines.value.tactics)
  }
  lines.push('')

  lines.push('Damage by source (total · dps · share):')
  const totalDamage = result.damageBySource.reduce((sum, entry) => sum + entry.total, 0)
  for (const entry of result.damageBySource) {
    const label = SOURCE_LABELS[entry.source] ?? entry.source
    const dps = entry.total / elapsedSeconds.value
    const share = totalDamage > 0 ? ((entry.total / totalDamage) * 100).toFixed(0) : '0'
    lines.push(`  ${label}: ${Math.round(entry.total)} · ${dps.toFixed(1)}/s · ${share}%`)
  }
  lines.push(
    `  TOTAL: ${Math.round(totalDamage)} · ${(totalDamage / elapsedSeconds.value).toFixed(1)}/s`,
  )
  lines.push('')

  lines.push(`Paragon nodes (${nodeNames.value.length}):`)
  lines.push(nodeNames.value.length > 0 ? `  ${nodeNames.value.join(', ')}` : '  (none)')

  return lines.join('\n')
})

const copyState = ref<'idle' | 'copied' | 'failed'>('idle')

async function copyReport(): Promise<void> {
  try {
    await navigator.clipboard.writeText(reportText.value)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'failed'
  }
  setTimeout(() => {
    copyState.value = 'idle'
  }, 2_000)
}
</script>

<template>
  <div
    class="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
  >
    <div
      class="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-red-500/30 bg-slate-900/90 p-8"
    >
      <h2 class="text-4xl font-black text-red-400">BASE LOST</h2>

      <dl class="grid w-full grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt class="text-slate-400">Waves survived</dt>
        <dd class="text-right font-bold text-slate-100">{{ result.waveReached }}</dd>
        <dt class="text-slate-400">Enemies destroyed</dt>
        <dd class="text-right font-bold text-slate-100">{{ result.kills }}</dd>
        <dt class="text-slate-400">Level reached</dt>
        <dd class="text-right font-bold text-slate-100">{{ result.level }}</dd>
        <dt class="text-slate-400">Time held</dt>
        <dd class="text-right font-bold text-slate-100">{{ durationLabel }}</dd>
      </dl>

      <div v-if="damageRows.length > 0" class="w-full">
        <p class="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          Damage by weapon
        </p>
        <div class="flex flex-col gap-1">
          <div v-for="row in damageRows" :key="row.source" class="flex items-center gap-2 text-xs">
            <span class="w-24 shrink-0 truncate text-slate-400">{{ row.label }}</span>
            <span class="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <span
                class="block h-full rounded-full bg-sky-500/80"
                :style="{ width: `${Math.max(2, row.percent)}%` }"
              />
            </span>
            <span class="w-12 shrink-0 text-right font-bold text-slate-200">
              {{ formatDamage(row.total) }}
            </span>
          </div>
        </div>
      </div>

      <p
        class="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-2 text-lg font-bold text-amber-300"
      >
        ✦ +{{ result.stardustEarned }} stardust
      </p>

      <div class="flex w-full flex-col gap-3">
        <button
          type="button"
          class="cursor-pointer rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
          data-testid="copy-run-details"
          @click="copyReport()"
        >
          {{
            copyState === 'copied'
              ? '✓ Copied run details'
              : copyState === 'failed'
                ? 'Copy failed — select the text below'
                : '📋 Copy run details'
          }}
        </button>
        <textarea
          v-if="copyState === 'failed'"
          class="h-32 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-[10px] text-slate-300"
          readonly
          :value="reportText"
          @focus="(event) => (event.target as HTMLTextAreaElement).select()"
        />
        <button
          type="button"
          class="cursor-pointer rounded-xl bg-sky-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-sky-400"
          @click="emit('restart')"
        >
          Run Again
        </button>
        <RouterLink
          to="/skills"
          class="rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-6 py-3 text-center font-bold text-fuchsia-300 transition hover:bg-fuchsia-500/20"
        >
          Spend Stardust
        </RouterLink>
        <RouterLink
          to="/"
          class="rounded-xl border border-slate-600 px-6 py-3 text-center font-bold text-slate-300 transition hover:bg-slate-800"
        >
          Home
        </RouterLink>
      </div>
    </div>
  </div>
</template>
