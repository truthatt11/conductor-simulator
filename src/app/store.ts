import { create } from 'zustand';
import type { TimeSignature, Dynamic } from '../domain/score/types';
import { DYNAMIC_AMPLITUDE } from '../domain/conducting/types';
import { defaultPathForMeter, isCompatible } from '../domain/conducting/compatibility';

export type AppState = {
  bpm: number;
  timeSignature: TimeSignature;
  pathId: string;
  dynamic: Dynamic;
  isPlaying: boolean;
  showTrajectory: boolean;
  showBeatAnchors: boolean;
  showSamplePoints: boolean;
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setPathId: (id: string) => void;
  setDynamic: (d: Dynamic) => void;
  setPlaying: (p: boolean) => void;
  setShowTrajectory: (v: boolean) => void;
  setShowBeatAnchors: (v: boolean) => void;
  setShowSamplePoints: (v: boolean) => void;
};

const INITIAL_METER: TimeSignature = { numerator: 4, denominator: 4 };

export const useAppStore = create<AppState>((set) => ({
  bpm: 90,
  timeSignature: INITIAL_METER,
  pathId: defaultPathForMeter(INITIAL_METER).id,
  dynamic: 'mf',
  isPlaying: false,
  showTrajectory: true,
  showBeatAnchors: true,
  showSamplePoints: false,
  setBpm: (bpm) => set({ bpm: clamp(bpm, 30, 240) }),
  setTimeSignature: (timeSignature) =>
    set((s) => {
      if (isCompatible(timeSignature, s.pathId)) return { timeSignature };
      return { timeSignature, pathId: defaultPathForMeter(timeSignature).id };
    }),
  setPathId: (pathId) =>
    set((s) => {
      if (!isCompatible(s.timeSignature, pathId)) return s;
      return { pathId };
    }),
  setDynamic: (dynamic) => set({ dynamic }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setShowTrajectory: (showTrajectory) => set({ showTrajectory }),
  setShowBeatAnchors: (showBeatAnchors) => set({ showBeatAnchors }),
  setShowSamplePoints: (showSamplePoints) => set({ showSamplePoints }),
}));

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function amplitudeFor(d: Dynamic): number {
  return DYNAMIC_AMPLITUDE[d];
}
