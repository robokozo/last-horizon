export type PatchNoteKind = 'new' | 'balance' | 'fix'

export interface PatchNote {
  kind: PatchNoteKind
  text: string
}

export interface PatchEntry {
  /** ISO date the patch shipped */
  date: string
  title: string
  /** optional one-line flavor under the title */
  blurb?: string
  notes: Array<PatchNote>
}

/**
 * Player-facing patch notes, newest first. Every gameplay-visible change
 * ships with an entry here — keep the language about what players feel,
 * not how it's implemented.
 */
export const PATCH_NOTES: Array<PatchEntry> = [
  {
    date: '2026-06-24',
    title: 'Gravity & Rotation',
    notes: [
      {
        kind: 'fix',
        text: 'Rotating your device no longer restarts your run. The game just refits to the new screen instead of rebuilding the arena.',
      },
      {
        kind: 'balance',
        text: 'Graviton Well reworked: its pull now reaches as far as your guns do (and grows with range upgrades) instead of a fixed short bubble, its projectile flies out faster to reach the swarm, and its maximum radius is reined in. Each rank now makes the pull stronger rather than wider.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Two New Combos',
    notes: [
      {
        kind: 'new',
        text: 'New synergy — Vanguard (Strafing Run × Laser Blaster): strafing jets fire laser volleys straight ahead of their run, clearing a path through the swarm.',
      },
      {
        kind: 'new',
        text: 'New synergy — Frost Burst (Flak Gun × Frozen Orb): every flak detonation drops a frozen orb that lingers where it bursts, spraying chilling icicles for a few seconds.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Smoke Signals',
    notes: [
      {
        kind: 'fix',
        text: 'Fixed Smokescreen (Balloon Mines × Cloud Cover) not laying down smoke — the reworked Cloud Cover was filling every cloud slot itself, leaving no room for mine-detonation smoke. Its cover now stops short so smokescreen (and jet seeding) can add their own.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Seeding the Sky',
    notes: [
      {
        kind: 'balance',
        text: 'The Graviton Well is now fired from every gun — each emplacement lobs its own slow-drifting well at the swarm, so its clumping power scales with your battery like everything else.',
      },
      {
        kind: 'new',
        text: 'Cloud Cover is reworked into an active weapon that fits its fantasy: each gun lobs a seeder canister arcing into the sky that bursts into a slowing cloud where it lands. More guns and higher ranks seed a thicker deck.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Scaling with the Battery',
    blurb: 'The battlefield weapons now grow with how many guns you field.',
    notes: [
      {
        kind: 'balance',
        text: 'Every weapon now scales with your gun count — before, some (Strafing Run, Orbital Laser, BFG, Cloud Cover) were fixed no matter how many guns you had, which fell behind as you unlocked more emplacements.',
      },
      {
        kind: 'balance',
        text: 'Strafing Run now launches one jet per gun (a whole squadron crisscrossing), and Orbital Laser calls one strike per gun, spread across the field instead of stacking on one spot. Their per-hit damage is trimmed to account for the extra volume.',
      },
      {
        kind: 'balance',
        text: 'The BFG discharge now scales with your gun count (still one big screen-clearing blast, not a wall of flashes), with its base damage cut to keep it fair at a single gun. Cloud Cover likewise lays down clouds per gun.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Wells & Weather',
    notes: [
      {
        kind: 'fix',
        text: 'The Graviton Well now fires from a gun as a slow-drifting projectile that sweeps its pull across the field, instead of just popping into existence over the swarm.',
      },
      {
        kind: 'balance',
        text: 'Cloud Cover now generates more clouds the more guns you field — a bigger battery lays down a thicker deck of slowing cover.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Rail Gun Nerf',
    notes: [
      {
        kind: 'balance',
        text: 'The Rail Gun was overperforming. Its beam now hits for less per shot (base ×5→×3.5 damage, and less per rank) and reloads slower (5.5s→6.5s, and a higher floor at high ranks). It still skewers everything along the line — it just does it less often and a bit softer.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Sound & Rotation Fixes',
    notes: [
      {
        kind: 'fix',
        text: 'Fixed the sound effects at the very start of a run sometimes not playing — audio is now warmed up on your first tap so nothing gets dropped.',
      },
      {
        kind: 'fix',
        text: 'Fixed the game not re-fitting the screen when you rotate your device. It now refits on rotation, and rebuilds the arena for the new shape if you flip between portrait and landscape.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Airburst',
    blurb: 'Flak detonations hit harder and look the part.',
    notes: [
      {
        kind: 'balance',
        text: 'Flak Gun detonations now throw off an airburst shockwave that splashes damage on every invader caught around the burst, not just the one that tripped the fuse — on top of the usual fragment spray. Higher ranks widen the blast.',
      },
      {
        kind: 'new',
        text: 'Flak bursts got a glow-up: a bright flash, an orange fireball, twin expanding shockwave rings, and a shower of sparks, with a little screen kick on the detonation.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Grounded',
    blurb: 'Balloon Mines stay where you plant them.',
    notes: [
      {
        kind: 'balance',
        text: 'Balloon Mines are no longer lobbed into the sky. They now inflate on the ground right beside the gun that fired them and gently float up from there to take station (Magnetic Mines still homes them onto targets).',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Cold Front, Hot Streak',
    blurb: 'Two new weapons join the arsenal.',
    notes: [
      {
        kind: 'new',
        text: 'New weapon — Frozen Orb: launches a slow spinning orb that drifts across the sky radiating short-lived icicles in every direction, chilling whatever they pierce. Ranking it up sprays more icicles, faster and harder, with a longer chill.',
      },
      {
        kind: 'new',
        text: 'New weapon — Laser Blaster: fires a quick burst of laser bolts with a little spread, and the more bolts that land on the same invader the more bonus damage they pile on. Each rank adds another bolt to the burst (plus faster, stronger).',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Sky Sweeper',
    blurb: 'The Thermal Lance reborn as a sky-wide sweep.',
    notes: [
      {
        kind: 'balance',
        text: 'Thermal Lance reworked. Instead of snapping to the nearest cluster and stopping at the first invader, the beam now sweeps the entire firing arc edge to edge at full range, searing every invader it crosses along the way.',
      },
      {
        kind: 'new',
        text: 'As the lance sweeps it lays down a burning trail across the sky — a temporary damage zone that keeps scorching anything standing in its path for a moment after the beam passes.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'Range Tidy-up',
    blurb: 'Training Range presets speak the perk shop’s language.',
    notes: [
      {
        kind: 'fix',
        text: 'Training Range controls now match the perk shop: the build preset is labelled “Perks” with None / Legendary / Full options (instead of the old “Paragon / keystones”), and the manual card cap goes one tier higher to match the Weapon Level Cap perk.',
      },
    ],
  },
  {
    date: '2026-06-24',
    title: 'On Target',
    blurb: 'Training Range targets stay in range on mobile.',
    notes: [
      {
        kind: 'fix',
        text: 'Fixed Training Range dummies spawning out of gun range on a tall phone screen — the target rows now sit just in front of the cannons whatever the screen shape, so your guns can actually reach them.',
      },
    ],
  },
  {
    date: '2026-06-23',
    title: 'Range Rover',
    blurb: 'Mobile-friendly Training Range and a few visual touch-ups.',
    notes: [
      {
        kind: 'fix',
        text: 'The Training Range now works on phones: the control panel collapses into a slide-in drawer with a ☰ button, so the range fills the screen instead of being crowded out by the settings.',
      },
      {
        kind: 'fix',
        text: 'The Aegis shield now glows over every cannon, not just the first — each one charges and flashes with the block.',
      },
      {
        kind: 'fix',
        text: 'The consolation level-up cards (Stardust Cache, Field Repairs, Ammo Overcharge) now show up in a random order instead of always landing in the same slots.',
      },
    ],
  },
  {
    date: '2026-06-23',
    title: 'Scorched Sky',
    blurb: 'The thermal lance now brands the sky.',
    notes: [
      {
        kind: 'new',
        text: 'The Thermal Lance now leaves a glowing scorch streak across the sky along the arc its beam swept, smoldering for a moment before it fades. Refraction echoes leave their own smaller burns.',
      },
    ],
  },
  {
    date: '2026-06-23',
    title: 'The Paragon Shop',
    blurb: 'The paragon board is gone — meet the perk shop.',
    notes: [
      {
        kind: 'new',
        text: 'Paragon is reborn as a perk shop. The sprawling skill board is replaced by a clean list of perks grouped by rarity — Common, Rare, Epic, Legendary. Buy ranks of whatever you want with + and sell them back with −; each rank of a perk costs a little more than the last. No more pathing or unlocking adjacent nodes — just buy what your build wants.',
      },
      {
        kind: 'new',
        text: 'Legendary perks are the headliners: Aegis (the planetary shield), Surge (the capacitor — kills charge a battery that surges every weapon), and Veteran (your weapon damage now climbs with every level you reach in a run). Higher ranks deepen each one.',
      },
      {
        kind: 'new',
        text: 'Prestige is now a perk you buy. It costs a fortune and resets all your purchased perks, but permanently staffs another gun emplacement — take it whenever you decide the extra cannon is worth wiping your build for. No more buying out the entire board first.',
      },
      {
        kind: 'balance',
        text: 'Selling a perk refunds only part of what you paid (50% to start), so every purchase is a real choice. The new Reclamation perk raises that refund rate up to a 90% cap. Because progression changed shape, existing paragon progress has been refunded as stardust so you can re-spend it in the new shop.',
      },
      {
        kind: 'new',
        text: 'New Legendary perk — Windfall: every level-up has a chance (up to 20% at max rank) to also drop a free random bonus upgrade on top of the card you pick.',
      },
      {
        kind: 'fix',
        text: 'Level-up cards are less cluttered: each card now shows its name and the concrete stat changes, with the longer description tucked behind a ⓘ toggle you can expand when you want the details.',
      },
    ],
  },
  {
    date: '2026-06-21',
    title: 'Event Horizon',
    blurb: 'A new weapon that gathers the swarm into a neat little ball for you.',
    notes: [
      {
        kind: 'new',
        text: 'New weapon — Graviton Well: periodically collapses a gravity well over the densest cluster, dragging invaders into a tight ball. It deals no damage on its own — its whole job is to herd the swarm so your flak, rockets, nova, and orbital strikes land on everything at once. Ranking it up means a stronger pull, wider reach, longer hold, and a shorter cooldown.',
      },
      {
        kind: 'balance',
        text: 'Magnetic Mines (Tesla Arc × Balloon Mines) is reworked: instead of dragging invaders toward a stationary mine, the armed mine now magnetizes to the enemy — it homes in on the nearest invader and chases it down to detonate. Ranking it up widens the sensing range and speeds up the homing.',
      },
    ],
  },
  {
    date: '2026-06-20',
    title: 'Thicker Smoke',
    blurb: 'Smokescreen finally pulls its weight — and the game shows you what changed.',
    notes: [
      {
        kind: 'balance',
        text: 'Smokescreen (Mine Layer × Cloud Cover) now leaves far more room for its smoke. The banks share the Cloud Cover deck as before, but the ceiling is raised much higher per rank (+6 clouds per level instead of +2), so detonations keep laying down fresh slowing smoke instead of hitting the cap almost immediately.',
      },
      {
        kind: 'new',
        text: 'The game now pops a “What’s New” summary the first time you load a new version, so you never miss a balance change or a fresh synergy.',
      },
    ],
  },
  {
    date: '2026-06-19',
    title: 'Roaming Beam',
    blurb: 'The rail gun reaches forever, and the orbital strike learns to walk.',
    notes: [
      {
        kind: 'balance',
        text: 'Rail Gun now has unlimited range — its beam reaches clear across the field, so it no longer holds fire waiting for targets to wander into a range ring.',
      },
      {
        kind: 'balance',
        text: 'Rail Gun no longer tries to aim for the most dangerous invader — it simply points at the NEAREST one and fires. Anything else the beam happens to skewer along that line is coincidental.',
      },
      {
        kind: 'new',
        text: 'New synergy — Orbital Sweep (Orbital Laser ★2 + Lance ★2): instead of one instant blast from orbit, the beam stays lit and a column of annihilation roams across the battlefield for several seconds, raking everything it crosses. Ranking it up lengthens the sweep.',
      },
      {
        kind: 'balance',
        text: 'Boss motherships now hover lower and heave vertically — diving in toward the city and rising back out as they drift side to side, instead of sliding flatly across the top of the screen.',
      },
      {
        kind: 'new',
        text: 'New synergy — Chain Reaction (Flak Gun ★2 + Devourer Swarm ★2): flak bursts are now unstable. Every detonation touches off fresh flak bursts on nearby invaders, which set off still more — a chain reaction that ripples through a packed swarm. Ranking it up adds more branches per burst. It replaces Salvage Protocol on the Flak × Devourer pair (one synergy per pair).',
      },
    ],
  },
  {
    date: '2026-06-19',
    title: 'Static Field',
    blurb: 'Nova Pulse — and your synergies — become tank-melting static fields.',
    notes: [
      {
        kind: 'balance',
        text: 'Nova Pulse is reworked into a static-field discharge: each pulse strips 25% of the CURRENT health of every invader around the city — it shreds tanks, elites, and bosses but can’t finish off chaff. Ranking it up widens the field and lowers the floor it can grind targets down to (50% at ★1 → just 5% at ★5). The old knockback is gone.',
      },
      {
        kind: 'new',
        text: 'Damaging synergies now arc static too: a damaging synergy turns its weapon into a static emitter — every hit first strips 25% of nearby invaders’ current health (down to a 15% floor) before its own damage lands. Trivial against chaff, brutal on tanks and bosses — synergy builds finally have an answer to the big health bars.',
      },
      {
        kind: 'balance',
        text: 'Nova’s synergies (Stasis Wave, Capacitor Dump, Concussive Pulse) are removed for now — they were built around the old knockback/flat-damage pulse and will be re-planned around the new static field.',
      },
      {
        kind: 'fix',
        text: 'The Paragon screen’s top bar no longer crams off the edge on mobile — the controls wrap and shrink to fit small screens.',
      },
      {
        kind: 'fix',
        text: 'The run recap no longer shows an empty “boss” damage bar (a zero-damage death shockwave was being counted as a weapon).',
      },
      {
        kind: 'balance',
        text: 'Supply Drop crates drop noticeably less often and repair a little less — it was over-strong.',
      },
    ],
  },
  {
    date: '2026-06-19',
    title: 'Care Package',
    blurb: 'Two new synergies, and a clearer freeze.',
    notes: [
      {
        kind: 'new',
        text: 'Supply Drop (Strafing Run × Nanite Swarm): the jet parachutes care packages that drift down and pay a random boon when they land — city integrity, banked stardust, or a jolt of capacitor charge. Higher ranks drop more crates with bigger payouts.',
      },
      {
        kind: 'new',
        text: 'Seeker Warheads (Rocket Pod × Lock Down): target-lock guidance steers each rocket onto the cluster it was fired at as the invaders drift — no more rockets sailing through empty sky where the crowd used to be. Higher ranks turn tighter.',
      },
      {
        kind: 'new',
        text: 'Lock Down now leaves a lingering frost field over the frozen zone, fading out as the hold expires — you can see exactly where it is safe.',
      },
      {
        kind: 'new',
        text: 'Run history: every finished run is now logged locally with its weapons, paragon nodes, and per-weapon damage. Export it (copy or download JSON) from Settings to crunch your own DPS analysis.',
      },
      {
        kind: 'balance',
        text: 'Farsight Protocol (paragon keystone) now grants +1 card to choose from on every level-up in place of its projectile pierce — a guaranteed extra option on every pick.',
      },
      {
        kind: 'balance',
        text: 'Tungsten Core (paragon notable) drops projectile pierce for dense rounds: +0.5× critical-hit damage, pairing with the offense branch’s crit chance to anchor a crit build. Pierce is now reserved for the weapons that earn it.',
      },
      {
        kind: 'balance',
        text: 'Dust Siphon (reactor paragon) drops its slow per-minute trickle for passive stardust that scales with the square of the wave you reach — a deep run pays far more than farming quick early waves.',
      },
    ],
  },
  {
    date: '2026-06-19',
    title: 'By the Numbers',
    blurb: 'Every upgrade shows exactly what it changes.',
    notes: [
      {
        kind: 'new',
        text: 'Level-up cards now spell out the real numbers a pick changes — damage, cooldown, blast radius, burn, freeze and more. Cards you already own show it as a before → after, so you can see exactly what ranking up does.',
      },
      {
        kind: 'new',
        text: 'Launch a run straight from the paragon tree with the new ▶ Launch Run button.',
      },
      {
        kind: 'new',
        text: 'Double-click a paragon node to buy it instantly when you can afford it.',
      },
      {
        kind: 'balance',
        text: 'Paragon weapon-tier nodes now raise the rank cap of synergy tactics too, not just weapons — your synergies can climb past ★5 on the same nodes.',
      },
    ],
  },
  {
    date: '2026-06-18',
    title: 'Saboteurs',
    blurb: 'Repair drones learn to cut the enemy’s power, plus a balance pass across the board.',
    notes: [
      {
        kind: 'balance',
        text: 'Nanite synergies now jam enemy repair: while you own Mitosis, Auto-Fabricators, or Target Uplink, your robots shut down all enemy healing — menders stop mending and regenerating elites stop knitting themselves back together. The hard counter to healing-heavy fights, especially bosses with mender escorts.',
      },
      {
        kind: 'balance',
        text: 'Mitosis fixed at max rank: ★5 was quietly weaker than ★4 because the longer leaps scattered the swarm too thin. Leap growth is gentler now and every rank raises the live-swarm ceiling, so ★5 sustains the biggest cascade — exactly what it should be against weak, packed waves.',
      },
      {
        kind: 'balance',
        text: 'Wildfire is no longer a max-rank-only trap: the blaze now spreads far enough to chain from the very first rank (base radius 90 → 130), so early points actually catch fire.',
      },
      {
        kind: 'balance',
        text: 'Orbital Laser scales much harder per rank in both damage and blast radius, turning it into a genuine tank- and boss-killer at high ranks instead of fizzling against chaff.',
      },
      {
        kind: 'balance',
        text: 'Devourer Swarm opens stronger: a bigger starting nanite budget and faster drain, so it is not a dead early pick before the leaps start to snowball.',
      },
      {
        kind: 'balance',
        text: 'Conditional synergies pay off bigger when they fire: Overwatch (more bonus through frozen invaders), Glassed Sky (hotter molten zone), Thermal Shock (bigger status detonation), and Static Discharge (more bolt links per affliction).',
      },
      {
        kind: 'new',
        text: 'The BFG discharge now blooms a green portal of light over every invader it washes over — you can see exactly what the blast caught.',
      },
      {
        kind: 'new',
        text: 'The end-of-run screen has a “Copy run details” button — grab a plain-text summary of your waves, weapons and tiers, per-weapon damage and DPS, and paragon nodes to share or compare builds.',
      },
      {
        kind: 'new',
        text: 'Training range: a one-click DPS diagnostic charts every weapon and synergy across all five ranks against a seeded, never-ending wave. Grade against a uniform target HP or a realistic mixed swarm, sweep low/medium/high HP in one pass, and watch any run play out at high speed.',
      },
    ],
  },
  {
    date: '2026-06-13',
    title: 'Hand-Off',
    blurb: 'Carry your save across the room with a camera.',
    notes: [
      {
        kind: 'new',
        text: 'Save transfer by QR code: show a QR on one device and point another device’s camera (phone or webcam) at it to copy your progress across — no more typing a long code to move between PC and mobile. (Carries your stardust and paragon tree; per-device extras like lifetime stats stay put.)',
      },
      {
        kind: 'new',
        text: 'The home screen now tracks your favorite weapons — the cards you pick most, tallied across every run.',
      },
      {
        kind: 'new',
        text: 'A live loadout panel during a run lists every card you’ve picked and its tier, down the left edge.',
      },
      {
        kind: 'new',
        text: 'The synergy glossary has a quick “For my build” toggle that filters to just the combos your current cards have started toward.',
      },
      {
        kind: 'new',
        text: 'Level-up cards now flag a “⚡ Combos with …” badge when the offered card would pair with a weapon you already own to open a synergy — hover for which ones.',
      },
      {
        kind: 'balance',
        text: 'Capacitor surges last twice as long (12s base, up from 6s) and now also slash every weapon’s reload by 40% while they burn — a real burst window on top of the damage bonus.',
      },
      {
        kind: 'balance',
        text: 'The flamethrower’s cone is a touch shorter, so it stays the close-range bruiser it’s meant to be.',
      },
      {
        kind: 'fix',
        text: 'Invaders are now steered to touch down inside the base guns’ reach — no more watching one land in a dead zone the cannons can’t answer. Range upgrades still widen the defended band and intercept higher.',
      },
      {
        kind: 'fix',
        text: 'Refraction now triggers honestly: a lance sweep only splits off its echo when it actually crosses a cloud, instead of any cloud on the map lighting up.',
      },
      {
        kind: 'balance',
        text: 'Refraction chains: at higher ranks a refracted echo can refract again off further clouds, cascading across the sky — the chain runs as many hops deep as your Refraction rank.',
      },
      {
        kind: 'fix',
        text: 'Clouds now form a layered deck — drifting from low over the city (in gun reach, so the slow and lance refraction have a bank to work with) up into the high sky — instead of all hugging one altitude. Adapts to tall (mobile/portrait) screens rather than floating off the top.',
      },
      {
        kind: 'balance',
        text: 'Cloud Cover ranks now also puff the clouds bigger (about +12% per rank), so each rank blankets more sky — more slow area and a fatter target for lance refraction, on top of the extra clouds and deeper slow.',
      },
      {
        kind: 'fix',
        text: 'Cloud sprites are no longer sliced flat on the top and bottom — the puffs render whole.',
      },
      {
        kind: 'fix',
        text: 'You can no longer banish a card you’ve already put points into — striking your own build was never the intent.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'Eighty-Eight',
    blurb: 'The flak gun finally looks like flak.',
    notes: [
      {
        kind: 'new',
        text: 'Flak shells are now true artillery: lobbed on a parabolic arc with a fuse timed for where the target will be (plus the proximity trigger en route). Bursts erupt as rolling balls of black smoke with a white-hot flash at the core — sustained fire builds a drifting wall of it.',
      },
      {
        kind: 'fix',
        text: 'Your chosen game speed (×2, ×5) now sticks between rounds and reloads instead of resetting to ×1 every run.',
      },
      {
        kind: 'balance',
        text: 'The thermal lance now ignites directly on its target and sweeps onward at that distance — no more beam flailing out to maximum range past everything.',
      },
      {
        kind: 'balance',
        text: 'Cloud Seeding earns its name: the jet now trails a dense contrail of fresh clouds behind it (a drop every ~0.3s, faster with ranks) and the cloud cap grows +5 per rank, so a strafing pass paints a real weather front.',
      },
      {
        kind: 'balance',
        text: 'Static Mines is now Magnetic Mines: instead of zapping (which was Storm Front with extra steps), armed mines project a magnetic field that drags nearby invaders into their blast radius. Mines themselves hold station again — the balloons just rise and wait.',
      },
      {
        kind: 'balance',
        text: 'Lock Down freezes last much longer: 4s base (up from 2.5s) and +0.7s per rank.',
      },
      {
        kind: 'fix',
        text: 'Glassed Sky now shows its work: the strike zone stays visibly molten, shimmering orange with embers boiling off while everything inside burns.',
      },
      {
        kind: 'balance',
        text: 'Salvage Protocol was out-flakking the flak gun — consumed hosts now burst into a smaller ring of weaker fragments. In exchange, the Flak Gun itself got hotter: 6 base fragments (up from 5) at 60% damage each (up from 55%).',
      },
      {
        kind: 'balance',
        text: 'Overcharge Core no longer starts runs half charged (it was a one-shot gimmick) — instead it charges +40% faster and surges +40% harder, all run long.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'Field Notes',
    blurb: 'The synergy glossary learns what you are carrying.',
    notes: [
      {
        kind: 'new',
        text: 'During a run, the synergy glossary now highlights your arsenal: synergies you own glow green, ones that can appear in offers right now glow and pulse, and every parent shows your live progress toward its tier (★1/2).',
      },
      {
        kind: 'new',
        text: 'The glossary is also browsable from the home screen, next to the patch notes.',
      },
      {
        kind: 'fix',
        text: 'The paragon board breathes again: nodes are spread out so neighboring branches no longer overlap, and every unique node now has its own icon (🔩 Hardened Slugs, 🛡️ Aegis Protocol, 🏦 Compound Interest…) so you can read the board without hovering. Name labels are gone — the icons carry the board, with full details on hover or tap.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'Sharper Teeth',
    blurb: 'The opening fight gets fair, and everything hits more visibly.',
    notes: [
      {
        kind: 'balance',
        text: 'Nova Pulse now knocks invaders back on every pulse, no synergy required, and its shockwave reaches further (radius 240 → 320). Concussive Pulse stacks extra shove distance on top.',
      },
      {
        kind: 'balance',
        text: 'Flamethrower reach raised from 250 to 330 (and more per rank), so the cone actually meets the invaders.',
      },
      {
        kind: 'fix',
        text: 'The flamethrower is far more visible: a burning cone flashes over the whole hit area and the gout is denser, bigger, and brighter.',
      },
      {
        kind: 'fix',
        text: 'The thermal lance now shows where it stops: an impact splash marks the invader blocking the beam, and the beam recovers its length smoothly instead of flickering back to full range.',
      },
      {
        kind: 'fix',
        text: 'Damage numbers are bigger and outlined, so you can actually read them mid-fight.',
      },
      {
        kind: 'fix',
        text: 'The Mine Layer is now called Balloon Mines — it was always balloons.',
      },
      {
        kind: 'new',
        text: 'Synergy glossary: tap ⛓ during a run (it pauses the fight) or on any level-up screen to browse every synergy, its parent cards, and the tiers required.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'The Reactor Spoke',
    blurb: 'A seventh paragon branch, and the battlefield gets a battery.',
    notes: [
      {
        kind: 'new',
        text: 'The Reactor branch — a seventh spoke on the paragon board (🔋), crowned by the Capacitor Array keystone. Like the Aegis Protocol, it unlocks a whole new system: kills charge a battery (the amber bar under your XP), and at full charge every weapon surges with +25% damage while it discharges. Bosses dump a big chunk of charge on death.',
      },
      {
        kind: 'new',
        text: 'Passive earning: Dust Siphon nodes generate stardust for every minute of battle you survive, banked into the run reward.',
      },
      {
        kind: 'new',
        text: 'Interest: Compound Cell minors and the Compound Interest notable pay up to ~9% interest on unspent stardust at the end of every run — savers are rewarded for sitting on a bank.',
      },
      {
        kind: 'new',
        text: 'The Overcharge Core expansion starts every run half charged, with faster charging and harder surges.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'Priced by the Lab',
    blurb: 'The legendary expansion nodes now cost what they measure.',
    notes: [
      {
        kind: 'balance',
        text: 'We benchmarked the three expansion effects with a mid-game kit: an extra gun added ~68 DPS, a fourth weapon line ~90, and raising every weapon cap from ★5 to ★6 a whopping ~153. Prices now follow the data: weapon-tier nodes ✦4000, weapon-slot nodes ✦3400, extra-cannon nodes ✦3000 (cannons are great early, but prestige keeps adding guns anyway).',
      },
      {
        kind: 'new',
        text: 'Training range: a Guns row pins the cannon count (independent of presets), so weapon value can be measured per-gun.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'Sticker Shock',
    blurb: 'Prices now match power.',
    notes: [
      {
        kind: 'balance',
        text: 'Paragon node prices no longer creep up with every point you buy — what you see is what you pay, and the price now reflects the node, not when you bought it. Minors stay pocket change, notables cost about a good run, and the truly powerful nodes are a project: keystones run ✦2000 and the expansion nodes beyond them ✦3200–4000, several runs of stardust each. Tree resets still refund exactly what you spent.',
      },
      {
        kind: 'new',
        text: 'Paragon nodes now show their tier like cards do — node color matches card rarity (common, rare, epic, legendary) and an icon inside each node marks its family (⚔️ offense, 🧰 arsenal, ⚙️ tech, 🛡️ defense, 📡 sensors, 🎲 fortune).',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'The Bigger Picture',
    blurb: 'Complete the paragon board and see how wide the war really is.',
    notes: [
      {
        kind: 'new',
        text: 'Prestige: once every node on the paragon board is bought, the tree offers to pull the view back. Prestiging wipes your stardust and the board — but the camera zooms out permanently, revealing a wider front with one more gun emplacement. Up to ten guns can eventually hold the line.',
      },
      {
        kind: 'new',
        text: 'Prestige survives everything except a full progress wipe, travels with save codes, and shows on the home screen and tree header.',
      },
      {
        kind: 'new',
        text: 'Training range: a Prestige row simulates the zoomed-out battlefield for build testing.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'Hungry Balloons',
    blurb: 'Community report: cloud cover made minefields feel sluggish.',
    notes: [
      {
        kind: 'fix',
        text: 'Mines no longer wait politely while slowed invaders crawl just outside their trigger radius — armed mines now catch the wind and drift toward nearby prey. Minefields actively close the gap, clouds or not.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'Storm Front',
    blurb: 'Three new battlefield effects and fourteen new synergies.',
    notes: [
      {
        kind: 'new',
        text: 'New effect — Stun: lightning stops invaders dead for a moment. The Tesla Arc now stuns everything it strikes, and so does every other lightning source.',
      },
      {
        kind: 'new',
        text: 'New effect — Chill: cryo damage slows invaders to a crawl. Stacks with the slow from Cloud Cover.',
      },
      {
        kind: 'new',
        text: 'New effect — Knockback: some weapons now physically shove invaders. Motherships are too heavy to move.',
      },
      {
        kind: 'new',
        text: 'Thermal Shock (Lock Down × Flamethrower): igniting a frozen invader, or freezing a burning one, detonates both effects in a violent burst.',
      },
      {
        kind: 'new',
        text: 'Static Discharge (Tesla Arc × Flamethrower): the bolt jumps extra links for every affliction on its first target.',
      },
      {
        kind: 'new',
        text: 'EMP Discharge (BFG × Lock Down): the BFG blast flash-freezes every invader on screen.',
      },
      {
        kind: 'new',
        text: 'Arc Capacitor (BFG × Tesla Arc): after the blast, residual charge arcs stunning lightning into the survivors.',
      },
      {
        kind: 'new',
        text: 'Glassed Sky (Orbital Laser × Flamethrower): the strike leaves its impact zone burning.',
      },
      {
        kind: 'new',
        text: 'Target Uplink (Orbital Laser × Nanite Swarm): your drones double as spotters — faster locks, elites painted first.',
      },
      {
        kind: 'new',
        text: 'Refraction (Thermal Lance × Cloud Cover): a cloud refracts every lance shot into a second, weaker sweep.',
      },
      {
        kind: 'new',
        text: 'Overwatch (Thermal Lance × Lock Down): frozen invaders never block the beam and take bonus damage as it glasses through them.',
      },
      {
        kind: 'new',
        text: 'Concussive Pulse (Nova Pulse × Mine Layer): novas shove invaders away from the city — ideally into your minefield.',
      },
      {
        kind: 'new',
        text: 'Static Mines (Mine Layer × Tesla Arc): waiting mines crackle with charge, zapping and stunning anything that drifts near.',
      },
      {
        kind: 'new',
        text: 'Smokescreen (Mine Layer × Cloud Cover): detonating mines leave a slowing smoke bank at the blast site.',
      },
      {
        kind: 'new',
        text: 'Cryo Shells (Flak Gun × Lock Down): flak fragments chill whatever they strike.',
      },
      {
        kind: 'new',
        text: 'Salvage Protocol (Devourer Swarm × Flak Gun): a consumed host bursts into a ring of flak fragments.',
      },
      {
        kind: 'new',
        text: 'Momentum (Main Guns × Rocket Pod): every main-gun kill shaves time off the rocket cooldown.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'Playing with Fire',
    blurb: 'The flamethrower learns to leave a mark.',
    notes: [
      {
        kind: 'new',
        text: 'Burning: everything the flamethrower roasts is now set on fire, taking damage over three seconds. Re-igniting refreshes the burn, and the hottest flame wins.',
      },
      {
        kind: 'new',
        text: 'Incendiary Rounds (Main Guns × Flamethrower): your bullets set whatever they hit burning.',
      },
      {
        kind: 'new',
        text: 'Napalm Warheads (Rocket Pod × Flamethrower): rocket blasts soak the impact zone in burning fuel.',
      },
      {
        kind: 'new',
        text: 'Wildfire (Devourer Swarm × Flamethrower): when a burning invader dies, the fire leaps to everything nearby.',
      },
      {
        kind: 'new',
        text: 'Thermite Beam (Thermal Lance × Flamethrower): the lance leaves its targets burning after the sweep moves on.',
      },
      {
        kind: 'new',
        text: 'Every cannon now mounts its own Thermal Lance — extra guns mean extra sweeps. The BFG stays a single battlefield-wide charge, like the orbital cannon.',
      },
      {
        kind: 'balance',
        text: 'Thermal Lance no longer pierces: the beam stops at the first invader it touches. Invaders hiding directly behind another are safe from it.',
      },
    ],
  },
  {
    date: '2026-06-12',
    title: 'The Long Road',
    blurb: 'Paragon progression gets deeper, and the game behaves better on phones.',
    notes: [
      {
        kind: 'new',
        text: 'Paragon level: every tree node you buy raises the price of all future nodes by 5%. The header shows your level and the current price multiplier, and resetting the tree refunds exactly what you paid.',
      },
      {
        kind: 'balance',
        text: 'The Stardust Cache consolation card now pays out more the deeper your run goes, instead of a flat amount.',
      },
      {
        kind: 'fix',
        text: 'Audio now goes quiet when you switch apps or take a call, and comes back when you return. Your mute setting is respected either way.',
      },
      {
        kind: 'new',
        text: 'Training range: speed controls (×0.5 slow-motion up to ×5 fast-forward).',
      },
      {
        kind: 'fix',
        text: 'Mobile: the wave timer no longer hides under the buttons, the paragon board supports pinch-zoom (plus zoom buttons), and motherships always descend low enough for your guns to reach.',
      },
    ],
  },
  {
    date: '2026-06-11',
    title: 'First Contact',
    blurb: 'The invasion begins.',
    notes: [
      {
        kind: 'new',
        text: 'Last Horizon launches: hold the line through endless waves, with a mothership assault every tenth wave and elite invaders rolling random affixes.',
      },
      {
        kind: 'new',
        text: 'A full arsenal of weapons and synergy tactics, a paragon tree for permanent progression, and a training range for testing builds.',
      },
      {
        kind: 'new',
        text: 'Progress saves locally — export your save as a code to move it between devices, and reset everything from settings if you want a fresh start.',
      },
    ],
  },
]
