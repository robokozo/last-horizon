# Between-Run Progression Redesign

Status: **design in progress** — model settled; legendary/signature content and tuning
still open (see "Open decisions").

Replaces the radial paragon **board** with a flat **perk shop**. Touches
[`src/skills/skillTree.ts`](../src/skills/skillTree.ts),
[`src/stores/metaStore.ts`](../src/stores/metaStore.ts), and the board view.

## Why drop the board

The spokes were rotationally symmetric — identical slot geometry on every branch — so
"pathing" was cosmetic; the identity lived entirely in the *content*, not the geometry.
Dropping the board keeps all the identity and deletes pure overhead.

**Deleted:** `SLOT_LAYOUT`, `SLOT_CONNECTIONS`, `polarPoint`, all x/y positions, ring
links, expansion edge-wiring, `listAdjacentNodeIds`, the `availableNodeIdSet` adjacency
logic, the articulation-point gating concern, and the entire board renderer.

**Survives unchanged:** `aggregateEffects`, `buildStartingStats`, every per-stat effect,
the rarity tiers.

**Payoff:** adding a new bonus becomes "add a perk to the list" — no re-pathing, no
position rebalance, no gate to break. Rendering drops from a canvas/graph to a list of
cards.

## The shop model

- Progression is a **flat list of perks** — no spokes, no sections, **no category
  labels**. Perks are grouped visually only by **rarity** (Common → Rare → Epic →
  Legendary). Build identity emerges from *which perks you choose to invest in*, not from
  any imposed structure.
- **One stat = one perk** — no stat appears twice.
- Each perk is a **bonus with ranks**, rendered as a **color-coded card** (by rarity,
  level-up-card palette) showing name, current rank, and **max points** (e.g. "3 / 8"),
  with `+/-` to buy/sell.
- **Cost rises per rank within a perk** (first crit-chance point costs X, next more, next
  more), and each perk has a **max points cap** — soft + hard limits on over-stacking.
