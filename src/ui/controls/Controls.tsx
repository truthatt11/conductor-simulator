import { useEffect, useState } from 'react';
import type { Dynamic, TimeSignature } from '../../domain/score/types';
import {
  supportedMeters,
  supportedPathsForMeter,
} from '../../domain/conducting/compatibility';

type ControlsProps = {
  bpm: number;
  timeSignature: TimeSignature;
  pathId: string;
  dynamic: Dynamic;
  isPlaying: boolean;
  showTrajectory: boolean;
  showBeatAnchors: boolean;
  onBpmChange: (bpm: number) => void;
  onTimeSignatureChange: (ts: TimeSignature) => void;
  onPathIdChange: (id: string) => void;
  onDynamicChange: (d: Dynamic) => void;
  onTogglePlay: () => void;
  onToggleTrajectory: () => void;
  onToggleBeatAnchors: () => void;
};

const DYNAMICS: ReadonlyArray<Dynamic> = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];

function meterLabel(ts: TimeSignature): string {
  return `${ts.numerator}/${ts.denominator}`;
}

export function Controls({
  bpm,
  timeSignature,
  pathId,
  dynamic,
  isPlaying,
  showTrajectory,
  showBeatAnchors,
  onBpmChange,
  onTimeSignatureChange,
  onPathIdChange,
  onDynamicChange,
  onTogglePlay,
  onToggleTrajectory,
  onToggleBeatAnchors,
}: ControlsProps) {
  const meters = supportedMeters();
  const compatiblePaths = supportedPathsForMeter(timeSignature);
  const meterKey = meterLabel(timeSignature);

  const [bpmDraft, setBpmDraft] = useState(String(bpm));
  useEffect(() => {
    setBpmDraft(String(bpm));
  }, [bpm]);

  function commitBpm() {
    const n = Number(bpmDraft);
    if (Number.isFinite(n) && n > 0) {
      onBpmChange(n);
    } else {
      setBpmDraft(String(bpm));
    }
  }

  return (
    <div className="controls">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="play-button"
      >
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>

      <label className="field">
        <span>BPM</span>
        <input
          type="number"
          min={30}
          max={240}
          value={bpmDraft}
          onChange={(e) => setBpmDraft(e.target.value)}
          onBlur={commitBpm}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      </label>

      <label className="field">
        <span>Meter (拍號)</span>
        <select
          value={meterKey}
          onChange={(e) => {
            const found = meters.find((m) => meterLabel(m) === e.target.value);
            if (found) onTimeSignatureChange(found);
          }}
        >
          {meters.map((m) => (
            <option key={meterLabel(m)} value={meterLabel(m)}>
              {meterLabel(m)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Path (指揮圖形)</span>
        <select value={pathId} onChange={(e) => onPathIdChange(e.target.value)}>
          {compatiblePaths.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Dynamic</span>
        <select value={dynamic} onChange={(e) => onDynamicChange(e.target.value as Dynamic)}>
          {DYNAMICS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onToggleTrajectory}
        aria-pressed={showTrajectory}
        className="toggle-button"
      >
        {showTrajectory ? '隱藏軌跡' : '顯示軌跡'}
      </button>

      <button
        type="button"
        onClick={onToggleBeatAnchors}
        aria-pressed={showBeatAnchors}
        className="toggle-button"
      >
        {showBeatAnchors ? '隱藏拍點' : '顯示拍點'}
      </button>
    </div>
  );
}
