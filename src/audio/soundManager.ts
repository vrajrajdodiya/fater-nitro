/**
 * Apex Nitro 3D - Web Audio Sound Synthesizer & Music Engine
 * 100% self-contained synthesized audio without external asset dependencies.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Drift sound nodes
  private driftNoiseNode: AudioBufferSourceNode | null = null;
  private driftGain: GainNode | null = null;
  private driftFilter: BiquadFilterNode | null = null;

  // Nitro sound nodes
  private nitroNoiseNode: AudioBufferSourceNode | null = null;
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;

  // Music sequencer state
  private musicInterval: number | null = null;
  private isMusicPlaying = false;
  private currentStep = 0;

  // Settings
  private soundEnabled = true;
  private sfxVol = 0.8;
  private musicVol = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.soundEnabled ? this.sfxVol : 0;
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.soundEnabled ? this.musicVol : 0;
      this.musicGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSettings(soundEnabled: boolean, sfxVol: number, musicVol: number) {
    this.soundEnabled = soundEnabled;
    this.sfxVol = sfxVol;
    this.musicVol = musicVol;

    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(soundEnabled ? sfxVol : 0, this.ctx.currentTime);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(soundEnabled ? musicVol : 0, this.ctx.currentTime);
    }
  }

  // --- Engine Sound Simulation ---
  public startEngine(carType: string = 'sport') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.engineOsc) return;

    try {
      const now = this.ctx.currentTime;

      // Primary tone
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = carType === 'v8' ? 'sawtooth' : 'triangle';
      this.engineOsc.frequency.setValueAtTime(55, now);

      // Sub-harmonic tone for engine rumble
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'sawtooth';
      this.engineSubOsc.frequency.setValueAtTime(27.5, now);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, now);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, now);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc.start(now);
      this.engineSubOsc.start(now);

      // Setup continuous drift noise loop
      this.initDriftSynth();
      // Setup continuous nitro noise loop
      this.initNitroSynth();
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public updateEngine(speedKmh: number, maxSpeed: number, isAccelerating: boolean, isNitro: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineSubOsc || !this.engineFilter || !this.engineGain) return;

    const speedRatio = Math.max(0, Math.min(1, speedKmh / maxSpeed));
    // Simulate gear shifts every 20% of max speed
    const gearFraction = (speedRatio * 5) % 1;
    const baseFreq = 45 + gearFraction * 95 + speedRatio * 80;
    const nitroBoost = isNitro ? 35 : 0;
    const targetFreq = baseFreq + (isAccelerating ? 25 : 0) + nitroBoost;

    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.05);

    const filterCutoff = 350 + speedRatio * 850 + (isAccelerating ? 250 : 0) + (isNitro ? 600 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);

    const volume = 0.06 + speedRatio * 0.12 + (isNitro ? 0.06 : 0);
    this.engineGain.gain.setTargetAtTime(this.soundEnabled ? volume : 0, now, 0.05);
  }

  public stopEngine() {
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
      if (this.engineSubOsc) {
        this.engineSubOsc.stop();
        this.engineSubOsc.disconnect();
        this.engineSubOsc = null;
      }
      this.stopDriftSynth();
      this.stopNitroSynth();
    } catch {
      // ignore
    }
  }

  // --- Drift Tire Screech ---
  private initDriftSynth() {
    if (!this.ctx || !this.sfxGain || this.driftGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.driftNoiseNode = this.ctx.createBufferSource();
    this.driftNoiseNode.buffer = buffer;
    this.driftNoiseNode.loop = true;

    this.driftFilter = this.ctx.createBiquadFilter();
    this.driftFilter.type = 'bandpass';
    this.driftFilter.frequency.value = 1600;
    this.driftFilter.Q.value = 4.0;

    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.value = 0;

    this.driftNoiseNode.connect(this.driftFilter);
    this.driftFilter.connect(this.driftGain);
    this.driftGain.connect(this.sfxGain);

    this.driftNoiseNode.start();
  }

  public setDriftIntensity(intensity: number) {
    if (!this.driftGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    this.driftGain.gain.setTargetAtTime(this.soundEnabled ? clamped * 0.18 : 0, this.ctx.currentTime, 0.05);
  }

  private stopDriftSynth() {
    try {
      if (this.driftNoiseNode) {
        this.driftNoiseNode.stop();
        this.driftNoiseNode.disconnect();
        this.driftNoiseNode = null;
      }
      this.driftGain = null;
    } catch {
      // ignore
    }
  }

  // --- Nitro Whoosh ---
  private initNitroSynth() {
    if (!this.ctx || !this.sfxGain || this.nitroGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    this.nitroNoiseNode = this.ctx.createBufferSource();
    this.nitroNoiseNode.buffer = buffer;
    this.nitroNoiseNode.loop = true;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'bandpass';
    this.nitroFilter.frequency.value = 2400;
    this.nitroFilter.Q.value = 2.5;

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.value = 0;

    this.nitroNoiseNode.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.sfxGain);

    this.nitroNoiseNode.start();
  }

  public setNitroActive(active: boolean) {
    if (!this.nitroGain || !this.ctx) return;
    this.nitroGain.gain.setTargetAtTime(this.soundEnabled && active ? 0.22 : 0, this.ctx.currentTime, 0.08);
  }

  private stopNitroSynth() {
    try {
      if (this.nitroNoiseNode) {
        this.nitroNoiseNode.stop();
        this.nitroNoiseNode.disconnect();
        this.nitroNoiseNode = null;
      }
      this.nitroGain = null;
    } catch {
      // ignore
    }
  }

  // --- Horn Sound Simulation ---
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  public startHorn() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled || this.hornOsc1) return;

    try {
      const now = this.ctx.currentTime;
      // Dual-tone European car horn (420Hz + 500Hz)
      this.hornOsc1 = this.ctx.createOscillator();
      this.hornOsc1.type = 'sawtooth';
      this.hornOsc1.frequency.setValueAtTime(420, now);

      this.hornOsc2 = this.ctx.createOscillator();
      this.hornOsc2.type = 'sawtooth';
      this.hornOsc2.frequency.setValueAtTime(500, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);

      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0, now);
      this.hornGain.gain.linearRampToValueAtTime(0.32, now + 0.03);

      this.hornOsc1.connect(filter);
      this.hornOsc2.connect(filter);
      filter.connect(this.hornGain);
      this.hornGain.connect(this.sfxGain);

      this.hornOsc1.start(now);
      this.hornOsc2.start(now);
    } catch {
      // ignore
    }
  }

  public stopHorn() {
    if (!this.ctx || !this.hornGain) return;
    try {
      const now = this.ctx.currentTime;
      this.hornGain.gain.linearRampToValueAtTime(0.001, now + 0.04);

      setTimeout(() => {
        if (this.hornOsc1) {
          try {
            this.hornOsc1.stop();
            this.hornOsc1.disconnect();
          } catch {}
          this.hornOsc1 = null;
        }
        if (this.hornOsc2) {
          try {
            this.hornOsc2.stop();
            this.hornOsc2.disconnect();
          } catch {}
          this.hornOsc2 = null;
        }
        this.hornGain = null;
      }, 50);
    } catch {
      // ignore
    }
  }

  public playHornShort() {
    this.startHorn();
    setTimeout(() => {
      this.stopHorn();
    }, 280);
  }

  // --- UI & Event Sound Effects ---
  public playCountdown(num: number | 'GO') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (num === 'GO') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  public playCoin() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    osc2.frequency.setValueAtTime(1318.51, now);
    osc2.frequency.setValueAtTime(1975.53, now + 0.08); // B6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  public playCheckpoint() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25); // C6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playCrash() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    // Low punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playObstacleHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playNearMiss() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playNearMissCombo(combo: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const baseFreq = Math.min(2400, 1100 + combo * 250);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playNitroPickup() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.2); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(987.77, now); // B5
    osc2.frequency.exponentialRampToValueAtTime(1975.53, now + 0.2); // B6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  public playBossIntro() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.8);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.1);
  }

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playWin() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const startTime = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  public playUpgrade() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const startTime = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // --- Procedural Synthwave Racing Music ---
  public startMusic() {
    this.initContext();
    if (this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;

    const bpm = 128;
    const stepTime = (60 / bpm) / 4; // 16th note in seconds

    // Bass notes progression (Am - F - C - G)
    const bassline = [
      110, 110, 110, 110,  87.31, 87.31, 87.31, 87.31,
      130.81, 130.81, 130.81, 130.81,  98, 98, 98, 98
    ];

    // Melodic arpeggio patterns
    const arpNotes = [
      440, 523.25, 659.25, 880,  349.23, 440, 523.25, 698.46,
      523.25, 659.25, 783.99, 1046.5,  392, 493.88, 587.33, 783.99
    ];

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.soundEnabled || this.musicVol <= 0) return;

      const now = this.ctx.currentTime;
      const step16 = this.currentStep % 16;

      // Kick drum on quarter notes (0, 4, 8, 12)
      if (step16 % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.1);

        kickGain.gain.setValueAtTime(0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.15);
      }

      // Snare on 4 and 12
      if (step16 === 4 || step16 === 12) {
        const noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const output = noise.getChannelData(0);
        for (let i = 0; i < noise.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noise;

        const snareFilter = this.ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.value = 1000;

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(0.15, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        whiteNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.musicGain);
        whiteNoise.start(now);
      }

      // Synth bass note
      const bassFreq = bassline[step16];
      if (bassFreq) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(380, now);

        bassGain.gain.setValueAtTime(0.18, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.8);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(now);
        bassOsc.stop(now + stepTime * 1.8);
      }

      // Synth Arpeggio
      if (step16 % 2 === 0) {
        const arpFreq = arpNotes[step16];
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();

        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(arpFreq, now);

        arpGain.gain.setValueAtTime(0.1, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.4);

        arpOsc.connect(arpGain);
        arpGain.connect(this.musicGain);

        arpOsc.start(now);
        arpOsc.stop(now + stepTime * 1.4);
      }

      this.currentStep++;
    }, stepTime * 1000);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundManager = new SoundManager();