- **Selling refunds only partially.** Committing is a real sacrifice; you can't park dust
  in cheap perks and liquidate them at no loss to fund expensive ones. (Reclamation perk
  improves the rate but is capped < 100%, so it can't reopen that exploit.)
- **Signature perks** (the former "keystones") are multi-rank Legendary perks: **rank 1
  unlocks the ability, higher ranks deepen it** (the old separate "amp" is just rank 2+).
  They are *not* a quota — there's no rule that any group "owes" you a signature ability.

### Prestige = the "+1 cannon" perk (resets all progress)

The Prestige perk *is* the only source of another cannon: a single, **very expensive**
buy that grants **+1 permanent cannon** (`applyPrestige`) **and resets all purchased
perks**. It shows a **confirmation warning** before the purchase goes through. This
replaces the old buy-everything gate (`isParagonComplete`) — no micromanaging perks you
don't want just to qualify; you prestige when you decide the cannon is worth wiping your
build for.

### Gating — none; cost is the gate

No unlock requirement, no prerequisites. Higher-rarity perks just **cost more and grant
more**. Save up and buy a Legendary first if you want — you'll have skipped the cheap
foundation, so the run struggles. The build self-regulates difficulty. Rarity is purely
**organizational** (price/power + card color), it locks nothing.

`paragonLevel` (total ranks bought) stays as a progress metric.

## Perk inventory (grouped by rarity)

Provisional contents and rarity placement — both are tunable. ⚠️ = needs a new system.

All perks below map to an existing `RunStats`/`MetaStat` (zero new combat code) except
**Veteran**, which keeps one small mid-run hook (see Deferred). Anything needing a new
system is **deferred** (see that section), not in this list.

**Common** — cheap incremental stats:
% damage · crit chance · fire rate · projectile speed · range · max HP · regen ·
stardust · XP

**Rare** — stronger / secondary stats:
crit damage · luck (rarer cards) · interest · passive income ·
reclamation (better sell refund, capped at 90%)
*(capacitor charge + surge damage are folded into the Surge legendary's ranks)*

**Epic** — capacity (no +cannon — that's the prestige reward):
+1 weapon count (slot) · +1 weapon level cap (rank past ★5) · +1 card choice · +1 reroll ·
+1 banish

**Legendary** — the top tier: **system unlocks** (Aegis, Surge) plus the most
build-defining perks (Veteran). Multi-rank: rank 1 turns it on → higher ranks deepen it.
- **Aegis** — shield blocks an impact every 12s (→ blocks more often / regen on block)
- **Surge (Capacitor Array)** — kills charge a battery; full charge surges all weapons (→ faster charge, harder surge)
- **Veteran** — weapon damage scales per player level (→ steeper rate)
- **Prestige (+1 cannon)** — very high cost; grants +1 permanent cannon and **resets all
  purchased perks** (with a confirmation warning). The only source of extra cannons.

## Perk detail (first pass — all numbers tunable)

Per-rank effects seeded from the old tree's node values. `MetaStat` = the existing key
in `aggregateEffects`/`buildStartingStats` (zero new code) unless marked **NEW**.

### Common — cheap, high max rank (cost rises gently per rank)

| Perk | Per rank | MetaStat | Max | 
|---|---|---|---|
| Damage | +2% damage | `damagePercent` | 15 |
| Crit chance | +1.5% crit chance | `critChancePercent` | 10 |
| Fire rate | +2% fire rate (global haste) | `fireRatePercent` | 12 |
| Projectile speed | +2% projectile speed | `projectileSpeedPercent` | 8 |
| Range | +2% targeting range | `rangePercent` | 8 |
| Max HP | +5 max integrity | `maxHpFlat` | 15 |
| Regen | +0.2 integrity/sec | `regenPerSecondFlat` | 10 |
| Stardust | +3% stardust earned | `stardustPercent` | 10 |
| XP | +2.5% experience | `xpPercent` | 10 |

### Rare — stronger, lower max (cost rises faster)

| Perk | Per rank | MetaStat | Max | Notes |
|---|---|---|---|---|
| Crit damage | +0.25× crit multiplier | `critMultiplierFlat` | 10 | |
| Luck | +10% rarer-card odds | `luckPercent` | 5 | |
| Interest | +1% interest on unspent dust | `interestPercentFlat` | 10 | |
| Passive income | +1 dust/wave reached | `passivePerWaveFlat` | 10 | |
| Reclamation | +5% sell refund, up to a **90% cap** | **NEW** (shop-side) | to 90% cap | |

(Capacitor charge + surge damage moved into the **Surge** legendary's higher ranks — see
below — so they're no longer dead perks in the pool.)

### Epic — capacity, very low max (expensive)

| Perk | Per rank | MetaStat | Max |
|---|---|---|---|
| +1 weapon count | +1 weapon slot | `weaponSlotFlat` | 3 |
| +1 weapon level cap | +1 max tier (past ★5) | `weaponTierFlat` | 3 |
| +1 card choice | +1 card per level-up | `cardChoiceFlat` | 1 |
| +1 reroll | +1 reroll/run | `rerollFlat` | 2 |
| +1 banish | +1 banish/run | `banishFlat` | 2 |

### Legendary — multi-rank abilities (very expensive; rank 1 unlocks → ranks deepen)

| Perk | Rank 1 | Higher ranks | MetaStat | Max |
|---|---|---|---|---|
| **Aegis** | shield blocks 1 impact / 12s | −2s interval per rank (→ ~6s) | `aegisUnlockFlat` + **NEW** interval | 4 |
| **Surge** | unlock capacitor (kills charge it; full charge surges all weapons) | +15% charge & +10% surge dmg per rank | `capacitorUnlockFlat` + `capacitorChargePercent` + `surgeDamagePercent` | 6 |
| **Veteran** | +0.5% damage per player level | +0.5%/level per rank (→ +2%/level) | **NEW** `damagePerLevel` (mid-run hook) | 4 |
| **Prestige (+1 cannon)** | +1 permanent cannon, resets all perks (warning) | each rank = next prestige / next cannon | `cannonFlat` via `applyPrestige` | `PRESTIGE.maxCannons` |

**Only two LIVE perks need new code:** **Reclamation** (a shop-side refund stat, capped at
90%) and **Veteran** (a mid-run damage hook). Everything else reads an existing
`MetaStat`. Folding capacitor charge / surge damage into the Surge legendary removed the
old dead-perk trap (they no longer exist as standalone perks that do nothing pre-capacitor).

## Decisions locked

- **Drop the radial board for a flat perk shop** of `+/-` buy/sell cards.
- **No sections / no category labels** — perks grouped only by **rarity**. Identity comes
  from player choice, not structure. (The old per-spoke identities — Fortune, Sensors,
  Reactor, etc. — were board framing and are gone.)
- **Prestige = the "+1 cannon" perk.** Very expensive; grants +1 permanent cannon and
  **resets all purchased perks** (shows a warning). Replaces the buy-everything gate
  (`isParagonComplete`). The **only** source of extra cannons.
- **"Perk" is the term** (not "node"/"row") — each a color-coded card (by rarity) showing
  name, current rank, and max points, with `+/-` to buy/sell.
- **No unlock gating — cost is the gate.** No cross-perk prerequisites.
- **Refund is partial, not full.** Selling returns only a fraction; full refund would let
  you park dust in cheap perks and liquidate at no loss to fund expensive ones, erasing
  the sacrifice. Reclamation improves the rate but is **capped at 90%**.
- **One stat = one perk** — no stat appears twice.
- **Cost rises per rank**, and each perk has a **max points cap**.
- **Signature perks are multi-rank** — rank 1 unlocks, higher ranks deepen (the former
  "amp" is just rank 2+). Not one-per-group; no quota.
- **No +cannon in the normal pool** — the only way to a new cannon is the Prestige perk
  (which resets your build).
- **Pierce and multishot are NOT progression stats** — weapon/synergy identity levers.
- **Signature perks are abilities,** not stat multipliers.
- **Veteran** scales damage with **player level**, **additive**. First stat that must
  recompute **mid-run** — can't live in `buildStartingStats` (baked once at run start);
  applies live in the damage path. (Kept; see Deferred for the one hook it needs.)
- **Deferred-feature design intent (recorded for when/if we build them):** status effects
  would be generic (`effect duration` + `effect potency`, no per-element split); splash
  damage + size their own perks; lifesteal **on-kill only**; lucky hit needs a proc
  framework; enemy **armor** is **percent-based** with armor-pen = "ignore X%"; the
  player damage-reduction stat is then named **plating**. All in the Deferred section.

## Deferred (revisit later)

Scrapped from the initial shop — each needs new code, and without spoke identities to
fill there's no pressure to build them now. Revisit if the perk pool feels thin. Roughly
by cost:

1. **Enemy armor + armor penetration** — enemies get an `armor` field; damage calc
   mitigates by it, armor-pen claws it back. Touches every damage event. Foundational.
2. **Splash damage % + splash radius** — a global splash modifier weapons read.
3. **Effect duration + effect potency** — global multipliers over the per-synergy status
   numbers in `balance.ts` (freeze/burn/chill). Not a new combat system, but needs new
   `MetaStat`s wired into each status touch-point. *(Borderline — pull back in if wanted.)*
4. **Player plating / damage resist** — needs an incoming-damage model.
5. **Heal-on-kill** — heal hook on the kill event.
6. **Lucky hit** — biggest cost: a proc-trigger framework; weapons/synergies register
   lucky-hit events the stat's chance rolls against.

**Kept despite needing a little new code: Veteran** — damage-per-player-level must
recompute mid-run (can't live in `buildStartingStats`), so it needs one live hook in the
damage path. Kept because it's a Legendary you wanted.

## Open decisions

- **Refund %** — partial is locked; the exact fraction is tuning.
- **Rarity placement** of the Common/Rare/Epic stat perks is a first pass (Legendary is
  now locked to Aegis / Surge / Veteran + Prestige).
- **Perk pool depth** — the no-new-systems pool is lean; pull from Deferred if it feels
  thin.
