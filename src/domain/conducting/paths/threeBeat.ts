import type { ConductingPath, Vec2 } from '../types';
import { sampleAlongAnchors } from '../curve';

const ANCHORS: ReadonlyArray<Vec2> = [
  { x: 0, y: -1 },
  { x: 0.8, y: -0.2 },
  { x: 0, y: 0.4 },
];

export const threeBeatPath: ConductingPath = {
  id: 'three-beat',
  label: '3-beat (triangle)',
  beatCount: 3,
  beatAnchors: ANCHORS,
  sample(t, opts) {
    return sampleAlongAnchors(ANCHORS, t, 0.25, opts.amplitude);
  },
};
