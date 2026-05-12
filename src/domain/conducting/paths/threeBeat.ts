import type { ConductingPath, Vec2 } from '../types';
import { sampleCatmullRomLoop } from '../curve';

const ANCHORS: ReadonlyArray<Vec2> = [
  { x: 0, y: -1 },
  { x: 1.0, y: -0.8 },
  { x: -0.3, y: 0.3 },
];

export const threeBeatPath: ConductingPath = {
  id: 'three-beat',
  label: '3-beat (triangle)',
  beatCount: 3,
  beatAnchors: ANCHORS,
  sample(t, opts) {
    return sampleCatmullRomLoop(ANCHORS, t, opts.amplitude);
  },
};
