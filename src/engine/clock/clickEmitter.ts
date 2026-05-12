import type { BeatEvent } from './types';

export type ClickEmitter = (e: BeatEvent) => void;

export function createClickEmitter(ctx: AudioContext): ClickEmitter {
  return (e: BeatEvent) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = e.isDownbeat ? 1500 : 1000;
    const t0 = Math.max(e.audioTime, ctx.currentTime);
    const t1 = t0 + 0.05;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(e.isDownbeat ? 0.4 : 0.2, t0 + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.start(t0);
    osc.stop(t1 + 0.01);
  };
}
