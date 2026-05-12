import { useCallback, useEffect, useRef } from 'react';
import { createLookaheadClock, type ClockHandle } from './lookahead';
import { createSteadyBeatSource } from './steadyBeatSource';
import { createClickEmitter } from './clickEmitter';

type UseAudioClockArgs = {
  bpm: number;
  beatsPerBar: number;
  isPlaying: boolean;
};

export function useAudioClock({ bpm, beatsPerBar, isPlaying }: UseAudioClockArgs) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clockRef = useRef<ClockHandle | null>(null);

  const getBeatPosition = useCallback((): number => {
    return clockRef.current?.currentBeatPosition() ?? 0;
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      clockRef.current?.stop();
      clockRef.current = null;
      return;
    }

    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') void ctx.resume();

    const click = createClickEmitter(ctx);
    const source = createSteadyBeatSource({ bpm, beatsPerBar });
    const clock = createLookaheadClock(
      {
        audioContext: ctx,
        setTimer: (cb, ms) => window.setTimeout(cb, ms),
        clearTimer: (id) => window.clearTimeout(id),
      },
      source,
      click,
    );
    clockRef.current = clock;
    clock.start();

    return () => {
      clock.stop();
      clockRef.current = null;
    };
  }, [isPlaying, bpm, beatsPerBar]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  return { getBeatPosition };
}
