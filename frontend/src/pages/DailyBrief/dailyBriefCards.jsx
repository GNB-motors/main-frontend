import { CheckCircle2, Clock, TrendingDown } from 'lucide-react';
import { formatInrCompact, formatNum } from '../../utils/formatters';

/**
 * Presentational atoms for the Daily Brief. Kept separate from
 * DailyBriefPage.jsx per the house rule that a file exports components OR
 * plain functions, never both.
 */

const CARD_BORDER = '1px solid color-mix(in srgb, var(--cluster-text) 16%, transparent)';

export function TotalImpactTile({ totalRupees }) {
  return (
    <div className="ov-kpi" style={{ border: CARD_BORDER }}>
      <span className="ov-kpi-label">
        <TrendingDown size={13} style={{ color: 'var(--critical)' }} />
        Total ₹ impact today
      </span>
      <span className="ov-kpi-value" style={{ color: 'var(--critical)' }}>
        {formatInrCompact(totalRupees)}
      </span>
      <span className="ov-kpi-sub">Across sections reporting a number today</span>
    </div>
  );
}

function EventRow({ event }) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-1.5 text-sm"
      style={{ color: 'var(--cluster-text)' }}
    >
      <span className="font-semibold">{event.registrationNumber || 'Unknown vehicle'}</span>
      <span className="text-dim flex items-center gap-1 text-xs">
        <Clock size={12} />
        {formatNum(event.durationMin)} min
      </span>
      <span className="num font-semibold" style={{ color: 'var(--critical)' }}>
        {formatInrCompact(event.rupees)}
      </span>
    </div>
  );
}

/** One economically-significant section: idling ₹, drain ₹, or efficiency drift. */
export function BriefSectionCard({ section }) {
  const { label, status } = section;

  if (status === 'not_available_yet') {
    return (
      <div
        className="ov-panel p-4"
        style={{
          border: '1px dashed color-mix(in srgb, var(--cluster-text) 20%, transparent)',
          opacity: 0.75,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className="text-sm font-bold uppercase tracking-wide"
            style={{ color: 'var(--cluster-text-dim)' }}
          >
            {label}
          </span>
          <span className="ov-pill ov-pill--inert">Coming soon</span>
        </div>
        <p className="text-dim mt-2 text-xs leading-relaxed">{section.reason}</p>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="ov-panel flex items-center gap-3 p-4" style={{ border: CARD_BORDER }}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--ok) 12%, transparent)',
            color: 'var(--ok)',
          }}
        >
          <CheckCircle2 size={18} />
        </span>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>
            {label}
          </div>
          <div className="text-dim text-xs">Nothing to report today.</div>
        </div>
      </div>
    );
  }

  // status === 'ok'
  return (
    <div
      className="ov-panel p-4"
      style={{ border: CARD_BORDER, borderLeft: '3px solid var(--critical)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: 'var(--critical)' }}
        >
          {label}
        </span>
        <span className="num text-lg font-bold" style={{ color: 'var(--critical)' }}>
          {formatInrCompact(section.rupees)}
        </span>
      </div>
      {section.suggestedAction && (
        <p className="mt-2.5 text-sm leading-snug" style={{ color: 'var(--cluster-text)' }}>
          {section.suggestedAction}
        </p>
      )}
      {section.events?.length > 0 && (
        <div className="mt-3 border-t pt-2" style={{ borderColor: 'var(--hairline)' }}>
          {section.events.map((event) => (
            <EventRow key={event.vehicleId} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
