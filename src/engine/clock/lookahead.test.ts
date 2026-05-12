import { describe, expect, it } from 'vitest';
import { createLookaheadClock } from './lookahead';
import { createSteadyBeatSource } from './steadyBeatSource';
import type { BeatEvent } from './types';

function makeFakeAudioContext() {
  let now = 0;
  return {
    get currentTime() {
      return now;
    },
    advance(seconds: number) {
      now += seconds;
    },
    state: 'running' as AudioContextState,
    resume: async () => {},
  };
}

function makeFakeTimerHost() {
  const queue: Array<{ id: number; cb: () => void }> = [];
  let nextId = 1;
  return {
    setTimer: (cb: () => void) => {
      const id = nextId++;
      queue.push({ id, cb });
      return id;
    },
    clearTimer: (id: number) => {
      const idx = queue.findIndex((q) => q.id === id);
      if (idx >= 0) queue.splice(idx, 1);
    },
    flushOne() {
      const next = queue.shift();
      next?.cb();
    },
    pending() {
      return queue.length;
    },
  };
}

describe('createLookaheadClock', () => {
  it('schedules beats ahead within lookahead window', () => {
    const audio = makeFakeAudioContext();
    const timers = makeFakeTimerHost();
    const events: BeatEvent[] = [];

    const clock = createLookaheadClock(
      { audioContext: audio, setTimer: timers.setTimer, clearTimer: timers.clearTimer },
      createSteadyBeatSource({ bpm: 120, beatsPerBar: 4 }),
      (e) => events.push(e),
      { lookaheadSeconds: 0.1, tickIntervalMs: 25 },
    );

    clock.start();
    // 120 bpm = 0.5s/beat. lookahead = 0.1s. At t=0.05, next beat at 0.05 → within window.
    // Only the first beat scheduled at start (audioTime 0.05).
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]?.beatIndex).toBe(0);
    expect(events[0]?.isDownbeat).toBe(true);
  });

  it('produces beats at exact audio timestamps with zero drift', () => {
    const audio = makeFakeAudioContext();
    const timers = makeFakeTimerHost();
    const events: BeatEvent[] = [];

    const clock = createLookaheadClock(
      { audioContext: audio, setTimer: timers.setTimer, clearTimer: timers.clearTimer },
      createSteadyBeatSource({ bpm: 120, beatsPerBar: 4 }),
      (e) => events.push(e),
      { lookaheadSeconds: 0.6, tickIntervalMs: 25 },
    );

    clock.start();
    // Lookahead = 0.6s, first beat at 0.05, so beats 0,1 scheduled (0.05, 0.55).
    // Advance audio time and tick — should keep scheduling further ahead.
    for (let i = 0; i < 100; i++) {
      audio.advance(0.025);
      timers.flushOne();
    }

    expect(events.length).toBeGreaterThan(4);
    // Verify exact spacing — drift must be 0 with fixed bpm
    for (let i = 1; i < events.length; i++) {
      const cur = events[i];
      const prev = events[i - 1];
      if (!cur || !prev) continue;
      const dt = cur.audioTime - prev.audioTime;
      expect(dt).toBeCloseTo(0.5, 9);
    }
  });

  it('marks downbeats correctly in 3/4', () => {
    const audio = makeFakeAudioContext();
    const timers = makeFakeTimerHost();
    const events: BeatEvent[] = [];

    const clock = createLookaheadClock(
      { audioContext: audio, setTimer: timers.setTimer, clearTimer: timers.clearTimer },
      createSteadyBeatSource({ bpm: 120, beatsPerBar: 3 }),
      (e) => events.push(e),
      { lookaheadSeconds: 2.0, tickIntervalMs: 25 },
    );

    clock.start();
    expect(events[0]?.isDownbeat).toBe(true);
    expect(events[1]?.isDownbeat).toBe(false);
    expect(events[2]?.isDownbeat).toBe(false);
    expect(events[3]?.isDownbeat).toBe(true);
    expect(events[3]?.measureIndex).toBe(1);
  });

  it('stops emitting beats after pause', () => {
    const audio = makeFakeAudioContext();
    const timers = makeFakeTimerHost();
    const events: BeatEvent[] = [];

    const clock = createLookaheadClock(
      { audioContext: audio, setTimer: timers.setTimer, clearTimer: timers.clearTimer },
      createSteadyBeatSource({ bpm: 120, beatsPerBar: 4 }),
      (e) => events.push(e),
      { lookaheadSeconds: 0.6, tickIntervalMs: 25 },
    );

    clock.start();
    const countBeforePause = events.length;
    clock.pause();
    audio.advance(2);
    for (let i = 0; i < 10; i++) timers.flushOne();
    expect(events.length).toBe(countBeforePause);
    expect(clock.state()).toBe('paused');
  });
});
