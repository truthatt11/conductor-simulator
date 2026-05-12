import { describe, expect, it } from 'vitest';
import {
  defaultPathForMeter,
  isCompatible,
  metersForPath,
  supportedMeters,
  supportedPathsForMeter,
} from './compatibility';
import type { TimeSignature } from '../score/types';

const M2_4: TimeSignature = { numerator: 2, denominator: 4 };
const M3_4: TimeSignature = { numerator: 3, denominator: 4 };
const M4_4: TimeSignature = { numerator: 4, denominator: 4 };
const M6_8: TimeSignature = { numerator: 6, denominator: 8 };
const M7_8: TimeSignature = { numerator: 7, denominator: 8 };

describe('supportedMeters', () => {
  it('lists the 4 phase-1 meters', () => {
    const meters = supportedMeters();
    expect(meters).toHaveLength(4);
    expect(meters.map((m) => `${m.numerator}/${m.denominator}`)).toEqual([
      '2/4',
      '3/4',
      '4/4',
      '6/8',
    ]);
  });
});

describe('supportedPathsForMeter', () => {
  it('2/4 supports two-beat first, four-beat as alternate', () => {
    const ids = supportedPathsForMeter(M2_4).map((p) => p.id);
    expect(ids).toEqual(['two-beat', 'four-beat']);
  });

  it('4/4 supports four-beat first, two-beat as alternate (cut-time feel)', () => {
    const ids = supportedPathsForMeter(M4_4).map((p) => p.id);
    expect(ids).toEqual(['four-beat', 'two-beat']);
  });

  it('6/8 supports two-beat (compound) and six-beat (slow subdivided)', () => {
    const ids = supportedPathsForMeter(M6_8).map((p) => p.id);
    expect(ids).toEqual(['two-beat', 'six-beat']);
  });

  it('3/4 supports three-beat and six-beat', () => {
    const ids = supportedPathsForMeter(M3_4).map((p) => p.id);
    expect(ids).toEqual(['three-beat', 'six-beat']);
  });

  it('returns empty for unregistered meter', () => {
    expect(supportedPathsForMeter(M7_8)).toEqual([]);
  });
});

describe('defaultPathForMeter', () => {
  it('returns first supported path', () => {
    expect(defaultPathForMeter(M4_4).id).toBe('four-beat');
    expect(defaultPathForMeter(M2_4).id).toBe('two-beat');
    expect(defaultPathForMeter(M6_8).id).toBe('two-beat');
  });

  it('throws for unregistered meter', () => {
    expect(() => defaultPathForMeter(M7_8)).toThrow(/No conducting paths/);
  });
});

describe('metersForPath', () => {
  it('two-beat is used by multiple meters', () => {
    const meters = metersForPath('two-beat').map((m) => `${m.numerator}/${m.denominator}`);
    expect(meters).toContain('2/4');
    expect(meters).toContain('4/4');
    expect(meters).toContain('6/8');
  });

  it('six-beat is reachable from 3/4 and 6/8', () => {
    const meters = metersForPath('six-beat').map((m) => `${m.numerator}/${m.denominator}`);
    expect(meters).toContain('3/4');
    expect(meters).toContain('6/8');
  });

  it('unknown path id → empty list', () => {
    expect(metersForPath('nine-beat')).toEqual([]);
  });
});

describe('isCompatible', () => {
  it('matches the supportedPathsForMeter listing', () => {
    expect(isCompatible(M4_4, 'four-beat')).toBe(true);
    expect(isCompatible(M4_4, 'two-beat')).toBe(true);
    expect(isCompatible(M4_4, 'three-beat')).toBe(false);
    expect(isCompatible(M3_4, 'two-beat')).toBe(false);
    expect(isCompatible(M6_8, 'six-beat')).toBe(true);
  });

  it('unknown meter → not compatible', () => {
    expect(isCompatible(M7_8, 'two-beat')).toBe(false);
  });
});
