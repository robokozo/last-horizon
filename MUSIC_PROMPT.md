# Music generation prompts (Suno / Udio / Stable Audio)

Game context: *Last Horizon* — a night-sky missile-command auto-battler. Neon
city silhouette, deep space above, lasers and flak below. The current
placeholder is a synthesized Am–F–C–G ambient pad at ~50 BPM equivalent;
generated tracks should feel like its bigger sibling. Instrumental only.

## 1. Gameplay loop (main track)

> Atmospheric synthwave for a space-defense game, 95 BPM, A minor. Slow
> arpeggiated analog synths over a warm sub bass, soft side-chained pads,
> sparse electronic percussion that builds gently but never peaks. Hopeful
> but tense undertone — a lone city holding the line under a starry night
> sky. Seamless loop, no intro or outro, no vocals, 2–3 minutes.

## 2. Menu / paragon tree

> Calm ambient space drone, 60 BPM, A minor. Slowly evolving pad chords
> (Am–F–C–G), faint shimmering bell accents, distant radio-static texture,
> very low dynamics. Contemplative star-map mood for a strategy menu.
> Seamless loop, no percussion, no vocals, 1–2 minutes.

## 3. Boss wave

> Dark driving synthwave, 110 BPM, A minor shifting to E phrygian. Pulsing
> bass arpeggio, distorted analog lead stabs, four-on-the-floor kick with
> industrial percussion, rising tension layers every 8 bars. A mothership
> descends on the city. Loopable, no vocals, 90 seconds.

## 4. Game over sting

> Melancholic synth sting, free tempo, A minor. A single detuned pad chord
> swells and decays over 8 seconds, with a falling three-note motif
> (G–E♭–B♭ feel) and tape-stop ending. Somber but not hopeless. One-shot,
> no vocals.

## Integration notes

- Files would land in `public/audio/` and loop via the existing
  `soundEngine` (add a `playMusicTrack` path that swaps the synthesized pad
  for streamed audio when files exist — keep the synth pad as fallback).
- Keep masters quiet (~-16 LUFS) so SFX sit on top; the master gain in
  `src/game/sound.ts` already handles the volume slider and mute.
- Loop points: ask the generator for "seamless loop" and verify by playing
  the file twice back-to-back; trim in Audacity if there's a click.
