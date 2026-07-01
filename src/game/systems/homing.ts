import Phaser from 'phaser'

// ── mini-ECS: the homing system ──────────────────────────────────────────────
//
// "Homing" is a component (data) that any moving projectile can carry, and
// applyHoming is the system (behavior) that steers anything carrying it. Neither
// knows or cares whether the thing is a rocket, an icicle, or a future kind — it
// only needs to move (Steerable) and have something to chase (Targetable). That
// decoupling is the whole point: one synergy resolves the component onto a
// projectile at spawn, and this one system makes every carrier home, everywhere.

/** anything the homing system can steer: it has a sprite and a velocity. */
export interface Steerable {
  image: Phaser.GameObjects.Image
  velocityX: number
  velocityY: number
}

/** anything the homing system can chase: it has a position and can die. */
export interface Targetable {
  image: { x: number; y: number }
  isDead: boolean
}

/**
 * A resolved homing behavior, attached to a projectile at spawn time. The turn
 * rate is baked in from synergy state when the projectile is created, so the
 * system never has to look at run stats — it just reads the component.
 */
export interface HomingComponent {
  /** how fast the carrier may turn toward its target, in degrees per second */
  turnRateDeg: number
  /** the target it currently tracks; re-acquired only when that target dies */
  target: Targetable | null
}

/** the nearest living target to a point, or null if the pool is empty/all dead. */
function nearestTarget({
  x,
  y,
  targets,
}: {
  x: number
  y: number
  targets: Iterable<Targetable>
}): Targetable | null {
  let nearest: Targetable | null = null
  let nearestSq = Number.POSITIVE_INFINITY
  for (const candidate of targets) {
    if (candidate.isDead === true) {
      continue
    }
    const distanceSq = (candidate.image.x - x) ** 2 + (candidate.image.y - y) ** 2
    if (distanceSq < nearestSq) {
      nearestSq = distanceSq
      nearest = candidate
    }
  }
  return nearest
}

/**
 * Steer one carrier toward its tracked target for a single frame, turning no
 * faster than its component allows. Speed is preserved; only heading changes.
 * The carrier keeps its target until it dies, then re-acquires the nearest —
 * this is what lets a projectile chase the cluster it was aimed at rather than
 * flip-flopping between whoever happens to be closest each frame.
 */
export function applyHoming({
  entity,
  homing,
  targets,
  deltaSeconds,
}: {
  entity: Steerable
  homing: HomingComponent
  targets: Iterable<Targetable>
  deltaSeconds: number
}): void {
  if (homing.target === null || homing.target.isDead === true) {
    homing.target = nearestTarget({ x: entity.image.x, y: entity.image.y, targets })
  }
  const target = homing.target
  if (target === null) {
    return
  }
  const speed = Math.hypot(entity.velocityX, entity.velocityY)
  const currentAngle = Math.atan2(entity.velocityY, entity.velocityX)
  const desiredAngle = Math.atan2(target.image.y - entity.image.y, target.image.x - entity.image.x)
  const maxTurn = Phaser.Math.DegToRad(homing.turnRateDeg) * deltaSeconds
  const turn = Phaser.Math.Clamp(
    Phaser.Math.Angle.Wrap(desiredAngle - currentAngle),
    -maxTurn,
    maxTurn,
  )
  const newAngle = currentAngle + turn
  entity.velocityX = Math.cos(newAngle) * speed
  entity.velocityY = Math.sin(newAngle) * speed
  entity.image.setRotation(newAngle)
}
