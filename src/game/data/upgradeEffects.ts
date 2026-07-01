import {
  AIRDROP,
  AIRSTRIKE,
  BASE_RUN_STATS,
  BFG,
  CHAIN,
  CLOUD,
  CLUSTER_BOMBS,
  DEVOURER,
  FLAK,
  FLAME,
  FROZEN_ORB,
  GRAVITON,
  LANCE,
  LASER,
  LOCKDOWN,
  MINES,
  NOVA,
  NOVA_START_INTERVAL_MS,
  ORBITAL_LASER,
  RAILGUN,
  ROCKET,
  SHATTERPOINT,
  STORM_FRONT,
  SYNERGIES,
} from '@/game/data/balance'
import type { RunStats } from '@/game/types'

/**
 * Single source of truth for weapon scaling. Both the running game (GameScene)
 * and the level-up card preview derive their numbers from the tables here, so a
 * weapon's damage or cooldown curve is defined in exactly one place.
 */

/** per-hit damage multiplier over base bullet damage: base + perLevel × (level − 1) */
const DAMAGE_RAMP: Record<string, { base: number; perLevel: number }> = {
  flame: { base: FLAME.baseDamageMult, perLevel: FLAME.damageMultPerLevel },
  rocket: { base: ROCKET.baseDamageMult, perLevel: ROCKET.damageMultPerLevel },
  chain: { base: CHAIN.baseDamageMult, perLevel: CHAIN.damageMultPerLevel },
  railgun: { base: RAILGUN.baseDamageMult, perLevel: RAILGUN.damageMultPerLevel },
  laser: { base: LASER.baseDamageMult, perLevel: LASER.damageMultPerLevel },
  'frozen-orb': { base: FROZEN_ORB.baseDamageMult, perLevel: FROZEN_ORB.damageMultPerLevel },
  airstrike: { base: AIRSTRIKE.baseDamageMult, perLevel: AIRSTRIKE.damageMultPerLevel },
  bfg: { base: BFG.baseDamageMult, perLevel: BFG.damageMultPerLevel },
  lance: { base: LANCE.baseDamageMult, perLevel: LANCE.damageMultPerLevel },
  mines: { base: MINES.baseDamageMult, perLevel: MINES.damageMultPerLevel },
  'orbital-laser': {
    base: ORBITAL_LASER.baseDamageMult,
    perLevel: ORBITAL_LASER.damageMultPerLevel,
  },
  storm: { base: STORM_FRONT.baseDamageMult, perLevel: STORM_FRONT.damageMultPerLevel },
}

/** cooldown weapons: reload before global haste = clamp(base − step × (level − 1), min) */
const INTERVAL_RAMP: Record<string, { base: number; step: number; min: number }> = {
  flak: { base: FLAK.baseIntervalMs, step: FLAK.intervalStepMs, min: FLAK.minIntervalMs },
  flame: { base: FLAME.baseIntervalMs, step: FLAME.intervalStepMs, min: FLAME.minIntervalMs },
  devourer: {
    base: DEVOURER.baseIntervalMs,
    step: DEVOURER.intervalStepMs,
    min: DEVOURER.minIntervalMs,
  },
  rocket: { base: ROCKET.baseIntervalMs, step: ROCKET.intervalStepMs, min: ROCKET.minIntervalMs },
  chain: { base: CHAIN.baseIntervalMs, step: CHAIN.intervalStepMs, min: CHAIN.minIntervalMs },
  lockdown: {
    base: LOCKDOWN.baseIntervalMs,
    step: LOCKDOWN.intervalStepMs,
    min: LOCKDOWN.minIntervalMs,
  },
  railgun: {
    base: RAILGUN.baseIntervalMs,
    step: RAILGUN.intervalStepMs,
    min: RAILGUN.minIntervalMs,
  },
  laser: { base: LASER.baseIntervalMs, step: LASER.intervalStepMs, min: LASER.minIntervalMs },
  cloud: { base: CLOUD.baseIntervalMs, step: CLOUD.intervalStepMs, min: CLOUD.minIntervalMs },
  'frozen-orb': {
    base: FROZEN_ORB.baseIntervalMs,
    step: FROZEN_ORB.intervalStepMs,
    min: FROZEN_ORB.minIntervalMs,
  },
  airstrike: {
    base: AIRSTRIKE.baseIntervalMs,
    step: AIRSTRIKE.intervalStepMs,
    min: AIRSTRIKE.minIntervalMs,
  },
  bfg: { base: BFG.baseIntervalMs, step: BFG.intervalStepMs, min: BFG.minIntervalMs },
  lance: { base: LANCE.baseIntervalMs, step: LANCE.intervalStepMs, min: LANCE.minIntervalMs },
  mines: { base: MINES.baseIntervalMs, step: MINES.intervalStepMs, min: MINES.minIntervalMs },
  'orbital-laser': {
    base: ORBITAL_LASER.baseIntervalMs,
    step: ORBITAL_LASER.intervalStepMs,
    min: ORBITAL_LASER.minIntervalMs,
  },
  graviton: {
    base: GRAVITON.baseIntervalMs,
    step: GRAVITON.intervalStepMs,
    min: GRAVITON.minIntervalMs,
  },
  storm: {
    base: STORM_FRONT.baseIntervalMs,
    step: STORM_FRONT.intervalStepMs,
    min: STORM_FRONT.minIntervalMs,
  },
}

