import { useEffect } from 'react';
import { motion as Motion, useMotionValue, useTransform, useReducedMotion, animate } from 'framer-motion';

const CX = 110;
const CY = 104;
const R = 84;
const START = 150; // degrees, SVG coords (0°=east, positive = clockwise)
const SPAN = 240; // degrees of sweep for 0 → 100

const rad = (deg) => (deg * Math.PI) / 180;
const point = (deg, r = R) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
const angleFor = (v) => START + (Math.max(0, Math.min(100, v)) / 100) * SPAN;

function arcPath(fromV, toV, r = R) {
  const [x1, y1] = point(angleFor(fromV), r);
  const [x2, y2] = point(angleFor(toV), r);
  const large = Math.abs(toV - fromV) > 50 ? 1 : 0; // >180° of the 240° span
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const GRADE_COLOR = {
  A: 'var(--ok)',
  B: 'var(--ok)',
  C: 'var(--caution)',
  D: 'var(--critical)',
};

/** Band segments matching grade cutoffs: D<60, C 60–75, B 75–90, A ≥90 */
const BANDS = [
  { from: 0, to: 60, color: 'var(--critical)' },
  { from: 60, to: 75, color: 'var(--caution)' },
  { from: 75, to: 90, color: 'var(--ok)' },
  { from: 90, to: 100, color: 'var(--ok)' },
];

function lampState(weight, penalty) {
  if (!penalty || penalty <= 0) return 'lamp--ok-idle';
  return penalty >= weight * 0.6 ? 'lamp--critical' : 'lamp--caution';
}

/**
 * FleetHealthGauge — the signature instrument.
 * 240° arc, needle, tabular score, grade letter, and a row of warning lamps —
 * one per penalty component — dark when clean, amber/red when penalized,
 * each carrying its backend-written detail string on hover.
 *
 * On mount the needle runs a one-time cluster self-test (0 → 100 → score,
 * ~900ms, framer-motion); skipped under prefers-reduced-motion.
 */
export default function FleetHealthGauge({ score = 0, grade = 'D', components = {}, size = 260 }) {
  const reduceMotion = useReducedMotion();
  const mv = useMotionValue(0);

  useEffect(() => {
    if (reduceMotion) {
      mv.set(score);
      return undefined;
    }
    const controls = animate(mv, [0, 100, score], {
      duration: 0.9,
      times: [0, 0.45, 1],
      ease: ['easeOut', 'easeInOut'],
    });
    return () => controls.stop();
    // Run the self-test once per score change target; mv identity is stable.
  }, [score, reduceMotion, mv]);

  const needleRotate = useTransform(mv, (v) => angleFor(v) - 90); // needle drawn pointing up

  const ticks = [];
  for (let v = 0; v <= 100; v += 10) {
    const major = v % 25 === 0;
    const [x1, y1] = point(angleFor(v), R - (major ? 10 : 6));
    const [x2, y2] = point(angleFor(v), R - 1);
    ticks.push(
      <line
        key={v}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--cluster-text-dim)"
        strokeWidth={major ? 2 : 1}
        opacity={major ? 0.8 : 0.45}
        strokeLinecap="round"
      />,
    );
  }

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 220 168" width={size} role="img" aria-label={`Fleet health score ${Math.round(score)} out of 100, grade ${grade}`}>
        {/* band arcs */}
        {BANDS.map((b) => (
          <path
            key={b.from}
            d={arcPath(b.from + 0.6, b.to - 0.6)}
            fill="none"
            stroke={b.color}
            strokeWidth={7}
            strokeLinecap="round"
            opacity={0.32}
          />
        ))}
        {/* value arc */}
        <Motion.path
          d={arcPath(0, 100)}
          fill="none"
          stroke={GRADE_COLOR[grade] || 'var(--inert)'}
          strokeWidth={7}
          strokeLinecap="round"
          style={{ pathLength: useTransform(mv, (v) => Math.max(0.001, v / 100)) }}
        />
        {ticks}
        {/* needle */}
        <Motion.g style={{ rotate: needleRotate, originX: `${CX}px`, originY: `${CY}px` }}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - R + 18} stroke="var(--cluster-text)" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={CX} cy={CY} r={5} fill="var(--cluster-text)" />
        </Motion.g>
        {/* score + grade */}
        <text
          x={CX}
          y={CY + 34}
          textAnchor="middle"
          className="num"
          fontSize={40}
          fontWeight={700}
          fill="var(--cluster-text)"
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(score)}
        </text>
        <text
          x={CX}
          y={CY + 54}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill={GRADE_COLOR[grade] || 'var(--inert)'}
          style={{ fontFamily: 'var(--font-cluster-display)', letterSpacing: '0.08em' }}
        >
          GRADE {grade}
        </text>
      </svg>

      {/* warning lamps — one per penalty component */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {Object.entries(components).map(([name, c]) => {
          const state = lampState(c?.weight ?? 0, c?.penalty ?? 0);
          const idle = state === 'lamp--ok-idle';
          return (
            <span key={name} className={`lamp ${idle ? '' : state}`} title={c?.detail || name}>
              {name}
              {c?.penalty > 0 ? <span>−{Number(c.penalty.toFixed ? c.penalty.toFixed(1) : c.penalty)}</span> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
