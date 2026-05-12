import type { ConductingPath, Vec2 } from '../types';
import { sampleAlongAnchors } from '../curve';

const ANCHORS: ReadonlyArray<Vec2> = [
  { x: 0, y: -1 },
  { x: 0, y: 0.4 },
];

export const twoBeatPath: ConductingPath = {
  id: 'two-beat',
  label: '2-beat (down-up)',
  beatCount: 2,
  beatAnchors: ANCHORS,
  sample(t, opts) {
    return sampleAlongAnchors(ANCHORS, t, 0.3, opts.amplitude);
  },
};
