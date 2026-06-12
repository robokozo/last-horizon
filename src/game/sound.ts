/**
 * All audio is synthesized with WebAudio — no asset files, matching the
 * code-generated sprites. One shared AudioContext drives tiny one-shot
 * oscillator/noise patches. Every effect is throttled per name so the ×5
 * sim speed cannot stack dozens of identical sounds in one frame.
 */

export type SfxName =
  | 'shot'
  | 'flak'
  | 'explosion'
  | 'zap'
  | 'flame'
  | 'nova'
  | 'railgun'
  | 'lance'
  | 'bfg'
  | 'freeze'
  | 'impact'
  | 'kill'
  | 'levelup'
  | 'collapse'
  | 'gameover'
  | 'launch'

const MUTE_STORAGE_KEY = 'pd-muted'
const VOLUME_STORAGE_KEY = 'pd-volume'
const MUSIC_STORAGE_KEY = 'pd-music'

/** one chord per bar of the generative ambient pad */
const MUSIC_BAR_MS = 4_800
/** Am – F – C – G in a low register — a slow night-sky progression */
const MUSIC_CHORDS: Array<Array<number>> = [
  [110, 130.81, 164.81],
  [87.31, 110, 130.81],
  [130.81, 164.81, 196],
  [98, 123.47, 146.83],
]
/** a sound with the same name within this window is dropped */
const THROTTLE_MS: Record<SfxName, number> = {
  shot: 70,
  flak: 90,
  explosion: 60,
  zap: 80,
  flame: 150,
  nova: 100,
  railgun: 90,
  lance: 200,
  bfg: 200,
  freeze: 120,
  impact: 90,
  kill: 60,
  levelup: 200,
  collapse: 200,
  gameover: 500,
  launch: 90,
}

class SoundEngine {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private lastPlayedMs = new Map<SfxName, number>()
  /** the sandbox fast-forward simulates minutes synchronously — keep it silent */
  private isSuppressed = false
  /** tab hidden (phone call, app switch) — audio is suspended, separate from the user's mute */
  private isBackgrounded = false
  private isMuted = localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
  private volumeLevel = Number(localStorage.getItem(VOLUME_STORAGE_KEY) ?? '0.5')

  private musicGain: GainNode | null = null
  private musicTimerId: ReturnType<typeof setTimeout> | null = null
  private musicBarIndex = 0
  private isMusicOn = localStorage.getItem(MUSIC_STORAGE_KEY) !== 'false'

  muted(): boolean {
    return this.isMuted
  }

  setMuted({ isMuted }: { isMuted: boolean }): void {
    this.isMuted = isMuted
    localStorage.setItem(MUTE_STORAGE_KEY, String(isMuted))
    // silence notes that are already sounding (the music pad rings for seconds)
    if (this.masterGain !== null) {
      this.masterGain.gain.value = isMuted === true ? 0 : this.volumeLevel
    }
  }

  volume(): number {
    return this.volumeLevel
  }

  setVolume({ volume }: { volume: number }): void {
    this.volumeLevel = Math.max(0, Math.min(1, volume))
    localStorage.setItem(VOLUME_STORAGE_KEY, String(this.volumeLevel))
    if (this.masterGain !== null && this.isMuted === false) {
      this.masterGain.gain.value = this.volumeLevel
    }
  }

  musicEnabled(): boolean {
    return this.isMusicOn
  }

  setMusicEnabled({ isEnabled }: { isEnabled: boolean }): void {
    this.isMusicOn = isEnabled
    localStorage.setItem(MUSIC_STORAGE_KEY, String(isEnabled))
    if (isEnabled === true) {
      this.startMusic()
    } else {
      this.stopMusic()
    }
  }

  /** generative ambient pad — synthesized like everything else, no audio files */
  startMusic(): void {
    if (this.musicTimerId !== null || this.isMusicOn === false) {
      return
    }
    this.scheduleNextBar({ delayMs: 100 })
  }

