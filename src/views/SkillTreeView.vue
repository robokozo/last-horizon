<script setup lang="ts">
import { computed, ref } from 'vue'

import { PERKS, RARITY_ORDER, type Perk, type PerkRarity } from '@/skills/skillTree'
import { useMetaStore } from '@/stores/metaStore'

const metaStore = useMetaStore()

const RARITY_LABEL: Record<PerkRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

/** card accent per rarity, matching the level-up card palette */
const RARITY_COLOR: Record<PerkRarity, string> = {
  common: '#94a3b8',
  rare: '#38bdf8',
  epic: '#e879f9',
  legendary: '#fb923c',
}

const RARITY_TEXT: Record<PerkRarity, string> = {
  common: 'text-slate-300',
  rare: 'text-sky-300',
  epic: 'text-fuchsia-300',
  legendary: 'text-orange-300',
}

const perksByRarity = computed(() =>
  RARITY_ORDER.map((rarity) => ({
    rarity,
    perks: PERKS.filter((perk) => perk.rarity === rarity),
  })),
)

const isConfirmingReset = ref(false)
const confirmingPrestigeId = ref<string | null>(null)

function rankOf(perk: Perk): number {
  return metaStore.perkRank({ perkId: perk.id })
}

function isMaxed(perk: Perk): boolean {
  return rankOf(perk) >= perk.maxRank
}

function buy(perk: Perk): void {
  if (perk.special === 'prestige') {
    if (confirmingPrestigeId.value !== perk.id) {
      confirmingPrestigeId.value = perk.id
      return
    }
    metaStore.buyPerk({ perkId: perk.id })
    confirmingPrestigeId.value = null
    return
  }
  metaStore.buyPerk({ perkId: perk.id })
}

function sell(perk: Perk): void {
  metaStore.sellPerk({ perkId: perk.id })
}

function requestReset(): void {
  if (isConfirmingReset.value === false) {
    isConfirmingReset.value = true
    return
  }
  metaStore.resetTree()
  isConfirmingReset.value = false
}

const refundPercentLabel = computed(() => `${Math.round(metaStore.refundFraction * 100)}%`)
</script>

<template>
  <main class="flex h-screen flex-col bg-slate-950">
    <header
      class="z-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2 sm:px-6 sm:py-3"
    >
      <div class="flex items-center gap-3 sm:gap-6">
        <RouterLink
          to="/"
          class="text-sm font-semibold text-slate-400 transition hover:text-slate-200"
        >
          ← Home
        </RouterLink>
        <h1 class="text-base font-black tracking-wider text-fuchsia-300 sm:text-xl">PARAGON</h1>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3">
        <span
          class="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300 sm:px-4 sm:py-1.5 sm:text-sm"
        >
          ✦ {{ Math.floor(metaStore.stardust) }}
        </span>
        <span
          class="flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-1 text-xs font-bold text-fuchsia-300 sm:px-4 sm:py-1.5 sm:text-sm"
          :title="`${metaStore.paragonLevel} perk ranks bought`"
        >
          ★{{ metaStore.paragonLevel }}
        </span>
        <span
          v-if="metaStore.prestigeLevel > 0"
          class="flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-xs font-bold text-sky-300 sm:px-4 sm:py-1.5 sm:text-sm"
          title="Each prestige permanently staffs another gun emplacement"
        >
          ⟴ {{ metaStore.prestigeLevel }}
        </span>
        <span
          class="hidden items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300 sm:flex"
          title="Stardust returned when you sell a perk (raised by Reclamation)"
        >
          ↩ {{ refundPercentLabel }} refund
        </span>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 sm:px-3 sm:py-1.5 sm:text-sm"
          @click="requestReset()"
          @mouseleave="isConfirmingReset = false"
        >
          {{ isConfirmingReset === true ? 'Confirm sell-all?' : 'Reset' }}
        </button>
        <RouterLink
          to="/game"
          class="cursor-pointer rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 sm:px-4 sm:py-1.5 sm:text-sm"
        >
          ▶ Launch
        </RouterLink>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto flex max-w-5xl flex-col gap-8">
        <section v-for="group in perksByRarity" :key="group.rarity" class="flex flex-col gap-3">
          <h2
            class="text-sm font-black uppercase tracking-[0.2em]"
            :class="RARITY_TEXT[group.rarity]"
          >
            {{ RARITY_LABEL[group.rarity] }}
          </h2>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="perk in group.perks"
              :key="perk.id"
              class="flex flex-col gap-3 rounded-2xl border bg-slate-900/70 p-4"
              :style="{ borderColor: `${RARITY_COLOR[perk.rarity]}55` }"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-2xl leading-none">{{ perk.icon }}</span>
                  <h3 class="font-bold" :style="{ color: RARITY_COLOR[perk.rarity] }">
                    {{ perk.name }}
                  </h3>
                </div>
                <span
                  class="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  :class="isMaxed(perk) ? 'text-emerald-400' : 'text-slate-300'"
                >
                  {{ rankOf(perk) }} / {{ perk.maxRank }}
                </span>
              </div>

              <p class="text-sm text-slate-400">{{ perk.description }}</p>

              <!-- rank pips -->
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="pip in perk.maxRank"
                  :key="pip"
                  class="h-1.5 w-4 rounded-full"
                  :style="{
                    backgroundColor: pip <= rankOf(perk) ? RARITY_COLOR[perk.rarity] : '#1e293b',
                  }"
                />
              </div>

              <div class="mt-auto flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-700 text-lg font-bold leading-none text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                  :disabled="perk.special === 'prestige' || rankOf(perk) <= 0"
                  aria-label="Sell one rank"
                  @click="sell(perk)"
                >
                  −
                </button>

                <button
                  type="button"
                  class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  :style="
                    metaStore.canBuyPerk({ perkId: perk.id })
                      ? { backgroundColor: RARITY_COLOR[perk.rarity] }
                      : {}
                  "
                  :disabled="metaStore.canBuyPerk({ perkId: perk.id }) === false"
                  @click="buy(perk)"
                  @mouseleave="confirmingPrestigeId = null"
                >
                  <template v-if="isMaxed(perk)">Maxed ✓</template>
                  <template v-else-if="confirmingPrestigeId === perk.id">
                    Confirm — wipes all perks
                  </template>
                  <template v-else>✦ {{ metaStore.nextPerkCost({ perkId: perk.id }) }}</template>
                </button>
              </div>
            </div>
          </div>
        </section>
        <p class="pb-4 text-center text-xs text-slate-600">
          Buy and sell perks freely — selling returns {{ refundPercentLabel }} of what you paid.
        </p>
      </div>
    </div>
  </main>
</template>
