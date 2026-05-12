import { describe, expect, it } from 'vitest';
import { findPath, listPaths, requirePath } from './registry';
import { sampleCatmullRomLoop, sampleCatmullRomSegment } from './curve';
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

describe('sampleCatmullRomSegment', () => {
  const p0 = { x: -1, y: 0 };
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 1, y: 1 };
  const p3 = { x: 2, y: 0 };

  it('at s=0 returns p1', () => {
    const p = sampleCatmullRomSegment(p0, p1, p2, p3, 0);
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(0, 9);
  });

  it('at s=1 returns p2', () => {
    const p = sampleCatmullRomSegment(p0, p1, p2, p3, 1);
    expect(p.x).toBeCloseTo(1, 9);
    expect(p.y).toBeCloseTo(1, 9);
  });
});

describe('sampleCatmullRomLoop', () => {
  const points = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  it('passes through each control point at t = i/N', () => {
    for (let i = 0; i < points.length; i++) {
      const p = sampleCatmullRomLoop(points, i / points.length, 1);
      expect(p.x).toBeCloseTo(points[i]!.x, 6);
      expect(p.y).toBeCloseTo(points[i]!.y, 6);
    }
  });

  it('scales amplitude', () => {
    const p = sampleCatmullRomLoop(points, 0, 0.5);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(-0.5, 6);
  });

  it('wraps t outside [0, 1) — closed loop', () => {
    const a = sampleCatmullRomLoop(points, 0.25, 1);
    const b = sampleCatmullRomLoop(points, 1.25, 1);
    const c = sampleCatmullRomLoop(points, -0.75, 1);
    expect(b.x).toBeCloseTo(a.x, 6);
    expect(b.y).toBeCloseTo(a.y, 6);
    expect(c.x).toBeCloseTo(a.x, 6);
    expect(c.y).toBeCloseTo(a.y, 6);
  });

  it('is C0-continuous across the loop boundary', () => {
    const a = sampleCatmullRomLoop(points, 0.999, 1);
    const b = sampleCatmullRomLoop(points, 0.001, 1);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.05);
  });

  it('has uniform speed within each segment (symmetric diamond → globally uniform)', () => {
    const STEPS = 100;
    const samples: { x: number; y: number }[] = [];
    for (let i = 0; i <= STEPS; i++) samples.push(sampleCatmullRomLoop(points, i / STEPS, 1));
    const dists: number[] = [];
    for (let i = 1; i <= STEPS; i++) {
      const a = samples[i - 1]!;
      const b = samples[i]!;
      dists.push(Math.hypot(b.x - a.x, b.y - a.y));
    }
    const mean = dists.reduce((s, d) => s + d, 0) / dists.length;
    const maxDev = Math.max(...dists.map((d) => Math.abs(d - mean) / mean));
    expect(maxDev).toBeLessThan(0.05);
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