  stopMusic(): void {
    if (this.musicTimerId !== null) {
      clearTimeout(this.musicTimerId)
      this.musicTimerId = null
    }
  }

  private scheduleNextBar({ delayMs }: { delayMs: number }): void {
    this.musicTimerId = setTimeout(() => {
      this.musicTimerId = null
      if (this.isMusicOn === false) {
        return
      }
      this.playMusicBar()
      this.scheduleNextBar({ delayMs: MUSIC_BAR_MS })
    }, delayMs)
  }

  private playMusicBar(): void {
    // keep the loop ticking while muted or backgrounded; just don't emit the bar
    if (this.isMuted === true || this.isSuppressed === true || this.isBackgrounded === true) {
      return
    }
    const context = this.ensureContext()
    if (context === null || context.state !== 'running' || this.masterGain === null) {
      return
    }
    if (this.musicGain === null) {
      this.musicGain = context.createGain()
      this.musicGain.gain.value = 0.16
      this.musicGain.connect(this.masterGain)
    }
    const chord = MUSIC_CHORDS[this.musicBarIndex % MUSIC_CHORDS.length]
    this.musicBarIndex += 1
    const barSeconds = MUSIC_BAR_MS / 1_000
    for (const freq of chord) {
      this.padNote({ freq, durationS: barSeconds + 1.5 })
    }
    // an occasional high sparkle from the same chord keeps it from droning
    if (Math.random() < 0.5) {
      const sparkleFreq =
        chord[Math.floor(Math.random() * chord.length)] * (Math.random() < 0.5 ? 2 : 4)
      this.padNote({ freq: sparkleFreq, durationS: 2.4, volume: 0.3, attackS: 0.08, type: 'sine' })
    }
  }

