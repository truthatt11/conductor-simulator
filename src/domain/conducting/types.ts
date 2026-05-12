import type { Dynamic } from '../score/types';

export type Vec2 = { readonly x: number; readonly y: number };

export type ConductingPathSampleOptions = {
  readonly amplitude: number;
};

/**
 * Pure geometry: a closed path traced once per measure, with N ictus points.
 * Has no knowledge of time signature — a 4-beat path can conduct 4/4, 4/2, or
 * even 8/8 (subdivided). Mapping path-to-meter is a separate concern.
 */
export type ConductingPath = {
  readonly id: string;
  readonly label: string;
  readonly beatCount: number;
  readonly beatAnchors: ReadonlyArray<Vec2>;
  sample(t: number, opts: ConductingPathSampleOptions): Vec2;
};

export const DYNAMIC_AMPLITUDE: Readonly<Record<Dynamic, number>> = {
  pp: 0.35,
  p: 0.5,
  mp: 0.65,
  mf: 0.8,
  f: 0.95,
  ff: 1.1,
};
