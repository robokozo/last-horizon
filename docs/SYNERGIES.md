# Synergy Matrix

The goal: **a synergy for every pair of weapons.** 16 weapons → **120 pairs**. As of 2026-06-13: **32 built, 88 missing**.

Design rules (established in play):

- Gating: synergy cards appear in offers only when both parents are **★2+**.
- Every synergy must have a **visible effect on the playfield** — no invisible math.
- Reusable verbs: burn, freeze, chill, stun, knockback, magnet pull, clouds, mines, fragment rings, swarm leaps, bolts, beam sweeps, drone work.
- Tunables live in `SYNERGIES` in `src/game/data/balance.ts`; cards in `src/game/data/upgrades.ts`; hooks in `GameScene.ts`. The in-game glossary picks new ones up automatically.

## Coverage

| | salvo | flak | flame | devr | rckt | chain | nova | cloud | lock | rail | air | bfg | lance | mines | orbit | nanite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **salvo** | – | ✓ | ✓ | · | ✓ | · | · | · | · | ✓ | · | · | · | · | · | · |
| **flak** | | – | · | ✓ | · | · | · | · | ✓ | · | ✓ | · | · | · | · | · |
| **flame** | | | – | ✓ | ✓ | ✓ | · | · | ✓ | · | · | · | ✓ | · | ✓ | · |
| **devourer** | | | | – | · | · | · | · | · | · | · | · | · | · | · | ✓ |
| **rocket** | | | | | – | · | · | · | · | · | ✓ | · | · | ✓ | · | · |
| **chain** | | | | | | – | · | ✓ | · | ✓ | · | ✓ | · | ✓ | · | · |
| **nova** | | | | | | | – | · | ✓ | · | · | ✓ | · | ✓ | · | · |
| **cloud** | | | | | | | | – | · | · | ✓ | · | ✓ | ✓ | · | · |
| **lockdown** | | | | | | | | | – | ✓ | · | ✓ | ✓ | · | ✓ | · |
| **railgun** | | | | | | | | | | – | · | · | · | · | · | · |
| **airstrike** | | | | | | | | | | | – | · | · | · | · | · |
| **bfg** | | | | | | | | | | | | – | · | · | · | · |
| **lance** | | | | | | | | | | | | | – | · | · | · |
| **mines** | | | | | | | | | | | | | | – | · | · |
| **orbital** | | | | | | | | | | | | | | | – | ✓ |
| **nanite** | | | | | | | | | | | | | | | | – |

## Built (32)

