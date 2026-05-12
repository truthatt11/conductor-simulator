export type TimeSignature = {
  readonly numerator: number;
  readonly denominator: 2 | 4 | 8 | 16;
};

export type Dynamic = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';

export type TempoMark =
  | { readonly kind: 'steady'; readonly bpm: number }
  | { readonly kind: 'ramp'; readonly fromBpm: number; readonly toBpm: number };

export type Gesture =
  | { readonly kind: 'cue'; readonly beat: number }
  | { readonly kind: 'cutoff'; readonly beat: number }
  | { readonly kind: 'fermata'; readonly beat: number };

export type Measure = {
  readonly index: number;
  readonly timeSignature: TimeSignature;
  readonly tempo: TempoMark;
  readonly dynamic?: Dynamic;
  readonly gestures: ReadonlyArray<Gesture>;
};

export type Score = {
  readonly meta: {
    readonly title?: string;
    readonly composer?: string;
  };
  readonly measures: ReadonlyArray<Measure>;
};
