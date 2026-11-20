/**
 * Audio controller for Anugerah Bintang PBD Tahap 1 2026.
 * Plays the supplied orchestral background music (/bgm.mp3) cleanly on user interaction
 * with smooth fade-in, loop, ON/OFF toggle, and volume slider support.
 * Uses lightweight Web Audio API for subtle navigation feedback.
 */

class CeremonyAudioEngine {
  private bgmAudio: HTMLAudioElement | null = null;
  private sfxCtx: AudioContext | null = null;
  private fadeTimer: number | null = null;
  private isMuted = false;
  private volume = 0.55;
  private hasStarted = false;

  private ensureBgm(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.bgmAudio) {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const audio = new Audio(`${baseUrl}bgm.mp3`);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      this.bgmAudio = audio;
    }
    return this.bgmAudio;
  }

  private ensureSfxContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.sfxCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.sfxCtx = new AudioCtx();
    }
    if (this.sfxCtx.state === 'suspended') {
      void this.sfxCtx.resume();
    }
    return this.sfxCtx;
  }

  private clearFade(): void {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private fadeVolumeTo(target: number, durationMs: number): void {
    const audio = this.bgmAudio;
    if (!audio) return;

    this.clearFade();
    const startVol = audio.volume;
    const clampedTarget = Math.max(0, Math.min(1, target));
    const steps = Math.max(1, Math.round(durationMs / 40));
    let currentStep = 0;

    this.fadeTimer = window.setInterval(() => {
      currentStep += 1;
      const progress = Math.min(1, currentStep / steps);
      audio.volume = startVol + (clampedTarget - startVol) * progress;

      if (progress >= 1) {
        this.clearFade();
        audio.volume = clampedTarget;
      }
    }, 40);
  }

  public startMusic(fromBeginning = false): void {
    const audio = this.ensureBgm();
    if (!audio) return;

    this.hasStarted = true;
    if (fromBeginning) {
      audio.currentTime = 0;
    }

    if (this.isMuted) {
      audio.pause();
      return;
    }

    audio.volume = Math.min(audio.volume, 0.08);
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.fadeVolumeTo(this.volume, 1100);
        })
        .catch(() => {
          // Ignore browser autoplay rejection if not triggered by user gesture
        });
    } else {
      this.fadeVolumeTo(this.volume, 1100);
    }
  }

  public stopMusic(): void {
    this.clearFade();
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    const audio = this.ensureBgm();
    if (!audio) return;

    if (muted) {
      this.clearFade();
      audio.pause();
    } else if (this.hasStarted) {
      audio.volume = this.volume;
      void audio.play().catch(() => {});
    }
  }

  public setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    this.clearFade();
    if (this.bgmAudio && !this.isMuted) {
      this.bgmAudio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public playPageTurnSound(): void {
    if (this.isMuted) return;
    const ctx = this.ensureSfxContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.09);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035 * this.volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public dispose(): void {
    this.clearFade();
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.src = '';
      this.bgmAudio = null;
    }
    if (this.sfxCtx) {
      void this.sfxCtx.close();
      this.sfxCtx = null;
    }
  }
}

export const ceremonyAudio = new CeremonyAudioEngine();
