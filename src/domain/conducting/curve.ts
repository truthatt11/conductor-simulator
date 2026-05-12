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
 *
 * Per-segment arc-length parameterization: each segment between adjacent
 * control points consumes exactly 1/N of the t range, so callers can place
 * "beats" at t = i/N and the dot will land on the corresponding anchor at
 * that exact time. Within each segment the curve parameter is reparameterized
 * by arc length, so motion within a beat is at uniform speed. Speed may
 * differ between segments depending on each segment's arc length.
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
  const localF = segT - Math.floor(segT);

  const p0 = points[(segIdx - 1 + n) % n]!;
  const p1 = points[segIdx]!;
  const p2 = points[(segIdx + 1) % n]!;
  const p3 = points[(segIdx + 2) % n]!;

  const table = getArcLengthTable(points, segIdx);
  const s = invertArcLength(table, localF);

  return scale(sampleCatmullRomSegment(p0, p1, p2, p3, s), amplitude);
}

function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k };
}

// --- Per-segment arc-length reparameterization -----------------------------

const SAMPLES_PER_SEGMENT = 256;

type ArcLengthCache = ReadonlyArray<ReadonlyArray<number>>;
const cache = new WeakMap<ReadonlyArray<Vec2>, ArcLengthCache>();

function getArcLengthTable(
  points: ReadonlyArray<Vec2>,
  segIdx: number,
): ReadonlyArray<number> {
  let tables = cache.get(points);
  if (!tables) {
    tables = buildAllTables(points);
    cache.set(points, tables);
  }
  return tables[segIdx]!;
}

function buildAllTables(points: ReadonlyArray<Vec2>): ArcLengthCache {
  const n = points.length;
  const out: ReadonlyArray<number>[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    const p3 = points[(i + 2) % n]!;
    out.push(buildSegmentTable(p0, p1, p2, p3));
  }
  return out;
}

function buildSegmentTable(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): ReadonlyArray<number> {
  const cum = new Array<number>(SAMPLES_PER_SEGMENT + 1);
  cum[0] = 0;
  let prev = sampleCatmullRomSegment(p0, p1, p2, p3, 0);
  let total = 0;
  for (let k = 1; k <= SAMPLES_PER_SEGMENT; k++) {
    const cur = sampleCatmullRomSegment(p0, p1, p2, p3, k / SAMPLES_PER_SEGMENT);
    total += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    cum[k] = total;
    prev = cur;
  }
  if (total === 0) return cum.map((_, k) => k / SAMPLES_PER_SEGMENT);
  return cum.map((c) => c / total);
}

/** Given normalized arc-length fraction f ∈ [0,1], return curve parameter s ∈ [0,1]. */
function invertArcLength(table: ReadonlyArray<number>, f: number): number {
  const last = table.length - 1;
  if (f <= 0) return 0;
  if (f >= 1) return 1;
  let lo = 0;
  let hi = last;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (table[mid]! <= f) lo = mid;
    else hi = mid;
  }
  const a = table[lo]!;
  const b = table[hi]!;
  const frac = b === a ? 0 : (f - a) / (b - a);
  return (lo + frac) / last;
}