  /** a slow-attack pad voice: two slightly detuned oscillators on the music bus */
  private padNote({
    freq,
    durationS,
    volume = 1,
    attackS = 1.6,
    type = 'triangle',
  }: {
    freq: number
    durationS: number
    volume?: number
    attackS?: number
    type?: OscillatorType
  }): void {
    const context = this.context
    const musicGain = this.musicGain
    if (context === null || musicGain === null) {
      return
    }
    const start = context.currentTime
    const end = start + durationS
    for (const detune of [0.998, 1.002]) {
      const oscillator = context.createOscillator()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(freq * detune, start)
      const gain = context.createGain()
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.5 * volume, start + attackS)
      gain.gain.exponentialRampToValueAtTime(0.0001, end)
      oscillator.connect(gain)
      gain.connect(musicGain)
      oscillator.start(start)
      oscillator.stop(end)
    }
  }

  setSuppressed({ isSuppressed }: { isSuppressed: boolean }): void {
    this.isSuppressed = isSuppressed
  }

  /**
   * Tab went hidden or came back (phone call, app switch): suspend the whole
   * context so ringing pad notes stop too, and resume on return. The user's
   * mute setting is untouched — a muted player stays muted after the call.
   */
  setBackgrounded({ isBackgrounded }: { isBackgrounded: boolean }): void {
    this.isBackgrounded = isBackgrounded
    if (this.context === null) {
      return
    }
    if (isBackgrounded === true) {
      void this.context.suspend()
    } else {
      void this.context.resume()
    }
  }

  play({ name }: { name: SfxName }): void {
    if (this.isMuted === true || this.isSuppressed === true || this.isBackgrounded === true) {
      return
    }
    const now = performance.now()
    const lastMs = this.lastPlayedMs.get(name) ?? -Infinity
    if (now - lastMs < THROTTLE_MS[name]) {
      return
    }
    const context = this.ensureContext()
    if (context === null || context.state !== 'running') {
      return
    }
    this.lastPlayedMs.set(name, now)
    this.patches[name]()
  }

  /** browsers gate audio behind a user gesture; created lazily, resumed on demand */
  private ensureContext(): AudioContext | null {
    if (this.context === null) {
      if (typeof AudioContext === 'undefined') {
        return null
      }
      this.context = new AudioContext()
      this.masterGain = this.context.createGain()
      this.masterGain.gain.value = this.isMuted === true ? 0 : this.volumeLevel
      this.masterGain.connect(this.context.destination)
    }
    // never auto-resume a context we suspended for a hidden tab
    if (this.context.state === 'suspended' && this.isBackgrounded === false) {
      void this.context.resume()
    }
    return this.context
  }

  /** a short pitched oscillator sweep — the workhorse for zaps and blips */
  private tone({
    startFreq,
    endFreq,
    durationMs,
    volume,
    type = 'square',
    delayMs = 0,
  }: {
    startFreq: number
    endFreq: number
    durationMs: number
    volume: number
    type?: OscillatorType
    delayMs?: number
  }): void {
    const context = this.context
    const masterGain = this.masterGain
    if (context === null || masterGain === null) {
      return
    }
    const start = context.currentTime + delayMs / 1_000
    const end = start + durationMs / 1_000
    // small random pitch/volume drift so repeated effects don't sound machine-stamped
    const pitchJitter = 0.94 + Math.random() * 0.12
    const volumeJitter = 0.85 + Math.random() * 0.3
    const oscillator = context.createOscillator()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(startFreq * pitchJitter, start)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq * pitchJitter), end)
    const gain = context.createGain()
    gain.gain.setValueAtTime(volume * volumeJitter, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    oscillator.connect(gain)
    gain.connect(masterGain)
    oscillator.start(start)
    oscillator.stop(end)
  }

  /** a filtered noise burst — explosions, impacts, rubble */
  private noise({
    durationMs,
    volume,
    filterFreq,
    filterEndFreq,
    delayMs = 0,
  }: {
    durationMs: number
    volume: number
    filterFreq: number
    filterEndFreq?: number
    delayMs?: number
  }): void {
    const context = this.context
    const masterGain = this.masterGain
    if (context === null || masterGain === null) {
      return
    }
    const start = context.currentTime + delayMs / 1_000
    const durationSeconds = durationMs / 1_000
    const sampleCount = Math.ceil(context.sampleRate * durationSeconds)
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let index = 0; index < sampleCount; index += 1) {
      channel[index] = Math.random() * 2 - 1
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    // drift the filter and volume so repeated bursts vary like real explosions
    const filterJitter = 0.9 + Math.random() * 0.2
    const volumeJitter = 0.85 + Math.random() * 0.3
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(filterFreq * filterJitter, start)
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(1, (filterEndFreq ?? filterFreq * 0.25) * filterJitter),
      start + durationSeconds,
    )
    const gain = context.createGain()
    gain.gain.setValueAtTime(volume * volumeJitter, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSeconds)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(masterGain)
    source.start(start)
    source.stop(start + durationSeconds)
  }

  private patches: Record<SfxName, () => void> = {
    shot: () => {
      this.tone({ startFreq: 880, endFreq: 220, durationMs: 70, volume: 0.06, type: 'square' })
    },
    flak: () => {
      this.noise({ durationMs: 130, volume: 0.1, filterFreq: 2_400 })
      this.tone({ startFreq: 320, endFreq: 90, durationMs: 110, volume: 0.05, type: 'triangle' })
    },
    explosion: () => {
      this.noise({ durationMs: 320, volume: 0.16, filterFreq: 1_400 })
      this.tone({ startFreq: 150, endFreq: 40, durationMs: 280, volume: 0.12, type: 'sine' })
    },
    zap: () => {
      this.tone({ startFreq: 2_400, endFreq: 300, durationMs: 90, volume: 0.05, type: 'sawtooth' })
      this.tone({ startFreq: 1_700, endFreq: 200, durationMs: 120, volume: 0.04, type: 'square' })
    },
    flame: () => {
      this.noise({ durationMs: 320, volume: 0.08, filterFreq: 1_100, filterEndFreq: 400 })
      this.tone({ startFreq: 90, endFreq: 55, durationMs: 280, volume: 0.04, type: 'sawtooth' })
    },
    nova: () => {
      this.tone({ startFreq: 220, endFreq: 880, durationMs: 240, volume: 0.07, type: 'sine' })
      this.tone({ startFreq: 110, endFreq: 440, durationMs: 280, volume: 0.05, type: 'triangle' })
    },
    railgun: () => {
      this.tone({ startFreq: 3_000, endFreq: 150, durationMs: 180, volume: 0.07, type: 'sawtooth' })
      this.noise({ durationMs: 90, volume: 0.05, filterFreq: 5_000 })
    },
    lance: () => {
      this.tone({ startFreq: 60, endFreq: 700, durationMs: 350, volume: 0.08, type: 'sawtooth' })
      this.noise({ durationMs: 500, volume: 0.05, filterFreq: 900, filterEndFreq: 2_400 })
    },
    bfg: () => {
      this.tone({ startFreq: 50, endFreq: 600, durationMs: 280, volume: 0.12, type: 'sawtooth' })
      this.noise({ durationMs: 600, volume: 0.16, filterFreq: 1_800, delayMs: 220 })
      this.tone({
        startFreq: 320,
        endFreq: 30,
        durationMs: 500,
        volume: 0.12,
        type: 'sine',
        delayMs: 220,
      })
    },
    freeze: () => {
      this.tone({ startFreq: 1_800, endFreq: 2_600, durationMs: 130, volume: 0.04, type: 'sine' })
      this.tone({
        startFreq: 2_200,
        endFreq: 3_200,
        durationMs: 110,
        volume: 0.03,
        type: 'sine',
        delayMs: 60,
      })
    },
    impact: () => {
      this.noise({ durationMs: 260, volume: 0.14, filterFreq: 900 })
      this.tone({ startFreq: 90, endFreq: 30, durationMs: 240, volume: 0.12, type: 'sine' })
    },
    kill: () => {
      this.tone({ startFreq: 600, endFreq: 1_400, durationMs: 70, volume: 0.035, type: 'triangle' })
    },
    levelup: () => {
      this.tone({ startFreq: 523, endFreq: 523, durationMs: 90, volume: 0.07, type: 'triangle' })
      this.tone({
        startFreq: 659,
        endFreq: 659,
        durationMs: 90,
        volume: 0.07,
        type: 'triangle',
        delayMs: 90,
      })
      this.tone({
        startFreq: 784,
        endFreq: 1_046,
        durationMs: 180,
        volume: 0.08,
        type: 'triangle',
        delayMs: 180,
      })
    },
    collapse: () => {
      this.noise({ durationMs: 500, volume: 0.16, filterFreq: 700 })
      this.tone({ startFreq: 120, endFreq: 25, durationMs: 450, volume: 0.1, type: 'sine' })
    },
    gameover: () => {
      this.tone({ startFreq: 392, endFreq: 392, durationMs: 200, volume: 0.08, type: 'triangle' })
      this.tone({
        startFreq: 311,
        endFreq: 311,
        durationMs: 200,
        volume: 0.08,
        type: 'triangle',
        delayMs: 220,
      })
      this.tone({
        startFreq: 233,
        endFreq: 110,
        durationMs: 600,
        volume: 0.09,
        type: 'triangle',
        delayMs: 440,
      })
      this.noise({ durationMs: 900, volume: 0.1, filterFreq: 500, delayMs: 300 })
    },
    launch: () => {
      this.tone({ startFreq: 200, endFreq: 700, durationMs: 160, volume: 0.05, type: 'triangle' })
    },
  }
}

export const soundEngine = new SoundEngine()
