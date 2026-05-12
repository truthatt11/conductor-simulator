import type { BeatEvent, BeatSource, ClockState } from './types';

export type LookaheadOptions = {
  readonly lookaheadSeconds?: number;
  readonly tickIntervalMs?: number;
};

export type ClockHandle = {
  start(): void;
  pause(): void;
  stop(): void;
  state(): ClockState;
  currentBeatPosition(): number;
};

type ClockDeps = {
  readonly audioContext: Pick<AudioContext, 'currentTime' | 'resume' | 'state'>;
  readonly setTimer: (cb: () => void, ms: number) => number;
  readonly clearTimer: (id: number) => void;
};

const DEFAULT_LOOKAHEAD = 0.1;
const DEFAULT_TICK_MS = 25;

export function createLookaheadClock(
  deps: ClockDeps,
  source: BeatSource,
  onBeat: (e: BeatEvent) => void,
  opts: LookaheadOptions = {},
): ClockHandle {
  const lookahead = opts.lookaheadSeconds ?? DEFAULT_LOOKAHEAD;
  const tickMs = opts.tickIntervalMs ?? DEFAULT_TICK_MS;

  let state: ClockState = 'idle';
  let timerId: number | null = null;
  let nextBeatIndex = 0;
  let nextBeatAudioTime = 0;
  let lastSecondsPerBeat = 0.5;

  function scheduleAhead() {
    while (nextBeatAudioTime < deps.audioContext.currentTime + lookahead) {
      const result = source.next(nextBeatIndex);
      if (!result) {
        stop();
        return;
      }
      const event: BeatEvent = {
        ...result.beat,
        audioTime: nextBeatAudioTime,
      };
      onBeat(event);
      lastSecondsPerBeat = result.secondsPerBeat;
      nextBeatAudioTime += result.secondsPerBeat;
      nextBeatIndex += 1;
    }
  }

  function tick() {
    if (state !== 'running') return;
    scheduleAhead();
    timerId = deps.setTimer(tick, tickMs);
  }

  function start() {
    if (state === 'running') return;
    if (state === 'idle') {
      nextBeatAudioTime = deps.audioContext.currentTime + 0.05;
      nextBeatIndex = 0;
    }
    state = 'running';
    tick();
  }

  function pause() {
    if (state !== 'running') return;
    state = 'paused';
    if (timerId !== null) {
      deps.clearTimer(timerId);
      timerId = null;
    }
  }

  function stop() {
    state = 'idle';
    if (timerId !== null) {
      deps.clearTimer(timerId);
      timerId = null;
    }
    nextBeatIndex = 0;
    nextBeatAudioTime = 0;
  }

  function currentBeatPosition(): number {
    if (state === 'idle' || lastSecondsPerBeat === 0) return 0;
    const elapsed = nextBeatAudioTime - deps.audioContext.currentTime;
    const sinceLastBeat = lastSecondsPerBeat - elapsed;
    const frac = Math.max(0, Math.min(1, sinceLastBeat / lastSecondsPerBeat));
    return Math.max(0, nextBeatIndex - 1 + frac);
  }

  return {
    start,
    pause,
    stop,
    state: () => state,
    currentBeatPosition,
  };
}
