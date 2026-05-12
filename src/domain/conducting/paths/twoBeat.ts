import type { ConductingPath, Vec2 } from '../types';
import { sampleCatmullRomLoop } from '../curve';

const ICTUS: ReadonlyArray<Vec2> = [
  { x: 0, y: -1 },
  { x: 0, y: 0.4 },
];

// Spline points must be evenly spaced around the loop so ictus land at t = i/beatCount.
// The off-axis helpers create the natural left-right swing of a 2-beat pattern.
const SPLINE: ReadonlyArray<Vec2> = [
  { x: 0, y: -1 },
  { x: 0.7, y: -0.3 },
  { x: 0, y: 0.4 },
  { x: -0.7, y: -0.3 },
];

export const twoBeatPath: ConductingPath = {
  id: 'two-beat',
  label: '2-beat (down-up)',
  beatCount: 2,
  beatAnchors: ICTUS,
  sample(t, opts) {
    return sampleCatmullRomLoop(SPLINE, t, opts.amplitude);
  },
};
