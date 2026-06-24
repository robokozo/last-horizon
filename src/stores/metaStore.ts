import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

import { UPGRADE_DEFINITIONS } from '@/game/data/upgrades'
import type { RunResult } from '@/game/types'
import {
  PERKS,
  PERKS_BY_ID,
  type Perk,
  interestPercentFrom,
  perkCostForRank,
  refundFractionFrom,
} from '@/skills/skillTree'

/** display names for the weapon cards, so favorites can be shown without the run loaded */
const WEAPON_NAME_BY_ID = new Map(
  UPGRADE_DEFINITIONS.filter((definition) => definition.category === 'weapon').map((definition) => [
    definition.id,
    definition.name,
  ]),
)

interface LifetimeStats {
  runs: number
  kills: number
  bestWave: number
  totalStardustEarned: number
}

/** one finished run, snapshotted for export + offline DPS analysis */
export interface RunHistoryEntry {
  /** ISO timestamp the run ended */
  date: string
  prestigeLevel: number
  /** owned perk ranks for this run (perk ids repeated per rank) */
  unlockedNodeIds: Array<string>
  result: RunResult
}

/** keep the history bounded so localStorage never balloons */
const RUN_HISTORY_CAP = 200

const DEFAULT_LIFETIME_STATS: LifetimeStats = {
  runs: 0,
  kills: 0,
  bestWave: 0,
  totalStardustEarned: 0,
}

/** how many ranks of a perk are owned, given the repeated-id list */
function rankOf({ ids, perkId }: { ids: Array<string>; perkId: string }): number {
  let count = 0
  for (const id of ids) {
    if (id === perkId) {
      count += 1
    }
  }
  return count
}

/** total stardust currently sunk into all owned perk ranks */
function sunkStardust({ ids }: { ids: Array<string> }): number {
  const counts = new Map<string, number>()
  let total = 0
  for (const id of ids) {
    const perk = PERKS_BY_ID.get(id)
    if (perk === undefined) {
      continue
    }
    const rank = (counts.get(id) ?? 0) + 1
    counts.set(id, rank)
    total += perkCostForRank({ perk, rank })
  }
  return total
}