| Synergy | Pair | Effect |
|---|---|---|
| Flak Barrage | Salvo × Flak | flak gun lobs shells at extra targets every cycle |
| Incendiary Rounds | Salvo × Flame | main-gun bullets ignite their targets |
| Momentum | Salvo × Rocket | main-gun kills shave the rocket cooldown |
| Twin Rails | Salvo × Rail Gun | extra rail beams strike separate targets |
| Chain Reaction | Flak × Devourer | flak bursts touch off fresh flak bursts on nearby invaders |
| Cryo Shells | Flak × Lock Down | fragments chill what they strike |
| Cluster Bombs | Flak × Strafing Run | bombs burst into flak fragments |
| Wildfire | Flame × Devourer | burning casualties ignite their neighbors |
| Napalm Warheads | Flame × Rocket | blasts soak the zone in burning fuel |
| Static Discharge | Flame × Tesla Arc | bolts jump extra links per status on their anchor |
| Thermal Shock | Flame × Lock Down | fire + ice detonate, consuming both statuses |
| Thermite Beam | Flame × Thermal Lance | the lance leaves its targets burning |
| Glassed Sky | Flame × Orbital Laser | the strike zone stays molten and burning |
| Mitosis | Devourer × Nanite | swarms split into two payloads on host death |
| Close Air Support | Rocket × Strafing Run | the jet launches rockets mid-pass |
| MIRV Warheads | Rocket × Balloon Mines | blasts scatter armed mines |
| Storm Front | Tesla Arc × Cloud Cover | clouds discharge lightning at invaders inside |
| Ion Rail | Tesla Arc × Rail Gun | beams leave an ionized line that zaps crossers |
| Arc Capacitor | Tesla Arc × BFG | post-discharge bolts stun survivors |
| Magnetic Mines | Tesla Arc × Balloon Mines | armed mines drag invaders into their blast radius |
| Stasis Wave | Nova × Lock Down | pulses flash-freeze everything they hit |
| Capacitor Dump | Nova × BFG | each discharge fires a boosted nova from every cannon |
| Concussive Pulse | Nova × Balloon Mines | pulses shove invaders harder (knockback is base now) |
| Cloud Seeding | Cloud × Strafing Run | the jet trails a contrail of fresh clouds |
| Refraction | Cloud × Thermal Lance | a cloud splits off a second, weaker sweep |
| Smokescreen | Cloud × Balloon Mines | detonations leave a slowing smoke bank |
| Shatterpoint | Lock Down × Rail Gun | frozen invaders take bonus damage from everything |
| EMP Discharge | Lock Down × BFG | the blast flash-freezes the whole field |
| Overwatch | Lock Down × Thermal Lance | frozen invaders never block the beam, take bonus damage |
| Painted Target | Lock Down × Orbital Laser | frozen clusters are priority-painted, locks faster/wider |
| Target Uplink | Orbital Laser × Nanite | drones spot — faster locks, elites painted first |
| Auto-Fabricators | Balloon Mines × Nanite | +1 mine per deployment, higher active cap |

## Missing (88) — design sketches

Pairs are listed once, under the first weapon in canonical order. Names and effects are proposals.

### Salvo Targeting (11 missing)

| Pair | Idea |
|---|---|
| × Devourer | **Live Rounds** — every Nth bullet carries a starter nanite payload that latches onto its victim |
| × Tesla Arc | **Conductor Rounds** — main-gun crits arc a mini-bolt to the nearest invader |
| × Nova | **Shock Salvo** — every nova pulse instantly reloads the guns for a free rapid volley |
| × Cloud | **Cloudpiercers** — bullets passing through a cloud gain +1 pierce and a vapor streak |
| × Lock Down | **Cryo Tracers** — every Nth bullet chills its target |
| × Strafing Run | **Forward Observer** — the guns auto-volley whatever the jet flies over |
| × BFG | **Trigger Coupling** — main-gun crits feed the BFG charge (cooldown shave per crit) |
| × Thermal Lance | **Spotting Rounds** — bullet hits mark targets; the lance ignites on the most-marked enemy with bonus damage |
| × Balloon Mines | **Skeet Loader** — main-gun kills have a chance to lob a free mine at the kill's position |
| × Orbital Laser | **Laser Designators** — every bullet hit on the lock target accelerates the lock |
| × Nanite | **Field Armorers** — drones service the guns: +fire rate for a few seconds after each wave clear |

### Flak Gun (11 missing)

| Pair | Idea |
|---|---|
| × Flame | **Phosphor Shells** — fragments ignite what they strike |
| × Rocket | **Booster Charges** — every Nth flak shell is replaced by a rocket |
| × Tesla Arc | **Ionized Shrapnel** — bursts stun everything inside the smoke ball |
| × Nova | **Concussion Fuses** — bursts shove invaders out of the smoke |
| × Cloud | **Cloudburst** — shells detonating inside a cloud get a bigger blast and seed a fresh puff |
| × Rail Gun | **Sabot Fragment** — one fragment per burst is a mini rail dart that pierces in a line |
| × BFG | **Full Spread** — each discharge instantly bursts every shell in flight: a screen-wide curtain |
| × Thermal Lance | **Airburst Lens** — lance sweeps crossing flak smoke re-detonate it for an echo of fragments |
| × Balloon Mines | **Duds and Daisies** — timed-fuse bursts occasionally leave a live mine drifting where they popped |
| × Orbital Laser | **Triangulation** — each burst near the lock target shaves lock-on time |
| × Nanite | **Reclaimers** — drones sweep up spent fragments; every N collected refunds a flak shot |

