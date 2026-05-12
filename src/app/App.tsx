import { useAppStore, amplitudeFor } from './store';
import { requirePath } from '../domain/conducting/registry';
import { useAudioClock } from '../engine/clock/useAudioClock';
import { BatonView } from '../scene/baton/BatonView';
import { Controls } from '../ui/controls/Controls';

export function App() {
  const bpm = useAppStore((s) => s.bpm);
  const timeSignature = useAppStore((s) => s.timeSignature);
  const pathId = useAppStore((s) => s.pathId);
  const dynamic = useAppStore((s) => s.dynamic);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setBpm = useAppStore((s) => s.setBpm);
  const setTimeSignature = useAppStore((s) => s.setTimeSignature);
  const setPathId = useAppStore((s) => s.setPathId);
  const setDynamic = useAppStore((s) => s.setDynamic);
  const setPlaying = useAppStore((s) => s.setPlaying);

  const path = requirePath(pathId);
  const amplitude = amplitudeFor(dynamic);
  const { getBeatPosition } = useAudioClock({
    bpm,
    beatsPerBar: path.beatCount,
    isPlaying,
  });

  return (
    <div className="app">
      <header className="header">
        <h1>Conductor Simulator</h1>
        <p className="subtitle">Phase 1 — 2D 視覺化節拍器</p>
      </header>

      <Controls
        bpm={bpm}
        timeSignature={timeSignature}
        pathId={pathId}
        dynamic={dynamic}
        isPlaying={isPlaying}
        onBpmChange={setBpm}
        onTimeSignatureChange={setTimeSignature}
        onPathIdChange={setPathId}
        onDynamicChange={setDynamic}
        onTogglePlay={() => setPlaying(!isPlaying)}
      />

      <div className="stage">
        <BatonView
          path={path}
          amplitude={amplitude}
          getBeatPosition={getBeatPosition}
          isPlaying={isPlaying}
        />
      </div>

      <footer className="hint">
        紅點 = 第 1 拍 (downbeat)，藍點 = 其他拍。Path 下拉只列出當前拍號可用的圖形。
      </footer>
    </div>
  );
}
