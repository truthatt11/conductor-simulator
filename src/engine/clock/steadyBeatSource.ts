import type { BeatSource } from './types';

export type SteadyBeatConfig = {
  readonly bpm: number;
  readonly beatsPerBar: number;
};

export function createSteadyBeatSource(config: SteadyBeatConfig): BeatSource {
  const beatsPerBar = config.beatsPerBar;
  const secondsPerBeat = 60 / config.bpm;

  return {
    next(fromBeatIndex: number) {
      const measureIndex = Math.floor(fromBeatIndex / beatsPerBar);
      const beatInMeasure = fromBeatIndex % beatsPerBar;
      return {
        beat: {
          beatIndex: fromBeatIndex,
          measureIndex,
          beatInMeasure,
          isDownbeat: beatInMeasure === 0,
        },
        secondsPerBeat,
      };
    },
  };
}
