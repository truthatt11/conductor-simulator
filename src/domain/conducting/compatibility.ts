import type { TimeSignature } from '../score/types';
import type { ConductingPath } from './types';
import { requirePath } from './registry';

type MeterCompatibility = {
  readonly meter: TimeSignature;
  /** Path ids in preference order; index 0 is the conventional default. */
  readonly supportedPathIds: ReadonlyArray<string>;
};

const COMPATIBILITY: ReadonlyArray<MeterCompatibility> = [
  { meter: { numerator: 2, denominator: 4 }, supportedPathIds: ['two-beat', 'four-beat'] },
  { meter: { numerator: 3, denominator: 4 }, supportedPathIds: ['three-beat', 'six-beat'] },
  { meter: { numerator: 4, denominator: 4 }, supportedPathIds: ['four-beat', 'two-beat'] },
  { meter: { numerator: 6, denominator: 8 }, supportedPathIds: ['two-beat', 'six-beat'] },
];

function sameMeter(a: TimeSignature, b: TimeSignature): boolean {
  return a.numerator === b.numerator && a.denominator === b.denominator;
}

function meterLabel(ts: TimeSignature): string {
  return `${ts.numerator}/${ts.denominator}`;
}

function findEntry(ts: TimeSignature): MeterCompatibility | undefined {
  return COMPATIBILITY.find((c) => sameMeter(c.meter, ts));
}

export function supportedMeters(): ReadonlyArray<TimeSignature> {
  return COMPATIBILITY.map((c) => c.meter);
}

export function supportedPathsForMeter(ts: TimeSignature): ReadonlyArray<ConductingPath> {
  const entry = findEntry(ts);
  if (!entry) return [];
  return entry.supportedPathIds.map((id) => requirePath(id));
}

export function defaultPathForMeter(ts: TimeSignature): ConductingPath {
  const paths = supportedPathsForMeter(ts);
  const first = paths[0];
  if (!first) {
    throw new Error(`No conducting paths registered for meter ${meterLabel(ts)}`);
  }
  return first;
}

export function metersForPath(pathId: string): ReadonlyArray<TimeSignature> {
  return COMPATIBILITY.filter((c) => c.supportedPathIds.includes(pathId)).map((c) => c.meter);
}

export function isCompatible(ts: TimeSignature, pathId: string): boolean {
  return supportedPathsForMeter(ts).some((p) => p.id === pathId);
}
