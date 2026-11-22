import { formatINR, formatNum, isKnownNumber } from '@/utils/formatters';

/**
 * Num — a number that is honest about being unknown.
 *
 * A missing measurement renders as "—" with the reason beside it, never as 0,
 * ₹0 or 0%. A real zero stays a real zero — that is a measured answer.
 */
export default function Num({
  value = null,
  unit = null,
  reason = null,
  format = 'num',
  decimals = 0,
  showReason = true,
  className = '',
}) {
  if (!isKnownNumber(value)) {
    return (
      <span
        className={`inline-flex items-baseline gap-1.5 ${className}`}
        title={reason || 'Not available'}
      >
        <span className="num" style={{ color: 'var(--ds-ink3)' }}>
          —
        </span>
        {showReason && reason ? (
          <span className="text-[11px] leading-tight" style={{ color: 'var(--ds-ink3)' }}>
            {reason}
          </span>
        ) : null}
      </span>
    );
  }

  const formatted =
    format === 'inr' ? formatINR(value, { decimals }) : formatNum(value, { decimals });

  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className="num">{formatted}</span>
      {unit ? (
        <span className="text-[11px] leading-tight" style={{ color: 'var(--ds-ink3)' }}>
          {unit}
        </span>
      ) : null}
    </span>
  );
}