### Flamethrower (7 missing)

| Pair | Idea |
|---|---|
| × Nova | **Backdraft** — each pulse fans every active burn: burning enemies take a chunk of remaining burn instantly |
| × Cloud | **Steam Veil** — flame through a cloud turns it scalding: that cloud burns enemies inside |
| × Rail Gun | **Heat Lance** — rail beams superheat, igniting everything along the line |
| × Strafing Run | **Napalm Run** — bombs splash burning fuel in a line under the flight path |
| × BFG | **Pyroclasm** — the discharge ignites everything on screen |
| × Balloon Mines | **Firebomb Balloons** — detonations leave a burning patch that ignites what passes |
| × Nanite | **Stoker Drones** — while any drone is alive: +cone width and +burn duration |

### Devourer Swarm (11 missing)

| Pair | Idea |
|---|---|
| × Rocket | **Carrier Warheads** — blasts release a nanite payload onto the toughest survivor |
| × Tesla Arc | **Neural Link** — bolts striking a devoured host recharge the swarm's budget |
| × Nova | **Feeding Frenzy** — pulses enrage swarms: devour rate doubles for a few seconds |
| × Cloud | **Spore Cover** — swarms eat faster while their host is inside a cloud |
| × Lock Down | **Cold Storage** — frozen hosts are devoured at double speed |
| × Rail Gun | **Injection Round** — a rail kill implants a starter swarm in the next enemy on the line |
| × Strafing Run | **Paradrop** — the jet drops a nanite canister mid-pass |
| × BFG | **Critical Mass** — the discharge supercharges every active swarm's budget |
| × Thermal Lance | **Heat Hatch** — lance hits on devoured hosts split off a bonus mini-swarm |
| × Balloon Mines | **Nesting Charges** — mine detonations release a small swarm onto the nearest survivor |
| × Orbital Laser | **Bio-Targeting** — the laser prioritizes devoured hosts; killing one refunds swarm budget |

### Rocket Pod (9 missing)

| Pair | Idea |
|---|---|
| × Tesla Arc | **Tesla Warheads** — blasts arc chain lightning between survivors |
| × Nova | **Launch Shockwave** — every launch emits a mini-nova at the cannon |
| × Cloud | **Stormchasers** — rockets passing through clouds gain damage and trail vapor |
| × Lock Down | **Cryo Warheads** — blasts chill everything they hit |
| × Rail Gun | **Rail-Assisted Launch** — rockets fire at double speed along a brief rail line |
| × BFG | **Alpha Strike** — each discharge instantly launches a full rocket volley from every cannon |
| × Thermal Lance | **Bearing Lock** — rockets fired during a sweep home toward the beam tip |
| × Orbital Laser | **Danger Close** — rockets landing inside the strike zone get +blast radius |
| × Nanite | **Reload Crews** — each drone alive shaves the rocket cooldown |

### Tesla Arc (6 missing)

| Pair | Idea |
|---|---|
| × Nova | **Ring Circuit** — pulses arc lightning between every enemy they touch |
| × Lock Down | **Supercooled Coils** — bolts freeze their final link solid |
| × Strafing Run | **Wake Turbulence** — the jet trails an EMP wake that stuns under the flight path |
| × Thermal Lance | **Arc Lens** — the beam tip arcs mini-bolts to enemies near the sweep |
| × Orbital Laser | **Lightning Rod** — the strike column is charged: it arcs at everything nearby while firing |
| × Nanite | **Live Wires** — drones zap small stunning bolts at invaders near the buildings they tend |

### Nova Pulse (5 missing)

