import { AEGIS_BLOCK_INTERVAL_MS, BASE_RUN_STATS, PRESTIGE } from '@/game/data/balance'
import type { RunStats } from '@/game/types'

// ── Between-run progression: a flat PERK SHOP (no board) ───────────────
// Perks are a flat list grouped only by rarity. Each perk is bought in
// ranks; ranks are stored as repeated perk ids in the player's owned list,
// so `aggregateEffects` (which sums per occurrence) turns ranks into totals
// for free. Cost rises per rank; selling refunds a partial fraction.

export type PerkRarity = 'common' | 'rare' | 'epic' | 'legendary'

export const RARITY_ORDER: Array<PerkRarity> = ['common', 'rare', 'epic', 'legendary']

export type MetaStat =
  | 'damagePercent'
  | 'damagePerLevelPercent'
  | 'fireRatePercent'
  | 'projectileSpeedPercent'
  | 'rangePercent'
  | 'critChancePercent'
  | 'pierceFlat'
  | 'maxHpFlat'
  | 'regenPerSecondFlat'
  | 'critMultiplierFlat'
  | 'aegisUnlockFlat'
  | 'aegisIntervalReductionMs'
  | 'weaponSlotFlat'
  | 'weaponTierFlat'
  | 'cannonFlat'
  | 'cardChoiceFlat'
  | 'luckPercent'
  | 'xpPercent'
  | 'stardustPercent'
  | 'rerollFlat'
  | 'banishFlat'
  | 'capacitorUnlockFlat'
  | 'capacitorChargePercent'
  | 'surgeDamagePercent'
  | 'surgeDurationMsFlat'
  | 'passivePerWaveFlat'
  | 'interestPercentFlat'
  | 'refundBonusPercent'
  | 'bonusUpgradeChancePercent'

export interface PerkEffect {
  stat: MetaStat
  /** added to the stat total for every rank owned */
  amountPerRank: number
}

export interface Perk {
  id: string
  name: string
  description: string
  icon: string
  rarity: PerkRarity
  /** highest rank that can be bought */
  maxRank: number
  /** stardust cost of rank 1; later ranks scale by RANK_COST_GROWTH */
  baseCost: number
  effects: Array<PerkEffect>
  /** prestige is special: buying it advances prestige and wipes the build */
  special?: 'prestige'
}

/** each additional rank in the same perk costs this much more than the last */
export const RANK_COST_GROWTH = 1.35

/** floor on the aegis block interval no matter how many aegis ranks are bought */
const AEGIS_MIN_INTERVAL_MS = 5_000

/** base fraction of stardust returned when selling a rank */
export const BASE_REFUND_FRACTION = 0.5
/** reclamation can raise the refund fraction no higher than this */
export const MAX_REFUND_FRACTION = 0.9

