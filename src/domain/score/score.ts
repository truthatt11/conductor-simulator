import type { Measure, Score, TimeSignature } from './types';

export function emptyScore(): Score {
  return { meta: {}, measures: [] };
}

export function singleMeasureScore(measure: Measure): Score {
  return { meta: {}, measures: [measure] };
}

export function beatsPerMeasure(ts: TimeSignature): number {
  if (ts.denominator === 8 && ts.numerator % 3 === 0) {
    return ts.numerator / 3;
  }
  return ts.numerator;
}

export function totalBeats(score: Score): number {
  return score.measures.reduce((sum, m) => sum + beatsPerMeasure(m.timeSignature), 0);
}

export function appendMeasure(score: Score, measure: Omit<Measure, 'index'>): Score {
  const next: Measure = { ...measure, index: score.measures.length };
  return { ...score, measures: [...score.measures, next] };
}

export function updateMeasure(
  score: Score,
  index: number,
  update: (m: Measure) => Measure,
): Score {
  if (index < 0 || index >= score.measures.length) {
    throw new RangeError(`Measure index ${index} out of bounds [0, ${score.measures.length})`);
  }
  return {
    ...score,
    measures: score.measures.map((m, i) => (i === index ? update(m) : m)),
  };
}
