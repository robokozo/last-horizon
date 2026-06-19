/**
 * A tiny deterministic PRNG (mulberry32). Given the same seed it always yields
 * the same sequence, so a benchmark can hand every weapon the exact same enemy
 * swarm pattern — only the weapon under test changes, never the targets.
 */
export function createSeededRng({ seed }: { seed: number }): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
