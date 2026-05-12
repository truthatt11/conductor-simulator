import type { Vec2 } from './types';

/**
 * Uniform Catmull-Rom interpolation between p1 and p2 (s ∈ [0, 1]).
 * p0 / p3 are the neighbours that define the tangents at p1 / p2.
 */
export function sampleCatmullRomSegment(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  s: number,
): Vec2 {
  const s2 = s * s;
  const s3 = s2 * s;
  return {
    x:
      0.5 *
      ((2 * p1.x) +
        (-p0.x + p2.x) * s +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3),
    y:
      0.5 *
      ((2 * p1.y) +
        (-p0.y + p2.y) * s +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3),
  };
}

/**
 * Sample a closed-loop Catmull-Rom spline at parameter t ∈ [0, 1).
 * The curve passes through every control point with C1-continuous tangents.
 * Wraps around at t boundaries — useful for cyclical conducting patterns.
 */
export function sampleCatmullRomLoop(
  points: ReadonlyArray<Vec2>,
  t: number,
  amplitude: number,
): Vec2 {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n === 1) return scale(points[0]!, amplitude);

  const wrapped = ((t % 1) + 1) % 1;
  const segT = wrapped * n;
  const segIdx = Math.floor(segT) % n;
  const s = segT - Math.floor(segT);

  const p0 = points[(segIdx - 1 + n) % n]!;
  const p1 = points[segIdx]!;
  const p2 = points[(segIdx + 1) % n]!;
  const p3 = points[(segIdx + 2) % n]!;

  return scale(sampleCatmullRomSegment(p0, p1, p2, p3, s), amplitude);
}

function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k };
}
