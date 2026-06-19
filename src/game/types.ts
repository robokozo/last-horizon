export interface RunStats {
  damage: number
  /** number of deployed cannons, each running its own fire cooldown */
  cannonCount: number
  fireIntervalMs: number
  projectileCount: number
  projectileSpeed: number
  /** max distance in px a projectile travels; the turret holds fire until an enemy is inside it */
  range: number
  pierce: number
  critChance: number
  critMultiplier: number
  maxHp: number
  regenPerSecond: number
  xpMultiplier: number
  /** multiplier on the odds of rare/epic level-up cards (1 = base odds) */
  luck: number
  /** how many distinct weapon types can be carried at once */
  weaponSlots: number
  /** extra max tiers granted to every weapon card by the paragon tree */
  weaponTierBonus: number
  /** multiplier on every auxiliary weapon cooldown — fire-rate bonuses are global haste */
  weaponCooldownFactor: number
  /** how many cards each level-up offers (base 3, raised by paragon nodes) */
  cardChoices: number
  /** card rerolls available per run (base 1, raised by paragon reroll nodes) */
  rerollsPerRun: number
  /** card banishes available per run — base 0, only paragon nodes grant them */
  banishesPerRun: number
  /** the capacitor is a paragon keystone unlock, like the aegis shield */
  hasCapacitor: boolean
  /** stardust generated per wave reached (reactor dust siphons) — scales with how deep you push */
  passiveDustPerWave: number
  /** multiplier on how fast kills charge the capacitor */
  capacitorChargeRate: number
  /** all-weapon damage bonus while a surge is active (0.25 = +25%) */
  surgeDamageBonus: number
  surgeDurationMs: number
  /** null means novas are not unlocked for this run */
  novaIntervalMs: number | null
  novaDamage: number
  /** null means the aegis shield is not unlocked; otherwise ms between blocked impacts */
  aegisIntervalMs: number | null
  /** 0 means the weapon is not unlocked for this run */
  flakLevel: number
  flameLevel: number
  devourerLevel: number
  rocketLevel: number
  chainLevel: number
  cloudLevel: number
  lockdownLevel: number
  railgunLevel: number
  airstrikeLevel: number
  bfgLevel: number
  lanceLevel: number
  mineLevel: number
  orbitalLaserLevel: number
  /** synergy tactics — only offered once both parent weapons are ranked up */
  stormLevel: number
  clusterLevel: number
  shatterLevel: number
  paintedLevel: number
  seedingLevel: number
  casLevel: number
  ionLevel: number
  stasisLevel: number
  capdumpLevel: number
  fabricatorLevel: number
  mirvLevel: number
  barrageLevel: number
  twinRailLevel: number
  mitosisLevel: number
  incendiaryLevel: number
  napalmLevel: number
  wildfireLevel: number
  thermiteLevel: number
  thermalShockLevel: number
  dischargeLevel: number
  empLevel: number
  arcCapLevel: number
  glassedLevel: number
  uplinkLevel: number
  refractionLevel: number
  overwatchLevel: number
  concussiveLevel: number
  magnetLevel: number
  smokescreenLevel: number
  cryoLevel: number
  salvageLevel: number
  momentumLevel: number
  airdropLevel: number
  seekerLevel: number
}

export type UpgradeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type UpgradeCategory = 'weapon' | 'tactic'

export interface HudSnapshot {
  hp: number
  maxHp: number
  level: number
  xp: number
  xpToNext: number
  wave: number
  kills: number
  elapsedMs: number
  /** capacitor fill fraction 0..1, or null when the keystone isn't unlocked */
  capacitor: number | null
  /** current card stacks by upgrade id — drives glossary highlighting */
  cardStacks: Record<string, number>
  /** all weapons are surging — the capacitor is discharging */
  isSurging: boolean
  /** null unless a mothership is on the field */
  boss: { hp: number; maxHp: number } | null
}

export interface UpgradeChoice {
  id: string
  name: string
  description: string
  rarity: UpgradeRarity
  category: UpgradeCategory
  currentStacks: number
  maxStacks: number
  /** for synergy tactics: the parent cards, e.g. "Tesla Arc ★2 + Cloud Cover ★2" */
  synergyOf: string | null
  /** real before→after stat changes this pick makes, for the card to show */
  effects?: Array<{ label: string; from: string | null; to: string }>
}

export interface LevelUpOffer {
  level: number
  choices: Array<UpgradeChoice>
  weaponSlotsUsed: number
  weaponSlotsTotal: number
  /** rerolls remaining for the whole run */
  rerollsLeft: number
  /** banishes remaining for the whole run */
  banishesLeft: number
}

export interface RunResult {
  waveReached: number
  kills: number
  level: number
  elapsedMs: number
  stardustEarned: number
  /** per-weapon damage totals for the run summary, sorted descending */
  damageBySource: Array<{ source: string; total: number }>
  /** the run's final card tiers by upgrade id (weapons + tactics that were picked) */
  cardStacks: Record<string, number>
}

export interface SandboxStatsEntry {
  source: string
  total: number
  dps: number
}

export interface SandboxLayout {
  /**
   * 'field' = static rows of targets, 'boss' = one big single target,
   * 'stream' = a never-ending wave of uniform, non-damaging invaders that flow
   * in and die — the honest DPS benchmark target.
   */
  formation: 'field' | 'boss' | 'stream'
  /** 1 = default spacing; lower packs the dummies tighter */
  spread: number
  /** dummies patrol side to side on a sine, with honest velocity for intercepts */
  isMoving: boolean
  /** false silences the main cannons, isolating whatever ability is being tested */
  isMainGunEnabled: boolean
  /** dummy hit points; null = invincible. Finite dummies die and respawn, for testing kill-triggered effects */
  dummyHp: number | null
  /**
   * 'stream' only: seeds the spawn RNG so every weapon faces the identical swarm.
   * The stream's positions and timing derive from this alone, independent of any
   * weapon-side randomness (crits, spread), so runs stay comparable.
   */
  seed?: number
  /**
   * 'stream' only: when true the wave is a seeded mix of real enemy archetypes
   * (chaff, tanks, wardens, elites…) instead of one uniform dummy — a realistic
   * blend of low and high HP. `dummyHp` is ignored; `mixHpScale` scales the roster.
   */
  enemyMix?: boolean
  /** multiplies every mixed enemy's base HP, to model later waves (default 1) */
  mixHpScale?: number
}

export interface GameSceneData {
  startingStats: RunStats
  stardustMultiplier: number
  /** widens the arena (zoom-out) — the cannon bonus is already baked into startingStats */
  prestigeLevel?: number
  /** 'sandbox' spawns invincible dummies, disables waves, and reports per-weapon dps */
  mode?: 'normal' | 'sandbox'
  /** sandbox only: pre-applied card stacks so visuals (drones, clouds…) match */
  initialCardStacks?: Record<string, number>
  sandboxLayout?: SandboxLayout
}
