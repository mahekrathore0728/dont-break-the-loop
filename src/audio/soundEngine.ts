class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private tensionOsc: OscillatorNode | null = null;
  private tensionGain: GainNode | null = null;
  private isInitialized: boolean = false;

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  public ensureContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.65, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Dark atmospheric drone
  public startAmbience(anomalyLevel: number = 0) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.ambientGain) return;

    try {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 3);
      this.ambientGain.connect(this.masterGain);

      // Low frequency study drone
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sawtooth';
      const baseFreq = 52 + (anomalyLevel * 0.12);
      this.ambientOsc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(130 + (anomalyLevel * 1.4), this.ctx.currentTime);
      filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.ambientOsc1.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientOsc1.start();

      // Sub-harmonic resonant hum
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(40, this.ctx.currentTime);
      this.ambientOsc2.connect(this.ambientGain);
      this.ambientOsc2.start();
    } catch (e) {
      console.warn('Ambience start error', e);
    }
  }

  // Low frequency tension when approaching predicted object
  public setTension(active: boolean) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    if (active) {
      if (!this.tensionGain) {
        this.tensionGain = this.ctx.createGain();
        this.tensionGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.tensionGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.3);
        this.tensionGain.connect(this.masterGain);

        this.tensionOsc = this.ctx.createOscillator();
        this.tensionOsc.type = 'triangle';
        this.tensionOsc.frequency.setValueAtTime(78, this.ctx.currentTime);
        this.tensionOsc.connect(this.tensionGain);
        this.tensionOsc.start();
      }
    } else {
      if (this.tensionGain && this.tensionOsc) {
        this.tensionGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        setTimeout(() => {
          try {
            this.tensionOsc?.stop();
            this.tensionOsc?.disconnect();
            this.tensionGain?.disconnect();
          } catch {}
          this.tensionOsc = null;
          this.tensionGain = null;
        }, 450);
      }
    }
  }

  // Brief silence when breaking prediction
  public triggerBriefSilence() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const currentGain = this.masterGain.gain.value;
    this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(currentGain, this.ctx.currentTime + 1.2);
  }

  // Mechanical clock tick (with optional distortion for repeated habits)
  public playTick(isBackward: boolean = false, distortionCount: number = 0) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = distortionCount > 2 ? 'sawtooth' : 'triangle';
    
    const baseFreq = isBackward ? 950 : 800 + (distortionCount * 60);
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.04);

    const volume = Math.min(0.3, 0.12 + (distortionCount * 0.04));
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Tactile brass click for switches, locks, and levers
  public playClick() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.025);
  }

  // Door handle turning
  public playHandleTurn() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  // Door locked rattle / shake sound
  public playDoorRattle() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    [0, 0.06, 0.12].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110 + Math.random() * 30, this.ctx.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + offset + 0.05);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + offset + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime + offset);
      osc.stop(this.ctx.currentTime + offset + 0.06);
    });
  }

  // Heavy mechanical door creak & physical opening
  public playDoorOpen() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    // Creak
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(310, this.ctx.currentTime + 0.4);
    osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.7);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  // Sliding wooden drawer
  public playDrawerSlide() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.28, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    whiteNoise.start();
  }

  // Floor tile lift
  public playFloorTile() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(75, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Eerie glass resonance for mirror
  public playMirrorResonance() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(894, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.25);
  }

  // Glitch / Anomaly noise burst
  public playGlitch() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.setValueAtTime(520, this.ctx.currentTime + 0.04);
    osc.frequency.setValueAtTime(90, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.26, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  // Grandfather clock bell chime
  public playChime(count: number = 1) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    for (let i = 0; i < count; i++) {
      const strikeTime = this.ctx.currentTime + (i * 0.9);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, strikeTime);
      gain.gain.setValueAtTime(0.3, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(strikeTime);
      osc.stop(strikeTime + 0.87);
    }
  }

  // Footsteps during transition
  public playFootsteps() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    [0, 0.45, 0.9].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + offset + 0.1);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + offset + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime + offset);
      osc.stop(this.ctx.currentTime + offset + 0.12);
    });
  }

  // Cinematic crescendo for Ending
  public playEnding() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const chords = [220, 277.18, 329.63, 440, 554.37];
    chords.forEach(freq => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 2.0);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 6.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 6.2);
    });
  }
}

export const sound = new ProceduralSoundEngine();