| Pair | Idea |
|---|---|
| × Cloud | **Pressure Front** — pulses push clouds outward, dragging the slow zone across the field |
| × Rail Gun | **Radial Battery** — at full pulse radius, micro rail-beams fire outward at several enemies |
| × Thermal Lance | **Resonance** — a nova fired during a sweep doubles that sweep's damage |
| × Orbital Laser | **Seismic Lock** — novas mark their epicenter; the next strike there locks instantly |
| × Nanite | **Pulse Chargers** — each drone alive adds pulse radius |

### Cloud Cover (5 missing)

| Pair | Idea |
|---|---|
| × Lock Down | **Freezing Fog** — clouds slowly chill invaders inside, stacking toward a freeze |
| × Rail Gun | **Ceiling Refraction** — rail beams piercing a cloud split into two angled sub-beams |
| × BFG | **Static Charge** — the BFG charges faster per cloud on the field |
| × Orbital Laser | **Lens Array** — strike columns passing through a cloud focus for bonus damage |
| × Nanite | **Cloud Herders** — drones tug clouds toward the densest enemy cluster |

### Lock Down (3 missing)

| Pair | Idea |
|---|---|
| × Strafing Run | **Cryo Bombing** — bombs freeze a small radius on detonation |
| × Balloon Mines | **Bait Charges** — mines deploy preferentially beside frozen invaders (frozen targets attract the magnet pull) |
| × Nanite | **Maintenance Window** — building repairs accelerate per frozen enemy on the field |

### Rail Gun (6 missing)

| Pair | Idea |
|---|---|
| × Strafing Run | **Rods From Wings** — the jet fires one rail shot straight down mid-pass |
| × BFG | **Coilgun Overload** — after each discharge, the next rail shot is instant and pierces everything |
| × Thermal Lance | **Twin Optics** — rail shots during a sweep aim at the lance's blocker for bonus damage |
| × Balloon Mines | **Rail Tether** — beams crossing a mine re-arm it and supercharge its next blast |
| × Orbital Laser | **Orbital Railnet** — every Nth strike is replaced by three instant rail strikes from orbit |
| × Nanite | **Auto-Calibration** — each drone alive adds rail pierce |

### Strafing Run (5 missing)

| Pair | Idea |
|---|---|
| × BFG | **Daisy Cutter** — one pass per BFG cycle drops a single massive bomb |
| × Thermal Lance | **Belly Lance** — the jet carries a downward mini-lance, sweeping under its flight path |
| × Balloon Mines | **Mine-Laying Run** — the jet drops armed mines along its pass |
| × Orbital Laser | **Forward Air Control** — strikes called during a pass lock instantly |
| × Nanite | **Supply Drop** — the jet drops a repair canister that restores integrity where it lands |

### BFG (4 missing)

| Pair | Idea |
|---|---|
| × Thermal Lance | **Focusing Discharge** — the blast supercharges the next lance: it pierces everything for one sweep |
| × Balloon Mines | **Chain Reaction** — the discharge detonates every armed mine simultaneously |
| × Orbital Laser | **Joint Strike** — each discharge calls a free instant orbital strike on the densest cluster |
| × Nanite | **Capacitor Maintenance** — each drone alive shaves the BFG cooldown |

### Thermal Lance (3 missing)

| Pair | Idea |
|---|---|
| × Balloon Mines | **Skywriting** — the sweep deploys a mine at its endpoint when it finishes |
| × Orbital Laser | **Target Painting** — enemies seared by the lance are pre-locked: strikes on them are instant |
| × Nanite | **Beam Splitters** — drones orbit the beam origin; each adds sweep arc |

### Balloon Mines (1 missing)

| Pair | Idea |
|---|---|
| × Orbital Laser | **Gravity Anchor** — the strike zone deploys a small mine cluster after firing |

### Orbital Laser / Nanite Swarm

All remaining pairs for these two are covered above (each pair listed once under its first weapon).
