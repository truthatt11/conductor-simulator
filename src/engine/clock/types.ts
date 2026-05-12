export type BeatEvent = {
  readonly beatIndex: number;
  readonly measureIndex: number;
  readonly beatInMeasure: number;
  readonly audioTime: number;
  readonly isDownbeat: boolean;
};

export type ClockState = 'idle' | 'running' | 'paused';

export type BeatSource = {
  next(fromBeatIndex: number): BeatSourceResult | null;
};

export type BeatSourceResult = {
  readonly beat: Omit<BeatEvent, 'audioTime'>;
  readonly secondsPerBeat: number;
};