/** the canonical per-hit damage multiplier for a weapon at a rank (0 if it has none) */
export function weaponDamageMultiplier({
  weaponId,
  level,
}: {
  weaponId: string
  level: number
}): number {
  const ramp = DAMAGE_RAMP[weaponId]
  return ramp === undefined ? 0 : ramp.base + ramp.perLevel * (level - 1)
}

/** the canonical base reload (ms, before global haste/surge) for a weapon at a rank */
export function weaponBaseIntervalMs({
  weaponId,
  level,
}: {
  weaponId: string
  level: number
}): number {
  const ramp = INTERVAL_RAMP[weaponId]
  return ramp === undefined
    ? Number.POSITIVE_INFINITY
    : Math.max(ramp.min, ramp.base - ramp.step * (level - 1))
}

// ── level-up card preview ───────────────────────────────────────────────

type EffectUnit = 'dmg' | 'dps' | 'sec' | 'int' | 'px' | 'percent' | 'deg'

interface EffectLine {
  label: string
  value: number
  unit: EffectUnit
}

export interface EffectDelta {
  label: string
  /** formatted value at the current rank, or null when the card isn't owned yet */
  from: string | null
  /** formatted value at the rank this pick would bring it to */
  to: string
}

/** linear ramp for the preview-only stats (counts, radii, durations) */
function ramp(base: number, perLevel: number, level: number): number {
  return base + perLevel * (level - 1)
}

/** the run's real reload for a weapon at a rank — base curve after global haste */
function reload(weaponId: string, level: number, stats: RunStats): number {
  return weaponBaseIntervalMs({ weaponId, level }) * stats.weaponCooldownFactor
}

/** the run's real per-hit damage for a weapon at a rank */
function hit(weaponId: string, level: number, stats: RunStats): number {
  return stats.damage * weaponDamageMultiplier({ weaponId, level })
}

function formatLine({ value, unit }: EffectLine): string {
  switch (unit) {
    case 'dmg':
      return String(Math.round(value))
    case 'dps':
      return `${Math.round(value)}/s`
    case 'sec':
      return `${(value / 1_000).toFixed(1)}s`
    case 'px':
      return `${Math.round(value)}px`
    case 'percent':
      return `${Math.round(value)}%`
    case 'deg':
      return `${Math.round(value)}°`
    case 'int':
      return String(Math.round(value))
  }
}

type EffectBuilder = (args: { stats: RunStats; level: number }) => Array<EffectLine>

