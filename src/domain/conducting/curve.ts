import type { Vec2 } from './types';

export function sampleQuadraticBezier(p0: Vec2, p1: Vec2, p2: Vec2, s: number): Vec2 {
  const omS = 1 - s;
  return {
    x: omS * omS * p0.x + 2 * omS * s * p1.x + s * s * p2.x,
    y: omS * omS * p0.y + 2 * omS * s * p1.y + s * s * p2.y,
  };
}

export function sampleAlongAnchors(
  anchors: ReadonlyArray<Vec2>,
  t: number,
  arcHeight: number,
  amplitude: number,
): Vec2 {
  const n = anchors.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n === 1) return scale(anchors[0]!, amplitude);

  const wrapped = ((t % 1) + 1) % 1;
  const segT = wrapped * n;
  const segIdx = Math.floor(segT) % n;
  const localT = segT - Math.floor(segT);

  const from = anchors[segIdx]!;
  const to = anchors[(segIdx + 1) % n]!;
  const control: Vec2 = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 + arcHeight,
  };
  const p = sampleQuadraticBezier(from, control, to, localT);
  return scale(p, amplitude);
}

function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k };
}