export const useMetaStore = defineStore('meta', () => {
  const stardust = useLocalStorage<number>('pd-stardust', 0)
  // perks are stored as repeated ids — one entry per owned rank
  const unlockedNodeIds = useLocalStorage<Array<string>>('pd-unlocked-nodes', [])
  const lifetime = useLocalStorage<LifetimeStats>('pd-lifetime', { ...DEFAULT_LIFETIME_STATS })
  const prestigeLevel = useLocalStorage<number>('pd-prestige', 0)
  // how many times each weapon card has been picked across all runs — drives the
  // "favorite weapons" readout. Lifetime preference data, so it survives prestige.
  const weaponPicks = useLocalStorage<Record<string, number>>('pd-weapon-picks', {})
  // a rolling log of finished runs for export + DPS analysis (device-local)
  const runHistory = useLocalStorage<Array<RunHistoryEntry>>('pd-run-history', [])

  // saves from before the perk-shop redesign reference ids that no longer exist:
  // wipe the owned perks and refund everything ever earned so nothing is lost
  const hasUnknownNode = unlockedNodeIds.value.some((nodeId) => PERKS_BY_ID.has(nodeId) === false)
  if (hasUnknownNode === true) {
    unlockedNodeIds.value = []
    stardust.value = lifetime.value.totalStardustEarned
  }

  /** weapons the player picks most, most-picked first — for the home favorites list */
  const favoriteWeapons = computed(() =>
    Object.entries(weaponPicks.value)
      .filter(([id, count]) => count > 0 && WEAPON_NAME_BY_ID.has(id))
      .map(([id, count]) => ({ id, name: WEAPON_NAME_BY_ID.get(id) as string, count }))
      .sort((a, b) => b.count - a.count),
  )

  /** count a weapon card the player chose during a run */
  function recordWeaponPick({ id }: { id: string }): void {
    weaponPicks.value = { ...weaponPicks.value, [id]: (weaponPicks.value[id] ?? 0) + 1 }
  }

  /** total perk ranks bought — the progression metric */
  const paragonLevel = computed(() => unlockedNodeIds.value.length)

  /** fraction of stardust returned on a sell, raised by Reclamation */
  const refundFraction = computed(() =>
    refundFractionFrom({ unlockedNodeIds: unlockedNodeIds.value }),
  )

  /** ranks owned of a perk (for prestige, the prestige level) */
  function perkRank({ perkId }: { perkId: string }): number {
    const perk = PERKS_BY_ID.get(perkId)
    if (perk?.special === 'prestige') {
      return prestigeLevel.value
    }
    return rankOf({ ids: unlockedNodeIds.value, perkId })
  }

  /** stardust price of the NEXT rank of a perk (0 if already maxed) */
  function nextPerkCost({ perkId }: { perkId: string }): number {
    const perk = PERKS_BY_ID.get(perkId)
    if (perk === undefined) {
      return 0
    }
    const rank = perkRank({ perkId })
    if (rank >= perk.maxRank) {
      return 0
    }
    return perkCostForRank({ perk, rank: rank + 1 })
  }

  function canBuyPerk({ perkId }: { perkId: string }): boolean {
    const perk = PERKS_BY_ID.get(perkId)
    if (perk === undefined) {
      return false
    }
    if (perkRank({ perkId }) >= perk.maxRank) {
      return false
    }
    return stardust.value >= nextPerkCost({ perkId })
  }

  /** buy one rank of a perk; prestige is special (advances prestige, wipes perks) */
  function buyPerk({ perkId }: { perkId: string }): boolean {
    const perk = PERKS_BY_ID.get(perkId)
    if (perk === undefined || canBuyPerk({ perkId }) === false) {
      return false
    }
    const cost = nextPerkCost({ perkId })
    stardust.value -= cost
    if (perk.special === 'prestige') {
      prestigeLevel.value += 1
      unlockedNodeIds.value = []
      return true
    }
    unlockedNodeIds.value = [...unlockedNodeIds.value, perkId]
    return true
  }

  /** sell one rank of a perk for a partial refund; prestige can't be sold */
  function sellPerk({ perkId }: { perkId: string }): boolean {
    const perk = PERKS_BY_ID.get(perkId)
    if (perk === undefined || perk.special === 'prestige') {
      return false
    }
    const rank = rankOf({ ids: unlockedNodeIds.value, perkId })
    if (rank <= 0) {
      return false
    }
    const refund = Math.floor(perkCostForRank({ perk, rank }) * refundFraction.value)
    const index = unlockedNodeIds.value.lastIndexOf(perkId)
    unlockedNodeIds.value = [
      ...unlockedNodeIds.value.slice(0, index),
      ...unlockedNodeIds.value.slice(index + 1),
    ]
    stardust.value += refund
    return true
  }

  /** sell every owned perk back at the current refund fraction */
  function resetTree(): void {
    const refund = Math.floor(sunkStardust({ ids: unlockedNodeIds.value }) * refundFraction.value)
    stardust.value += refund
    unlockedNodeIds.value = []
  }

  /** true once every non-prestige perk is at max rank */
  const isParagonComplete = computed(() =>
    PERKS.every(
      (perk) => perk.special === 'prestige' || perkRank({ perkId: perk.id }) >= perk.maxRank,
    ),
  )

  /** total stardust currently invested in perks (for display) */
  const totalSpentOnTree = computed(() => sunkStardust({ ids: unlockedNodeIds.value }))

  /** dev helper: max out every non-prestige perk for free */
  function maxAllPerks(): void {
    const next: Array<string> = [...unlockedNodeIds.value]
    for (const perk of PERKS) {
      if (perk.special === 'prestige') {
        continue
      }
      const have = rankOf({ ids: next, perkId: perk.id })
      for (let rank = have; rank < perk.maxRank; rank += 1) {
        next.push(perk.id)
      }
    }
    unlockedNodeIds.value = next
  }

  /** wipe the save entirely: stardust, perks, lifetime stats, prestige, favorites */
  function resetAllProgress(): void {
    stardust.value = 0
    unlockedNodeIds.value = []
    prestigeLevel.value = 0
    lifetime.value = { ...DEFAULT_LIFETIME_STATS }
    weaponPicks.value = {}
    runHistory.value = []
  }

  /**
   * A copyable code for moving progress between devices. It carries only the
   * progression that matters — stardust and owned perks (with prestige). Device-local
   * extras like lifetime stats and favorite weapons are deliberately left out.
   */
  function exportSave(): string {
    // compact: one { id: rankCount } entry per owned perk, not an id per rank
    const perks: Record<string, number> = {}
    for (const id of unlockedNodeIds.value) {
      perks[id] = (perks[id] ?? 0) + 1
    }
    const payload = {
      version: 3,
      stardust: stardust.value,
      perks,
      prestigeLevel: prestigeLevel.value,
    }
    return btoa(JSON.stringify(payload))
  }

  function importSave({ code }: { code: string }): boolean {
    try {
      const payload = JSON.parse(atob(code.trim())) as {
        version?: number
        stardust?: number
        /** v3: { perkId: rankCount } */
        perks?: Record<string, number>
        /** v2: perk ids repeated once per rank */
        unlockedNodeIds?: Array<string>
        prestigeLevel?: number
      }
      if (typeof payload.stardust !== 'number') {
        return false
      }
      // rebuild the repeated-id list, clamping each perk to its current max rank
      const ids: Array<string> = []
      if (payload.perks !== undefined && typeof payload.perks === 'object') {
        for (const [id, count] of Object.entries(payload.perks)) {
          const perk = PERKS_BY_ID.get(id)
          if (perk === undefined || typeof count !== 'number') {
            continue
          }
          const ranks = Math.max(0, Math.min(perk.maxRank, Math.floor(count)))
          for (let rank = 0; rank < ranks; rank += 1) {
            ids.push(id)
          }
        }
      } else if (Array.isArray(payload.unlockedNodeIds)) {
        for (const id of payload.unlockedNodeIds) {
          if (typeof id === 'string' && PERKS_BY_ID.has(id)) {
            ids.push(id)
          }
        }
      } else {
        return false
      }
      stardust.value = payload.stardust
      unlockedNodeIds.value = ids
      prestigeLevel.value = typeof payload.prestigeLevel === 'number' ? payload.prestigeLevel : 0
      return true
    } catch {
      return false
    }
  }

  function recordRun({ result }: { result: RunResult }): void {
    // compound interest: the dust that sat unspent through the run pays interest
    const interestPercent = interestPercentFrom({ unlockedNodeIds: unlockedNodeIds.value })
    const interest = Math.floor((stardust.value * interestPercent) / 100)
    stardust.value += result.stardustEarned + interest
    lifetime.value = {
      runs: lifetime.value.runs + 1,
      kills: lifetime.value.kills + result.kills,
      bestWave: Math.max(lifetime.value.bestWave, result.waveReached),
      totalStardustEarned: lifetime.value.totalStardustEarned + result.stardustEarned + interest,
    }
    // log the run for export / DPS analysis, newest last, capped
    const entry: RunHistoryEntry = {
      date: new Date().toISOString(),
      prestigeLevel: prestigeLevel.value,
      unlockedNodeIds: [...unlockedNodeIds.value],
      result,
    }
    runHistory.value = [...runHistory.value, entry].slice(-RUN_HISTORY_CAP)
  }

  /** the whole run log as pretty JSON, for copy/download into a spreadsheet or notebook */
  function exportRunHistory(): string {
    return JSON.stringify(runHistory.value, null, 2)
  }

  function clearRunHistory(): void {
    runHistory.value = []
  }

  /** the perks list, for the shop UI */
  function listPerks(): Array<Perk> {
    return PERKS
  }

  return {
    stardust,
    unlockedNodeIds,
    lifetime,
    weaponPicks,
    runHistory,
    exportRunHistory,
    clearRunHistory,
    favoriteWeapons,
    recordWeaponPick,
    paragonLevel,
    prestigeLevel,
    refundFraction,
    isParagonComplete,
    totalSpentOnTree,
    perkRank,
    nextPerkCost,
    canBuyPerk,
    buyPerk,
    sellPerk,
    resetTree,
    maxAllPerks,
    listPerks,
    resetAllProgress,
    exportSave,
    importSave,
    recordRun,
  }
})
