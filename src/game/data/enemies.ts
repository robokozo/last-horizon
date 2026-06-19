export type EnemyKind =
  | 'drifter'
  | 'speeder'
  | 'tank'
  | 'elite'
  | 'splitter'
  | 'shardling'
  | 'warden'
  | 'dancer'
  | 'mender'
  | 'mothership'
  | 'dummy'

export interface EnemyDefinition {
  kind: EnemyKind
  textureKey: string
  hp: number
  speed: number
  contactDamage: number
  xpValue: number
  radius: number
  /** wave at which this enemy starts appearing */
  minWave: number
  spawnWeight: number
}

export const ENEMY_DEFINITIONS: Record<EnemyKind, EnemyDefinition> = {
  drifter: {
    kind: 'drifter',
    textureKey: 'enemy-drifter',
    hp: 10,
    speed: 55,
    contactDamage: 8,
    xpValue: 3,
    radius: 12,
    minWave: 1,
    spawnWeight: 10,
  },
  speeder: {
    kind: 'speeder',
    textureKey: 'enemy-speeder',
    hp: 8,
    speed: 110,
    contactDamage: 5,
    xpValue: 4,
    radius: 10,
    minWave: 3,
    spawnWeight: 6,
  },
  tank: {
    kind: 'tank',
    textureKey: 'enemy-tank',
    hp: 70,
    speed: 32,
    contactDamage: 18,
    xpValue: 10,
    radius: 18,
    minWave: 5,
    spawnWeight: 3,
  },
  elite: {
    kind: 'elite',
    textureKey: 'enemy-elite',
    hp: 450,
    speed: 26,
    contactDamage: 35,
    xpValue: 60,
    radius: 26,
    minWave: 5,
    spawnWeight: 0,
  },
  splitter: {
    kind: 'splitter',
    textureKey: 'enemy-splitter',
    hp: 26,
    speed: 48,
    contactDamage: 10,
    xpValue: 8,
    radius: 15,
    minWave: 4,
    spawnWeight: 4,
  },
  shardling: {
    kind: 'shardling',
    textureKey: 'enemy-shardling',
    hp: 4,
    speed: 135,
    contactDamage: 3,
    xpValue: 1,
    radius: 7,
    minWave: 1,
    spawnWeight: 0,
  },
  warden: {
    kind: 'warden',
    textureKey: 'enemy-warden',
    hp: 30,
    speed: 45,
    contactDamage: 12,
    xpValue: 8,
    radius: 14,
    minWave: 6,
    spawnWeight: 3,
  },
  dancer: {
    kind: 'dancer',
    textureKey: 'enemy-dancer',
    hp: 14,
    speed: 70,
    contactDamage: 7,
    xpValue: 6,
    radius: 11,
    minWave: 8,
    spawnWeight: 4,
  },
  mender: {
    kind: 'mender',
    textureKey: 'enemy-mender',
    hp: 26,
    speed: 38,
    contactDamage: 8,
    xpValue: 10,
    radius: 13,
    minWave: 9,
    spawnWeight: 2,
  },
  mothership: {
    kind: 'mothership',
    textureKey: 'enemy-mothership',
    hp: 1_400,
    speed: 11,
    contactDamage: 80,
    xpValue: 0,
    radius: 40,
    minWave: 1,
    spawnWeight: 0,
  },
  dummy: {
    kind: 'dummy',
    textureKey: 'enemy-dummy',
    hp: 1,
    speed: 0,
    contactDamage: 0,
    xpValue: 0,
    radius: 16,
    minWave: 1,
    spawnWeight: 0,
  },
} as const

/**
 * Training-range "mixed" benchmark roster: a seeded blend of real archetypes,
 * spawnable regardless of wave, so a weapon is graded against the natural spread
 * of chaff, bricks, shielded wardens, self-healing menders, and a heavy elite.
 * Weights echo the live spawn table; the elite supplies the high-HP tail.
 */
export const SANDBOX_MIX: Array<{ kind: EnemyKind; weight: number }> = [
  { kind: 'drifter', weight: 10 },
  { kind: 'speeder', weight: 6 },
  { kind: 'dancer', weight: 4 },
  { kind: 'splitter', weight: 4 },
  { kind: 'warden', weight: 3 },
  { kind: 'tank', weight: 3 },
  { kind: 'mender', weight: 2 },
  { kind: 'elite', weight: 1 },
]

export function listSpawnableDefinitions({ wave }: { wave: number }): Array<EnemyDefinition> {
  return Object.values(ENEMY_DEFINITIONS).filter(
    (definition) => definition.spawnWeight > 0 && wave >= definition.minWave,
  )
}

export function pickWeightedDefinition({
  definitions,
  roll,
}: {
  definitions: Array<EnemyDefinition>
  /** random number in [0, 1) */
  roll: number
}): EnemyDefinition {
  const totalWeight = definitions.reduce((sum, definition) => sum + definition.spawnWeight, 0)
  let remaining = roll * totalWeight
  for (const definition of definitions) {
    remaining -= definition.spawnWeight
    if (remaining < 0) {
      return definition
    }
  }
  return definitions[definitions.length - 1]
}
