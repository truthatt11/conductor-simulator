import type { ConductingPath } from './types';
import { twoBeatPath } from './paths/twoBeat';
import { threeBeatPath } from './paths/threeBeat';
import { fourBeatPath } from './paths/fourBeat';
import { sixBeatPath } from './paths/sixBeat';

const PATHS: ReadonlyArray<ConductingPath> = [
  twoBeatPath,
  threeBeatPath,
  fourBeatPath,
  sixBeatPath,
];

export function listPaths(): ReadonlyArray<ConductingPath> {
  return PATHS;
}

export function findPath(id: string): ConductingPath | undefined {
  return PATHS.find((p) => p.id === id);
}

export function requirePath(id: string): ConductingPath {
  const p = findPath(id);
  if (!p) throw new Error(`Unknown conducting path id: ${id}`);
  return p;
}
