import { describe, expect, it } from 'vitest';
import {
  appendMeasure,
  beatsPerMeasure,
  emptyScore,
  totalBeats,
  updateMeasure,
} from './score';
import type { Measure } from './types';

const m44: Omit<Measure, 'index'> = {
  timeSignature: { numerator: 4, denominator: 4 },
  tempo: { kind: 'steady', bpm: 120 },
  gestures: [],
};

const m68: Omit<Measure, 'index'> = {
  timeSignature: { numerator: 6, denominator: 8 },
  tempo: { kind: 'steady', bpm: 90 },
  gestures: [],
};

describe('beatsPerMeasure', () => {
  it('4/4 → 4 beats', () => {
    expect(beatsPerMeasure({ numerator: 4, denominator: 4 })).toBe(4);
  });

  it('3/4 → 3 beats', () => {
    expect(beatsPerMeasure({ numerator: 3, denominator: 4 })).toBe(3);
  });

  it('2/4 → 2 beats', () => {
    expect(beatsPerMeasure({ numerator: 2, denominator: 4 })).toBe(2);
  });

  it('6/8 compound → 2 dotted-quarter beats', () => {
    expect(beatsPerMeasure({ numerator: 6, denominator: 8 })).toBe(2);
  });

  it('9/8 compound → 3 dotted-quarter beats', () => {
    expect(beatsPerMeasure({ numerator: 9, denominator: 8 })).toBe(3);
  });

  it('5/8 non-compound → 5 beats (falls back to numerator)', () => {
    expect(beatsPerMeasure({ numerator: 5, denominator: 8 })).toBe(5);
  });
});

describe('Score immutability', () => {
  it('appendMeasure returns new object', () => {
    const a = emptyScore();
    const b = appendMeasure(a, m44);
    expect(a.measures).toHaveLength(0);
    expect(b.measures).toHaveLength(1);
    expect(b).not.toBe(a);
  });

  it('appendMeasure assigns sequential indices', () => {
    let s = emptyScore();
    s = appendMeasure(s, m44);
    s = appendMeasure(s, m68);
    expect(s.measures[0]?.index).toBe(0);
    expect(s.measures[1]?.index).toBe(1);
  });

  it('updateMeasure returns new object without mutating original', () => {
    const s1 = appendMeasure(emptyScore(), m44);
    const s2 = updateMeasure(s1, 0, (m) => ({ ...m, dynamic: 'ff' }));
    expect(s1.measures[0]?.dynamic).toBeUndefined();
    expect(s2.measures[0]?.dynamic).toBe('ff');
    expect(s2).not.toBe(s1);
    expect(s2.measures[0]).not.toBe(s1.measures[0]);
  });

  it('updateMeasure throws on out-of-bounds index', () => {
    const s = appendMeasure(emptyScore(), m44);
    expect(() => updateMeasure(s, 5, (m) => m)).toThrow(RangeError);
    expect(() => updateMeasure(s, -1, (m) => m)).toThrow(RangeError);
  });
});

describe('totalBeats', () => {
  it('sums beats across measures with mixed meters', () => {
    let s = emptyScore();
    s = appendMeasure(s, m44);
    s = appendMeasure(s, m44);
    s = appendMeasure(s, m68);
    expect(totalBeats(s)).toBe(4 + 4 + 2);
  });
});
