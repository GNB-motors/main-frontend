import { OS_THRESHOLD } from './overviewConstants.js';

/** The design's 36-segment speed arc, lit up to the fleet's peak speed. */
export default function Gauge({ peak, eventCount, flagged, vehicleCount }) {
  const segs = 36;
  const lit = Math.max(0, Math.min(segs, Math.round((peak / 120) * segs)));
  const segA = (i) => -220 + i * (260 / (segs - 1));
  const line = (i, col, animate) => {
    const a = (segA(i) * Math.PI) / 180;
    const r1 = 44;
    const r2 = 54;
    return (
      <line
        key={`${col}-${i}`}
        className={animate ? 'gseg' : undefined}
        style={animate ? { animationDelay: `${120 + i * 28}ms` } : undefined}
        x1={60 + r1 * Math.cos(a)}
        y1={60 + r1 * Math.sin(a)}
        x2={60 + r2 * Math.cos(a)}
        y2={60 + r2 * Math.sin(a)}
        stroke={col}
        strokeWidth="4"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className="gauge">
      <svg width="120" height="108" viewBox="0 0 120 108">
        {Array.from({ length: segs }, (_, i) => line(i, 'var(--morning-fog-700)', false))}
        {Array.from({ length: lit }, (_, i) =>
          line(i, (i / segs) * 120 > OS_THRESHOLD ? '#C2323A' : '#F0AA48', true),
        )}
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fontSize="26"
          fontWeight="600"
          fill="currentColor"
          fontFamily="Inter"
        >
          {peak || 0}
        </text>
        <text
          x="60"
          y="80"
          textAnchor="middle"
          fontSize="10"
          fill="var(--fg-secondary)"
          fontFamily="Inter"
        >
          peak km/h
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 'var(--type-2xl)', fontWeight: 600, lineHeight: '30px' }}>
            {eventCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>sustained events</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--type-m)', fontWeight: 600 }}>
            {flagged} of {vehicleCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>vehicles flagged</div>
        </div>
      </div>
    </div>
  );
}