export const PERKS: Array<Perk> = [
  // ── Common — cheap incremental stats ────────────────────────────────
  {
    id: 'damage',
    name: 'Damage',
    description: '+2% weapon damage per rank',
    icon: '🔩',
    rarity: 'common',
    maxRank: 15,
    baseCost: 30,
    effects: [{ stat: 'damagePercent', amountPerRank: 2 }],
  },
  {
    id: 'crit-chance',
    name: 'Critical Chance',
    description: '+1.5% critical strike chance per rank',
    icon: '🎯',
    rarity: 'common',
    maxRank: 10,
    baseCost: 32,
    effects: [{ stat: 'critChancePercent', amountPerRank: 1.5 }],
  },
  {
    id: 'fire-rate',
    name: 'Fire Rate',
    description: '+2% fire rate (global haste) per rank',
    icon: '⚡',
    rarity: 'common',
    maxRank: 12,
    baseCost: 32,
    effects: [{ stat: 'fireRatePercent', amountPerRank: 2 }],
  },
  {
    id: 'projectile-speed',
    name: 'Projectile Speed',
    description: '+2% projectile speed per rank',
    icon: '🌀',
    rarity: 'common',
    maxRank: 8,
    baseCost: 28,
    effects: [{ stat: 'projectileSpeedPercent', amountPerRank: 2 }],
  },
  {
    id: 'range',
    name: 'Targeting Range',
    description: '+2% targeting range per rank',
    icon: '📡',
    rarity: 'common',
    maxRank: 8,
    baseCost: 28,
    effects: [{ stat: 'rangePercent', amountPerRank: 2 }],
  },
  {
    id: 'max-hp',
    name: 'Max Integrity',
    description: '+5 max integrity per rank',
    icon: '🪨',
    rarity: 'common',
    maxRank: 15,
    baseCost: 30,
    effects: [{ stat: 'maxHpFlat', amountPerRank: 5 }],
  },
  {
    id: 'regen',
    name: 'Integrity Regen',
    description: '+0.2 integrity regen / sec per rank',
    icon: '🩹',
    rarity: 'common',
    maxRank: 10,
    baseCost: 34,
    effects: [{ stat: 'regenPerSecondFlat', amountPerRank: 0.2 }],
  },
  {
    id: 'stardust',
    name: 'Stardust Yield',
    description: '+3% stardust earned per rank',
    icon: '⛏️',
    rarity: 'common',
    maxRank: 10,
    baseCost: 34,
    effects: [{ stat: 'stardustPercent', amountPerRank: 3 }],
  },
  {
    id: 'xp',
    name: 'Experience',
    description: '+2.5% experience gained per rank',
    icon: '🛰️',
    rarity: 'common',
    maxRank: 10,
    baseCost: 34,
    effects: [{ stat: 'xpPercent', amountPerRank: 2.5 }],
  },

  // ── Rare — stronger / secondary stats ───────────────────────────────
  {
    id: 'crit-damage',
    name: 'Critical Damage',
    description: '+0.25× critical strike multiplier per rank',
    icon: '💢',
    rarity: 'rare',
    maxRank: 10,
    baseCost: 120,
    effects: [{ stat: 'critMultiplierFlat', amountPerRank: 0.25 }],
  },
  {
    id: 'luck',
    name: 'Luck',
    description: '+10% odds of rarer cards per rank',
    icon: '🍀',
    rarity: 'rare',
    maxRank: 5,
    baseCost: 140,
    effects: [{ stat: 'luckPercent', amountPerRank: 10 }],
  },
  {
    id: 'interest',
    name: 'Compound Interest',
    description: '+1% interest on unspent stardust per rank',
    icon: '🪙',
    rarity: 'rare',
    maxRank: 10,
    baseCost: 130,
    effects: [{ stat: 'interestPercentFlat', amountPerRank: 1 }],
  },
  {
    id: 'passive-income',
    name: 'Dust Siphon',
    description: '+1 passive stardust per wave reached, per rank',
    icon: '🌫️',
    rarity: 'rare',
    maxRank: 10,
    baseCost: 130,
    effects: [{ stat: 'passivePerWaveFlat', amountPerRank: 1 }],
  },
  {
    id: 'reclamation',
    name: 'Reclamation',
    description: '+5% sell refund per rank (up to a 90% cap)',
    icon: '♻️',
    rarity: 'rare',
    maxRank: 8,
    baseCost: 110,
    effects: [{ stat: 'refundBonusPercent', amountPerRank: 5 }],
  },

  // ── Epic — capacity ─────────────────────────────────────────────────
  {
    id: 'weapon-count',
    name: 'Weapon Count',
    description: '+1 weapon slot per rank',
    icon: '🗄️',
    rarity: 'epic',
    maxRank: 3,
    baseCost: 800,
    effects: [{ stat: 'weaponSlotFlat', amountPerRank: 1 }],
  },
  {
    id: 'weapon-level',
    name: 'Weapon Level Cap',
    description: '+1 max weapon tier (rank past ★5) per rank',
    icon: '🧪',
    rarity: 'epic',
    maxRank: 3,
    baseCost: 800,
    effects: [{ stat: 'weaponTierFlat', amountPerRank: 1 }],
  },
  {
    id: 'card-choice',
    name: 'Card Choice',
    description: '+1 card to choose from on every level-up',
    icon: '🔭',
    rarity: 'epic',
    maxRank: 1,
    baseCost: 900,
    effects: [{ stat: 'cardChoiceFlat', amountPerRank: 1 }],
  },
  {
    id: 'reroll',
    name: 'Tactical Reserve',
    description: '+1 card reroll per run, per rank',
    icon: '🔄',
    rarity: 'epic',
    maxRank: 2,
    baseCost: 700,
    effects: [{ stat: 'rerollFlat', amountPerRank: 1 }],
  },
  {
    id: 'banish',
    name: 'Exclusion Protocol',
    description: '+1 card banish per run, per rank',
    icon: '🚫',
    rarity: 'epic',
    maxRank: 2,
    baseCost: 700,
    effects: [{ stat: 'banishFlat', amountPerRank: 1 }],
  },

  // ── Legendary — system unlocks + build-definers ─────────────────────
  {
    id: 'aegis',
    name: 'Aegis',
    description:
      'Rank 1 unlocks a planetary shield that nullifies one invader impact every 12s; higher ranks shorten the interval.',
    icon: '🛡️',
    rarity: 'legendary',
    maxRank: 4,
    baseCost: 3_000,
    effects: [
      { stat: 'aegisUnlockFlat', amountPerRank: 1 },
      { stat: 'aegisIntervalReductionMs', amountPerRank: 1_500 },
    ],
  },
  {
    id: 'surge',
    name: 'Surge',
    description:
      'Rank 1 unlocks the capacitor — kills charge a battery, and at full charge every weapon surges; higher ranks charge faster and surge harder.',
    icon: '🔋',
    rarity: 'legendary',
    maxRank: 6,
    baseCost: 3_000,
    effects: [
      { stat: 'capacitorUnlockFlat', amountPerRank: 1 },
      { stat: 'capacitorChargePercent', amountPerRank: 15 },
      { stat: 'surgeDamagePercent', amountPerRank: 10 },
    ],
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description:
      '+0.5% weapon damage per player level, per rank — the longer you survive, the deadlier you get.',
    icon: '🎖️',
    rarity: 'legendary',
    maxRank: 4,
    baseCost: 3_000,
    effects: [{ stat: 'damagePerLevelPercent', amountPerRank: 0.5 }],
  },
  {
    id: 'windfall',
    name: 'Windfall',
    description:
      '+4% chance per rank (up to 20%) that a level-up also grants a free random bonus upgrade on top of your pick.',
    icon: '🎁',
    rarity: 'legendary',
    maxRank: 5,
    baseCost: 3_000,
    effects: [{ stat: 'bonusUpgradeChancePercent', amountPerRank: 4 }],
  },
  {
    id: 'prestige',
    name: 'Prestige',
    description:
      'Costs a fortune and RESETS all purchased perks — in exchange, you permanently staff one more gun emplacement.',
    icon: '⟴',
    rarity: 'legendary',
    maxRank: PRESTIGE.maxCannons,
    baseCost: 25_000,
    effects: [],
    special: 'prestige',
  },
]

