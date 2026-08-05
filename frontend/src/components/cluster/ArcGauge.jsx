import { formatPct } from '../../utils/formatters';

/**
 * ArcGauge — small 200° dial for a single reading (fuel %, DEF %).
 * Colour follows warning-lamp semantics unless overridden:
 * red below `low`, amber below `warn`, green otherwise.
 */
export default function ArcGauge({ value, label, low = 15, warn = 35, size = 120, unit = '%' }) {
  const cx = 60;
  const cy = 56;
  const r = 46;
  const start = 160;
  const span = 220;
  const rad = (d) => (d * Math.PI) / 180;
  const pt = (deg, rr = r) => [cx + rr * Math.cos(rad(deg)), cy + rr * Math.sin(rad(deg))];
  const angleFor = (v) => start + (Math.max(0, Math.min(100, v)) / 100) * span;

  const arc = (fromV, toV) => {
    const [x1, y1] = pt(angleFor(fromV));
    const [x2, y2] = pt(angleFor(toV));
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${toV - fromV > 55 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  const hasValue = value != null && !Number.isNaN(Number(value));
  const v = hasValue ? Number(value) : 0;
  const color = !hasValue ? 'var(--inert)' : v < low ? 'var(--critical)' : v < warn ? 'var(--caution)' : 'var(--ok)';

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 120 86" width={size} role="img" aria-label={`${label}: ${hasValue ? `${v}%` : 'no reading'}`}>
        <path d={arc(0, 100)} fill="none" stroke="var(--hairline)" strokeWidth={8} strokeLinecap="round" />
        {hasValue && v > 0.5 ? (
          <path d={arc(0, v)} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
        ) : null}
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize={20}
          fontWeight={700}
          fill="var(--cluster-text)"
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
        >
          {hasValue ? formatPct(v) : '—'}
        </text>
      </svg>
      <span className="text-dim -mt-1 text-[11px] font-medium tracking-wide">
        {label}
        {unit !== '%' ? ` (${unit})` : ''}
      </span>
    </div>
  );
}
