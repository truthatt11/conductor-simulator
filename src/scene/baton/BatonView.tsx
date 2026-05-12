import { useEffect, useRef, useState } from 'react';
import type { ConductingPath, Vec2 } from '../../domain/conducting/types';

type BatonViewProps = {
  path: ConductingPath;
  amplitude: number;
  getBeatPosition: () => number;
  isPlaying: boolean;
  showDebug?: boolean;
  showTrajectory?: boolean;
  showBeatAnchors?: boolean;
  showSamplePoints?: boolean;
};

const VIEW_SIZE = 480;
const PADDING = 40;
const CURVE_SAMPLES = 240;
const SAMPLE_POINT_COUNT = 256;

function toScreen(v: Vec2): Vec2 {
  const cx = VIEW_SIZE / 2;
  const cy = VIEW_SIZE / 2;
  const scale = (VIEW_SIZE - PADDING * 2) / 2;
  return { x: cx + v.x * scale, y: cy - v.y * scale };
}

function buildPathD(path: ConductingPath, amplitude: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const t = i / CURVE_SAMPLES;
    const p = toScreen(path.sample(t, { amplitude }));
    pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }
  return pts.join(' ');
}

export function BatonView({
  path,
  amplitude,
  getBeatPosition,
  isPlaying,
  showDebug = true,
  showTrajectory = true,
  showBeatAnchors = true,
  showSamplePoints = false,
}: BatonViewProps) {
  const dotRef = useRef<SVGCircleElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [pathD, setPathD] = useState(() => buildPathD(path, amplitude));

  useEffect(() => {
    setPathD(buildPathD(path, amplitude));
  }, [path, amplitude]);

  useEffect(() => {
    function frame() {
      const beat = getBeatPosition();
      const t = (beat / path.beatCount) % 1;
      const p = toScreen(path.sample(t, { amplitude }));
      const dot = dotRef.current;
      if (dot) {
        dot.setAttribute('cx', p.x.toString());
        dot.setAttribute('cy', p.y.toString());
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [path, amplitude, getBeatPosition]);

  const anchors = path.beatAnchors.map((a) =>
    toScreen({ x: a.x * amplitude, y: a.y * amplitude }),
  );

  const samplePoints: Vec2[] = [];
  if (showSamplePoints) {
    for (let i = 0; i < SAMPLE_POINT_COUNT; i++) {
      samplePoints.push(toScreen(path.sample(i / SAMPLE_POINT_COUNT, { amplitude })));
    }
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      width={VIEW_SIZE}
      height={VIEW_SIZE}
      style={{ background: '#1d1f25', borderRadius: 12, display: 'block' }}
      aria-label={`Conducting path: ${path.label}`}
    >
      {showDebug && (
        <>
          <line x1={VIEW_SIZE / 2} y1={0} x2={VIEW_SIZE / 2} y2={VIEW_SIZE} stroke="#2a2d36" strokeWidth={1} />
          <line x1={0} y1={VIEW_SIZE / 2} x2={VIEW_SIZE} y2={VIEW_SIZE / 2} stroke="#2a2d36" strokeWidth={1} />
        </>
      )}

      {showTrajectory && (
        <path d={pathD} stroke="#4a90e2" strokeWidth={2} fill="none" opacity={0.5} />
      )}

      {showSamplePoints &&
        samplePoints.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={2.5} fill="#f5b942" opacity={0.85} />
        ))}

      {showBeatAnchors &&
        anchors.map((a, i) => (
          <g key={i}>
            <circle cx={a.x} cy={a.y} r={8} fill={i === 0 ? '#e2554a' : '#4a90e2'} opacity={0.7} />
            <text
              x={a.x}
              y={a.y - 14}
              fill="#e7e7ea"
              fontSize={14}
              textAnchor="middle"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          </g>
        ))}

      <circle ref={dotRef} cx={VIEW_SIZE / 2} cy={VIEW_SIZE / 2} r={10} fill="#fff" opacity={isPlaying ? 1 : 0.3} />
    </svg>
  );
}