export const PERKS_BY_ID: Map<string, Perk> = new Map(PERKS.map((perk) => [perk.id, perk]))

/** stardust cost of buying the given rank (1-based) of a perk */
export function perkCostForRank({ perk, rank }: { perk: Perk; rank: number }): number {
  return Math.round(perk.baseCost * RANK_COST_GROWTH ** (rank - 1))
}

/** sum every owned perk's effects into stat totals — ranks are repeated ids */
export function aggregateEffects({
  unlockedNodeIds,
}: {
  unlockedNodeIds: Array<string>
}): Map<MetaStat, number> {
  const totals = new Map<MetaStat, number>()
  for (const perkId of unlockedNodeIds) {
    const perk = PERKS_BY_ID.get(perkId)
    if (perk === undefined) {
      continue
    }
    for (const effect of perk.effects) {
      totals.set(effect.stat, (totals.get(effect.stat) ?? 0) + effect.amountPerRank)
    }
  }
  return totals
}

/** every prestige permanently staffs one more gun emplacement, up to the slot cap */
export function applyPrestige({
  stats,
  prestigeLevel,
}: {
  stats: RunStats
  prestigeLevel: number
}): RunStats {
  return {
    ...stats,
    cannonCount: Math.min(
      PRESTIGE.maxCannons,
      stats.cannonCount + PRESTIGE.bonusCannonsPerLevel * prestigeLevel,
    ),
  }
}

