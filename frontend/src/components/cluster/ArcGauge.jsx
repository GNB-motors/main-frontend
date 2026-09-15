import { formatLitres, formatPct, formatNum } from '../../utils/formatters';

/**
 * ArcGauge — small 200° dial for a single reading (fuel, DEF, etc.).
 *
 * The gauge is confidence-aware:
 *   measured        → solid arc, bold value
 *   stale           → dashed value arc, value shown with age
 *   no-data         → dashed empty arc, em-dash centre
 *   unit unverified → dotted arc, "unit unverified" centre
 *
 * Colour still follows warning-lamp semantics for measured values, but
 * unverified / no-data surfaces are rendered inert so the owner is never
 * nudged by a green/amber/red arc that has no foundation.
 *
 * Backward-compatible: when called with only value/label/unit, it behaves as
 * before (percent gauge with a measured reading).
 */
export default function ArcGauge({
  value,
  label,
  low = 15,
  warn = 35,
  size = 120,
  unit = '%',
  state = 'measured',
  ageText = '',
}) {
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
  const isUnverified = unit === 'unverified';
  const isNoData = state === 'no-data' || (!hasValue && !isUnverified);
  const isStale = state === 'stale';
  const isMeasured = state === 'measured' || state === 'measured-zero';

  const v = isNoData || isUnverified ? 0 : Number(value);
  const color = isNoData || isUnverified ? 'var(--inert)' : v < low ? 'var(--critical)' : v < warn ? 'var(--caution)' : 'var(--ok)';

  const formatValue = () => {
    if (unit === 'litres') return formatLitres(v);
    if (unit === '%') return formatPct(v);
    return formatNum(v);
  };

  const valueText = isNoData || isUnverified ? '' : formatValue();
  const mainText = isNoData ? '—' : isUnverified ? 'unit' : valueText;
  const subText = isNoData ? null : isUnverified ? 'unverified' : isStale ? ageText : null;
  const twoLine = subText != null;

  const ariaLabel = isNoData
    ? `${label}: no reading`
    : isUnverified
      ? `${label}: unit unverified`
      : isStale
        ? `${label}: ${valueText}, ${ageText}`
        : `${label}: ${valueText}`;

  const unitDisplay = unit === 'litres' ? 'L' : unit === '%' ? null : unit;
  const labelText = unitDisplay ? `${label} (${unitDisplay})` : label;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 120 86" width={size} role="img" aria-label={ariaLabel}>
        {/* background track */}
        <path
          d={arc(0, 100)}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={8}
          strokeLinecap="round"
        />

        {/* measured reading */}
        {isMeasured && hasValue && v > 0.5 ? (
          <path d={arc(0, v)} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
        ) : null}

        {/* stale reading — value arc is dashed and muted */}
        {isStale && hasValue ? (
          <path
            d={arc(0, v)}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="4 5"
            opacity={0.55}
          />
        ) : null}

        {/* unverified unit — dotted full arc, inert */}
        {isUnverified ? (
          <path
            d={arc(0, 100)}
            fill="none"
            stroke="var(--inert)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="2 6"
            opacity={0.45}
          />
        ) : null}

        {/* no data — dashed full arc, inert */}
        {isNoData ? (
          <path
            d={arc(0, 100)}
            fill="none"
            stroke="var(--inert)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="4 5"
            opacity={0.35}
          />
        ) : null}

        <text
          x={cx}
          y={twoLine ? cy - 2 : cy + 8}
          textAnchor="middle"
          fontSize={twoLine ? 11 : 20}
          fontWeight={700}
          fill="var(--cluster-text)"
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
        >
          <tspan x={cx} dy={0}>
            {mainText}
          </tspan>
          {subText ? (
            <tspan x={cx} dy={12} fontSize={10} fill="var(--cluster-text-dim)">
              {subText}
            </tspan>
          ) : null}
        </text>
      </svg>
      <span className="text-dim -mt-1 text-[11px] font-medium tracking-wide">
        {labelText}
      </span>
    </div>
  );
}
