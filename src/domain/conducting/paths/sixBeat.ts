import type { ConductingPath, Vec2 } from '../types';
import { sampleAlongAnchors } from '../curve';

const ANCHORS: ReadonlyArray<Vec2> = [
  { x: 0, y: -1 },
  { x: -0.35, y: -0.6 },
  { x: -0.7, y: -0.2 },
  { x: 0.7, y: -0.2 },
  { x: 0.35, y: -0.6 },
  { x: 0, y: 0.4 },
];

export const sixBeatPath: ConductingPath = {
  id: 'six-beat',
  label: '6-beat (subdivided)',
  beatCount: 6,
  beatAnchors: ANCHORS,
  sample(t, opts) {
    return sampleAlongAnchors(ANCHORS, t, 0.15, opts.amplitude);
  },
};
