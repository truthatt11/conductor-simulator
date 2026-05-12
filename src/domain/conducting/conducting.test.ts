import { describe, expect, it } from 'vitest';
import { findPath, listPaths, requirePath } from './registry';
import { sampleAlongAnchors, sampleQuadraticBezier } from './curve';
import type { ConductingPath } from './types';

describe('path registry', () => {
  it('lists 4 generic paths', () => {
    expect(listPaths()).toHaveLength(4);
    expect(findPath('two-beat')).toBeDefined();
    expect(findPath('three-beat')).toBeDefined();
    expect(findPath('four-beat')).toBeDefined();
    expect(findPath('six-beat')).toBeDefined();
  });

  it('returns undefined for unknown id', () => {
    expect(findPath('seven-beat')).toBeUndefined();
  });

  it('requirePath throws for unknown id', () => {
    expect(() => requirePath('seven-beat')).toThrow(/Unknown conducting path/);
  });
});

describe('quadratic bezier', () => {
  it('at s=0 returns p0', () => {
    const p = sampleQuadraticBezier({ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, 0);
    expect(p).toEqual({ x: 1, y: 2 });
  });

  it('at s=1 returns p2', () => {
    const p = sampleQuadraticBezier({ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, 1);
    expect(p).toEqual({ x: 5, y: 6 });
  });
});

describe('sampleAlongAnchors', () => {
  const anchors = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];

  it('passes through each anchor at i/N', () => {
    const p0 = sampleAlongAnchors(anchors, 0, 0, 1);
    const p1 = sampleAlongAnchors(anchors, 0.5, 0, 1);
    expect(p0.x).toBeCloseTo(0, 6);
    expect(p0.y).toBeCloseTo(-1, 6);
    expect(p1.x).toBeCloseTo(0, 6);
    expect(p1.y).toBeCloseTo(1, 6);
  });

  it('scales amplitude', () => {
    const p = sampleAlongAnchors(anchors, 0, 0, 0.5);
    expect(p.y).toBeCloseTo(-0.5, 6);
  });

  it('wraps t outside [0, 1)', () => {
    const p0 = sampleAlongAnchors(anchors, 0, 0, 1);
    const p1 = sampleAlongAnchors(anchors, 1, 0, 1);
    const p2 = sampleAlongAnchors(anchors, 2, 0, 1);
    expect(p1.y).toBeCloseTo(p0.y, 6);
    expect(p2.y).toBeCloseTo(p0.y, 6);
  });
});

describe.each(listPaths().map((p) => [p.id, p] as const))('path %s', (_id, p: ConductingPath) => {
  it('beatAnchors count equals beatCount', () => {
    expect(p.beatAnchors).toHaveLength(p.beatCount);
  });

  it('sample(beatIdx/beatCount) returns anchor', () => {
    for (let i = 0; i < p.beatCount; i++) {
      const sampled = p.sample(i / p.beatCount, { amplitude: 1 });
      const anchor = p.beatAnchors[i]!;
      expect(sampled.x).toBeCloseTo(anchor.x, 6);
      expect(sampled.y).toBeCloseTo(anchor.y, 6);
    }
  });

  it('sample is continuous across the [0, 1) boundary', () => {
    const a = p.sample(0.999, { amplitude: 1 });
    const b = p.sample(0.001, { amplitude: 1 });
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.05);
  });
});
