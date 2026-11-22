import { DifficultyId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxVolume = 0.7;
  private musicVolume = 0.35;
  private ambientGain: GainNode | null = null;
  private ambientStarted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAudio(): void {
    const ctx = this.ensureContext();
    if (ctx && !this.ambientStarted) {
      this.startAmbient(ctx);
    }
  }

  public setVolumes(sfxPercent: number, musicPercent: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, sfxPercent / 100));
    this.musicVolume = Math.max(0, Math.min(1, musicPercent / 100));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.musicVolume * 0.08, this.ctx.currentTime, 0.15);
    }
  }

  private startAmbient(ctx: AudioContext): void {
    this.ambientStarted = true;
    try {
      const master = ctx.createGain();
      master.gain.value = this.musicVolume * 0.08;
      master.connect(ctx.destination);
      this.ambientGain = master;

      const freqs = [130.81, 196.0, 261.63, 329.63]; // Soft Cmaj7 pad
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        filter.type = 'lowpass';
        filter.frequency.value = 520;
        g.gain.value = 0.25 / freqs.length;

        // Subtle LFO shimmer
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.08 + idx * 0.03;
        lfoGain.gain.value = 1.2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        osc.start();
      });
    } catch {
      // Ignore audio errors in headless/restricted browsers
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.2,
    delay = 0,
    slideTo?: number
  ): void {
    if (this.sfxVolume <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    const amp = volume * this.sfxVolume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(amp, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump(): void {
    this.playTone(230, 0.14, 'triangle', 0.16, 0, 480);
  }

  public playBounce(): void {
    this.playTone(180, 0.26, 'sine', 0.24, 0, 740);
    this.playTone(360, 0.2, 'triangle', 0.12, 0.04, 880);
  }

  public playClick(): void {
    this.playTone(620, 0.06, 'sine', 0.14, 0, 740);
  }

  public playStep(): void {
    this.playTone(140 + Math.random() * 40, 0.045, 'triangle', 0.06, 0, 90);
  }

  public playInteract(): void {
    this.playTone(520, 0.1, 'sine', 0.18, 0);
    this.playTone(780, 0.14, 'sine', 0.16, 0.06);
  }

  public playError(): void {
    this.playTone(190, 0.16, 'sawtooth', 0.12, 0, 130);
    this.playTone(145, 0.2, 'sawtooth', 0.12, 0.12, 100);
  }

  public playPortal(): void {
    this.playTone(260, 0.45, 'sine', 0.2, 0, 880);
    this.playTone(520, 0.45, 'triangle', 0.14, 0.05, 1180);
  }

  public playSplash(): void {
    this.playTone(340, 0.18, 'sine', 0.15, 0, 180);
    this.playTone(520, 0.12, 'triangle', 0.1, 0.05, 290);
  }

  public playChat(): void {
    this.playTone(680, 0.07, 'sine', 0.1, 0, 820);
  }

  public playSecretUnlock(difficulty: DifficultyId): void {
    const patterns: Record<DifficultyId, number[]> = {
      easy: [523.25, 659.25, 783.99],
      medium: [523.25, 659.25, 783.99, 1046.5],
      hard: [440, 554.37, 659.25, 880, 1108.73],
      amazing: [392, 493.88, 587.33, 783.99, 987.77, 1174.66],
      okay: [311.13, 392, 466.16, 622.25, 783.99, 932.33, 1244.51],
      best: [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5, 1318.51],
    };

    const notes = patterns[difficulty];
    notes.forEach((freq, i) => {
      const wave: OscillatorType = difficulty === 'best' || difficulty === 'okay' ? 'triangle' : 'sine';
      this.playTone(freq, 0.36 + i * 0.04, wave, 0.2, i * 0.075);
      if (difficulty === 'best' || difficulty === 'amazing' || difficulty === 'okay') {
        this.playTone(freq * 1.5, 0.25, 'sine', 0.07, i * 0.075 + 0.03);
      }
    });
  }
}

export const soundEngine = new SoundEngine();