/** weapons + the numeric synergies; cards without an entry simply show no preview */
const EFFECT_BUILDERS: Record<string, EffectBuilder> = {
  // ── weapons ──────────────────────────────────────────────────────────
  salvo: ({ level }) => [
    { label: 'Targets per volley', value: BASE_RUN_STATS.projectileCount + level, unit: 'int' },
  ],
  flak: ({ stats, level }) => [
    {
      label: 'Fragments',
      value: ramp(FLAK.baseFragments, FLAK.fragmentsPerLevel, level),
      unit: 'int',
    },
    {
      label: 'Fragment damage',
      value: (stats.damage * ramp(FLAK.baseDamagePercent, FLAK.damagePercentPerLevel, level)) / 100,
      unit: 'dmg',
    },
    { label: 'Cooldown', value: reload('flak', level, stats), unit: 'sec' },
  ],
  flame: ({ stats, level }) => [
    { label: 'Cone damage', value: hit('flame', level, stats), unit: 'dmg' },
    {
      label: 'Burn',
      value: stats.damage * ramp(FLAME.burnDpsMultBase, FLAME.burnDpsMultPerLevel, level),
      unit: 'dps',
    },
    { label: 'Reach', value: ramp(FLAME.rangePx, FLAME.rangePerLevel, level), unit: 'px' },
    { label: 'Cooldown', value: reload('flame', level, stats), unit: 'sec' },
  ],
  devourer: ({ stats, level }) => [
    {
      label: 'Payload',
      value: stats.damage * ramp(DEVOURER.baseBudgetMult, DEVOURER.budgetMultPerLevel, level),
      unit: 'dmg',
    },
    {
      label: 'Drain',
      value: stats.damage * ramp(DEVOURER.baseDrainMult, DEVOURER.drainMultPerLevel, level),
      unit: 'dps',
    },
    {
      label: 'Leap range',
      value: ramp(DEVOURER.leapRadiusPx, DEVOURER.leapRadiusPerLevel, level),
      unit: 'px',
    },
    { label: 'Cooldown', value: reload('devourer', level, stats), unit: 'sec' },
  ],
  rocket: ({ stats, level }) => [
    { label: 'Blast damage', value: hit('rocket', level, stats), unit: 'dmg' },
    {
      label: 'Blast radius',
      value: ramp(ROCKET.baseRadius, ROCKET.radiusPerLevel, level),
      unit: 'px',
    },
    { label: 'Cooldown', value: reload('rocket', level, stats), unit: 'sec' },
  ],
  chain: ({ stats, level }) => [
    { label: 'Arc damage', value: hit('chain', level, stats), unit: 'dmg' },
    { label: 'Jumps', value: ramp(CHAIN.baseChains, CHAIN.chainsPerLevel, level), unit: 'int' },
    { label: 'Stun', value: ramp(CHAIN.stunMsBase, CHAIN.stunMsPerLevel, level), unit: 'sec' },
    { label: 'Cooldown', value: reload('chain', level, stats), unit: 'sec' },
  ],
  nova: ({ level }) => [
    // static field: % of current hp per pulse, with a per-rank floor and growing radius
    { label: 'Damage', value: NOVA.staticPercent * 100, unit: 'percent' },
    {
      label: 'Floor',
      value: Math.max(NOVA.floorMin, NOVA.floorBase - NOVA.floorPerLevel * (level - 1)) * 100,
      unit: 'percent',
    },
    { label: 'Radius', value: NOVA.radiusBase + NOVA.radiusPerLevel * (level - 1), unit: 'px' },
    { label: 'Cooldown', value: NOVA_START_INTERVAL_MS / Math.pow(1.12, level - 1), unit: 'sec' },
  ],
  railgun: ({ stats, level }) => [
    { label: 'Beam damage', value: hit('railgun', level, stats), unit: 'dmg' },
    { label: 'Cooldown', value: reload('railgun', level, stats), unit: 'sec' },
  ],
  laser: ({ stats, level }) => [
    { label: 'Bolt damage', value: hit('laser', level, stats), unit: 'dmg' },
    { label: 'Blasts per burst', value: LASER.blastsBase + (level - 1), unit: 'int' },
    { label: 'Multi-hit bonus', value: LASER.multiHitBonus * 100, unit: 'percent' },
    { label: 'Cooldown', value: reload('laser', level, stats), unit: 'sec' },
  ],
  'frozen-orb': ({ stats, level }) => [
    { label: 'Icicle damage', value: hit('frozen-orb', level, stats), unit: 'dmg' },
    {
      label: 'Icicles / spray',
      value: ramp(FROZEN_ORB.iceCountBase, FROZEN_ORB.iceCountPerLevel, level),
      unit: 'int',
    },
    {
      label: 'Chill',
      value: ramp(FROZEN_ORB.chillMsBase, FROZEN_ORB.chillMsPerLevel, level),
      unit: 'sec',
    },
    { label: 'Cooldown', value: reload('frozen-orb', level, stats), unit: 'sec' },
  ],
  lance: ({ stats, level }) => [
    { label: 'Sear damage', value: hit('lance', level, stats), unit: 'dmg' },
    {
      label: 'Sweep arc',
      value: ramp(LANCE.sweepArcDegBase, LANCE.sweepArcDegPerLevel, level),
      unit: 'deg',
    },
    { label: 'Cooldown', value: reload('lance', level, stats), unit: 'sec' },
  ],
  airstrike: ({ stats, level }) => [
    { label: 'Bomb damage', value: hit('airstrike', level, stats), unit: 'dmg' },
    {
      label: 'Blast radius',
      value: ramp(AIRSTRIKE.baseBlastRadius, AIRSTRIKE.blastRadiusPerLevel, level),
      unit: 'px',
    },
    { label: 'Cooldown', value: reload('airstrike', level, stats), unit: 'sec' },
  ],
  bfg: ({ stats, level }) => [
    { label: 'Damage (all on screen)', value: hit('bfg', level, stats), unit: 'dmg' },
    { label: 'Cooldown', value: reload('bfg', level, stats), unit: 'sec' },
  ],
  mines: ({ stats, level }) => [
    { label: 'Mine damage', value: hit('mines', level, stats), unit: 'dmg' },
    {
      label: 'Mines per drop',
      value: Math.floor(ramp(MINES.minesPerDrop, MINES.minesPerDropPerLevel, level)),
      unit: 'int',
    },
    {
      label: 'Blast radius',
      value: ramp(MINES.blastRadius, MINES.blastRadiusPerLevel, level),
      unit: 'px',
    },
    { label: 'Cooldown', value: reload('mines', level, stats), unit: 'sec' },
  ],
  'orbital-laser': ({ stats, level }) => [
    { label: 'Strike damage', value: hit('orbital-laser', level, stats), unit: 'dmg' },
    {
      label: 'Strike radius',
      value: ramp(ORBITAL_LASER.strikeRadius, ORBITAL_LASER.strikeRadiusPerLevel, level),
      unit: 'px',
    },
    { label: 'Cooldown', value: reload('orbital-laser', level, stats), unit: 'sec' },
  ],
  graviton: ({ stats, level }) => [
    {
      label: 'Pull radius',
      value: stats.range * GRAVITON.radiusRangeFraction,
      unit: 'px',
    },
    {
      label: 'Pull speed',
      value: ramp(GRAVITON.pullSpeedBase, GRAVITON.pullSpeedPerLevel, level),
      unit: 'px',
    },
    {
      label: 'Duration',
      value: ramp(GRAVITON.durationMsBase, GRAVITON.durationMsPerLevel, level),
      unit: 'sec',
    },
    { label: 'Cooldown', value: reload('graviton', level, stats), unit: 'sec' },
  ],
  lockdown: ({ stats, level }) => [
    {
      label: 'Freeze',
      value: ramp(LOCKDOWN.baseFreezeMs, LOCKDOWN.freezeMsPerLevel, level),
      unit: 'sec',
    },
    {
      label: 'Pulse radius',
      value: ramp(LOCKDOWN.pulseRadius, LOCKDOWN.pulseRadiusPerLevel, level),
      unit: 'px',
    },
    { label: 'Cooldown', value: reload('lockdown', level, stats), unit: 'sec' },
  ],
  cloud: ({ stats, level }) => [
    {
      label: 'Slow',
      value:
        (1 -
          Math.max(
            CLOUD.slowFactorMin,
            CLOUD.slowFactorBase - CLOUD.slowFactorPerLevel * (level - 1),
          )) *
        100,
      unit: 'percent',
    },
    {
      label: 'Clouds / gun',
      value: CLOUD.cloudsPerGun + (level - 1) * CLOUD.cloudsPerStack,
      unit: 'int',
    },
    { label: 'Seed cooldown', value: reload('cloud', level, stats), unit: 'sec' },
  ],
  nanite: ({ level }) => [{ label: 'Repair', value: level, unit: 'dps' }],

  // ── synergy tactics (the numeric ones) ─────────────────────────────────
  storm: ({ stats, level }) => [
    { label: 'Bolt damage', value: hit('storm', level, stats), unit: 'dmg' },
    { label: 'Cooldown', value: reload('storm', level, stats), unit: 'sec' },
  ],
  shatter: ({ level }) => [
    {
      label: 'Bonus vs frozen',
      value: ramp(SHATTERPOINT.baseBonus, SHATTERPOINT.bonusPerLevel, level) * 100,
      unit: 'percent',
    },
  ],
  cluster: ({ stats, level }) => [
    {
      label: 'Fragments',
      value: ramp(CLUSTER_BOMBS.baseFragments, CLUSTER_BOMBS.fragmentsPerLevel, level),
      unit: 'int',
    },
    {
      label: 'Fragment damage',
      value:
        stats.damage * ramp(CLUSTER_BOMBS.baseDamageMult, CLUSTER_BOMBS.damageMultPerLevel, level),
      unit: 'dmg',
    },
  ],
  incendiary: ({ stats, level }) => [
    {
      label: 'Burn',
      value:
        stats.damage *
        ramp(SYNERGIES.incendiary.burnDpsMultBase, SYNERGIES.incendiary.burnDpsMultPerLevel, level),
      unit: 'dps',
    },
  ],
  napalm: ({ stats, level }) => [
    {
      label: 'Burn',
      value:
        stats.damage *
        ramp(SYNERGIES.napalm.burnDpsMultBase, SYNERGIES.napalm.burnDpsMultPerLevel, level),
      unit: 'dps',
    },
  ],
  thermite: ({ stats, level }) => [
    {
      label: 'Burn',
      value:
        stats.damage *
        ramp(SYNERGIES.thermite.burnDpsMultBase, SYNERGIES.thermite.burnDpsMultPerLevel, level),
      unit: 'dps',
    },
  ],
  glassed: ({ stats, level }) => [
    {
      label: 'Burn',
      value:
        stats.damage *
        ramp(SYNERGIES.glassed.burnDpsMultBase, SYNERGIES.glassed.burnDpsMultPerLevel, level),
      unit: 'dps',
    },
  ],
  thermalshock: ({ stats, level }) => [
    {
      label: 'Burst damage',
      value:
        stats.damage *
        ramp(
          SYNERGIES.thermalshock.burstDamageMultBase,
          SYNERGIES.thermalshock.burstDamageMultPerLevel,
          level,
        ),
      unit: 'dmg',
    },
  ],
  overwatch: ({ level }) => [
    {
      label: 'Bonus vs frozen',
      value:
        (SYNERGIES.overwatch.frozenDamageBonusBase +
          SYNERGIES.overwatch.frozenDamageBonusPerLevel * Math.max(0, level - 1)) *
        100,
      unit: 'percent',
    },
  ],
  seeker: ({ level }) => [
    {
      label: 'Turn rate',
      value: SYNERGIES.seeker.turnRateDegBase + SYNERGIES.seeker.turnRateDegPerLevel * (level - 1),
      unit: 'deg',
    },
  ],
  frostseeker: ({ level }) => [
    {
      label: 'Turn rate',
      value:
        SYNERGIES.frostseeker.turnRateDegBase +
        SYNERGIES.frostseeker.turnRateDegPerLevel * (level - 1),
      unit: 'deg',
    },
  ],
  flakcascade: ({ level }) => [
    {
      label: 'Branches per burst',
      value:
        SYNERGIES.flakcascade.branchesBase + SYNERGIES.flakcascade.branchesPerLevel * (level - 1),
      unit: 'int',
    },
    { label: 'Chain depth', value: SYNERGIES.flakcascade.maxGenerations, unit: 'int' },
  ],
  airdrop: ({ level }) => [
    {
      label: 'Crate every',
      value: Math.max(
        AIRDROP.minDropIntervalMs,
        AIRDROP.dropIntervalMsBase - AIRDROP.dropIntervalStepMs * (level - 1),
      ),
      unit: 'sec',
    },
    {
      label: 'Repair',
      value: AIRDROP.repairIntegrity + AIRDROP.repairPerLevel * (level - 1),
      unit: 'int',
    },
    {
      label: 'Stardust',
      value: AIRDROP.stardust + AIRDROP.stardustPerLevel * (level - 1),
      unit: 'int',
    },
  ],
}

/** the before→after stat lines for bumping a card from its current rank by one */
export function previewEffects({
  id,
  stats,
  currentLevel,
}: {
  id: string
  stats: RunStats
  currentLevel: number
}): Array<EffectDelta> {
  const builder = EFFECT_BUILDERS[id]
  if (builder === undefined) {
    return []
  }
  const next = builder({ stats, level: currentLevel + 1 })
  const current = currentLevel >= 1 ? builder({ stats, level: currentLevel }) : null
  return next.map((line, index) => ({
    label: line.label,
    from: current !== null ? formatLine(current[index]) : null,
    to: formatLine(line),
  }))
}