export function buildStartingStats({
  unlockedNodeIds,
}: {
  unlockedNodeIds: Array<string>
}): RunStats {
  const totals = aggregateEffects({ unlockedNodeIds })
  const valueOf = (stat: MetaStat): number => totals.get(stat) ?? 0

  return {
    ...BASE_RUN_STATS,
    cannonCount: BASE_RUN_STATS.cannonCount + valueOf('cannonFlat'),
    weaponTierBonus: BASE_RUN_STATS.weaponTierBonus + valueOf('weaponTierFlat'),
    damage: BASE_RUN_STATS.damage * (1 + valueOf('damagePercent') / 100),
    damagePerLevelPercent: BASE_RUN_STATS.damagePerLevelPercent + valueOf('damagePerLevelPercent'),
    fireIntervalMs: BASE_RUN_STATS.fireIntervalMs / (1 + valueOf('fireRatePercent') / 100),
    projectileSpeed: BASE_RUN_STATS.projectileSpeed * (1 + valueOf('projectileSpeedPercent') / 100),
    range: BASE_RUN_STATS.range * (1 + valueOf('rangePercent') / 100),
    critChance: BASE_RUN_STATS.critChance + valueOf('critChancePercent') / 100,
    pierce: BASE_RUN_STATS.pierce + valueOf('pierceFlat'),
    maxHp: BASE_RUN_STATS.maxHp + valueOf('maxHpFlat'),
    regenPerSecond: BASE_RUN_STATS.regenPerSecond + valueOf('regenPerSecondFlat'),
    // fire rate is global haste: the same boost speeds the main cannon
    // (fireIntervalMs above) and every auxiliary weapon's cooldown
    weaponCooldownFactor:
      BASE_RUN_STATS.weaponCooldownFactor / (1 + valueOf('fireRatePercent') / 100),
    critMultiplier: BASE_RUN_STATS.critMultiplier + valueOf('critMultiplierFlat'),
    aegisIntervalMs:
      valueOf('aegisUnlockFlat') > 0
        ? Math.max(
            AEGIS_MIN_INTERVAL_MS,
            AEGIS_BLOCK_INTERVAL_MS - valueOf('aegisIntervalReductionMs'),
          )
        : null,
    weaponSlots: BASE_RUN_STATS.weaponSlots + valueOf('weaponSlotFlat'),
    cardChoices: BASE_RUN_STATS.cardChoices + valueOf('cardChoiceFlat'),
    rerollsPerRun: BASE_RUN_STATS.rerollsPerRun + valueOf('rerollFlat'),
    banishesPerRun: BASE_RUN_STATS.banishesPerRun + valueOf('banishFlat'),
    luck: BASE_RUN_STATS.luck * (1 + valueOf('luckPercent') / 100),
    xpMultiplier: BASE_RUN_STATS.xpMultiplier * (1 + valueOf('xpPercent') / 100),
    hasCapacitor: valueOf('capacitorUnlockFlat') > 0,
    passiveDustPerWave: BASE_RUN_STATS.passiveDustPerWave + valueOf('passivePerWaveFlat'),
    capacitorChargeRate:
      BASE_RUN_STATS.capacitorChargeRate * (1 + valueOf('capacitorChargePercent') / 100),
    surgeDamageBonus: BASE_RUN_STATS.surgeDamageBonus + valueOf('surgeDamagePercent') / 100,
    surgeDurationMs: BASE_RUN_STATS.surgeDurationMs + valueOf('surgeDurationMsFlat'),
    bonusUpgradeChancePercent:
      BASE_RUN_STATS.bonusUpgradeChancePercent + valueOf('bonusUpgradeChancePercent'),
  }
}

export function stardustMultiplierFrom({
  unlockedNodeIds,
}: {
  unlockedNodeIds: Array<string>
}): number {
  const totals = aggregateEffects({ unlockedNodeIds })
  return 1 + (totals.get('stardustPercent') ?? 0) / 100
}

/** interest rate (percent) paid on unspent stardust at the end of every run */
export function interestPercentFrom({
  unlockedNodeIds,
}: {
  unlockedNodeIds: Array<string>
}): number {
  const totals = aggregateEffects({ unlockedNodeIds })
  return totals.get('interestPercentFlat') ?? 0
}

/** fraction of stardust returned when selling, raised by Reclamation up to the cap */
export function refundFractionFrom({
  unlockedNodeIds,
}: {
  unlockedNodeIds: Array<string>
}): number {
  const totals = aggregateEffects({ unlockedNodeIds })
  const bonus = (totals.get('refundBonusPercent') ?? 0) / 100
  return Math.min(MAX_REFUND_FRACTION, BASE_REFUND_FRACTION + bonus)
}
