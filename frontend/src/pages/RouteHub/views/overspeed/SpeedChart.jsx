import { fmtT } from '../../routeHubFormat';

/** Speed trace — the design's SVG chart, re-plotted against real timestamps. */
export default function SpeedChart({ series, events, threshold, from, to }) {
  const W = 1000;
  const H = 240;
  const pl = 36;
  const pb = 24;
  const intervals = series.filter(
    (iv) =>
      Number.isFinite(iv.speedKmh) &&
      iv.speedKmh >= 0 &&
      Number.isFinite(Date.parse(iv.startAt)) &&
      Date.parse(iv.endAt) > Date.parse(iv.startAt),
  );
  const peak = Math.max(threshold, ...intervals.map((iv) => iv.speedKmh));
  const max = Math.max(100, Math.ceil((peak * 1.1) / 20) * 20);
  const t0 = from.getTime();
  const span = Math.max(1, to.getTime() - t0);
  const x = (ms) => pl + ((ms - t0) / span) * (W - pl - 8);
  const y = (s) => H - pb - (s / max) * (H - pb - 10);

  const paths = { GOOD: '', LOW: '' };
  let previous = null;
  for (const iv of intervals) {
    const start = Date.parse(iv.startAt);
    const end = Date.parse(iv.endAt);
    const quality = iv.quality === 'LOW' ? 'LOW' : 'GOOD';
    // Step intervals preserve the detector's average for the whole interval.
    // Never join across missing/rejected readings or a change in quality.
    const connected = previous?.end === start && previous.quality === quality;
    paths[quality] +=
      `${connected ? 'L' : 'M'}${x(start).toFixed(1)} ${y(iv.speedKmh).toFixed(1)} L${x(end).toFixed(1)} ${y(iv.speedKmh).toFixed(1)} `;
    previous = { end, quality };
  }

  const ticks = Array.from({ length: 6 }, (_, i) => (max / 5) * i);
  const xLabels = [];
  const stepMs = span / 6;
  for (let i = 0; i <= 6; i += 1) {
    const ms = t0 + stepMs * i;
    xLabels.push(
      <text
        key={ms}
        x={x(ms)}
        y={H - 6}
        textAnchor="middle"
        fontSize="10"
        fill="var(--fg-tertiary)"
      >
        {fmtT(new Date(ms)).replace(':00', '')}
      </text>,
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Ground speed over time"
    >
      {ticks.map((s) => (
        <g key={s}>
          <line x1={pl} x2={W - 8} y1={y(s)} y2={y(s)} stroke="var(--border-subtle)" />
          <text x={pl - 6} y={y(s) + 3} textAnchor="end" fontSize="10" fill="var(--fg-tertiary)">
            {s}
          </text>
        </g>
      ))}
      {events.map((e) => {
        const sx = x(new Date(e.startAt).getTime());
        const ex = x(new Date(e.endAt).getTime());
        return (
          <g key={e.startAt}>
            <rect
              x={sx}
              y={10}
              width={Math.max(3, ex - sx)}
              height={H - pb - 10}
              fill="rgba(229,104,107,.18)"
            />
            <text
              x={(sx + ex) / 2}
              y={22}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#C2323A"
            >
              {e.maxSpeedKmh}
            </text>
          </g>
        );
      })}
      {Object.entries(paths).map(([quality, d]) => (
        <path
          key={quality}
          aria-label={quality === 'LOW' ? 'Low-quality ground speed' : 'Ground speed'}
          d={d.trim()}
          fill="none"
          stroke="#2F58EE"
          strokeWidth="1.6"
          strokeDasharray={quality === 'LOW' ? '5 4' : undefined}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <line
        x1={pl}
        x2={W - 8}
        y1={y(threshold)}
        y2={y(threshold)}
        stroke="#C2323A"
        strokeWidth="1.5"
        strokeDasharray="6 5"
        vectorEffect="non-scaling-stroke"
      />
      {xLabels}
    </svg>
  );
}
