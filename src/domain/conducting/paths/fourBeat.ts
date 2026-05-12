import type { ConductingPath, Vec2 } from '../types';
import { sampleCatmullRomLoop } from '../curve';

const ANCHORS: ReadonlyArray<Vec2> = [
  { x: 0, y: -1 },
  { x: -0.6, y: -0.3 },
  { x: 0.7, y: -0.3 },
  { x: 0, y: 0.4 },
];

export const fourBeatPath: ConductingPath = {
  id: 'four-beat',
  label: '4-beat (cross)',
  beatCount: 4,
  beatAnchors: ANCHORS,
  sample(t, opts) {
    return sampleCatmullRomLoop(ANCHORS, t, opts.amplitude);
  },
};
