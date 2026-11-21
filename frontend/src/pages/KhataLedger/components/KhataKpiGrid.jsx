import { Skeleton } from '@/components/ui/skeleton';
import { KhataPill } from './khataUi';
import '../KhataLedger.css';

const VALUE_TONE = { critical: 'is-bad', bad: 'is-bad', ok: 'is-ok' };

const clampPct = (pct) => Math.min(100, Math.max(0, Number(pct) || 0));

/** Picks a column count that divides the cards, so no row is left half empty. */
const columnsFor = (count) => (count === 3 || count === 6 ? 3 : count === 2 ? 2 : 4);

/**
 * Summary figures. By default each figure is its own stat card in a grid
 * (skill 6.4). `variant="strip"` joins them edge to edge, for the entity header
 * card and dialogs only (skill 6.5). Items: { label, value, qualifier, sub,
 * status, tone, noteTone ('warn' | 'bad'), pct (0–100, draws a track), onClick }.
 */
export default function KhataKpiGrid({ items, loading = false, variant = 'cards', label }) {
  if (variant === 'strip') {
    return (
      <div
        className="khata-kpis"
        style={{ '--khata-kpi-count': items.length }}
        aria-busy={loading}
        aria-label={label}
      >
        {items.map(({ label: name, value, sub, status, tone, noteTone, pct, onClick }) => {
          const Tile = onClick ? 'button' : 'div';
          return (
            <Tile
              key={name}
              type={onClick ? 'button' : undefined}
              className="khata-kpi"
              onClick={onClick}
            >
              <span className="khata-kpi-label">
                <span>{name}</span>
                {!loading && status ? (
                  <KhataPill tone={tone || 'neutral'} small>
                    {status}
                  </KhataPill>
                ) : null}
              </span>
              <strong className={`khata-kpi-value ${VALUE_TONE[tone] || ''}`.trim()}>
                {loading ? <Skeleton className="h-6 w-24" /> : value}
              </strong>
              <i className="khata-kpi-bar" aria-hidden="true">
                {!loading && pct != null ? <b style={{ width: `${clampPct(pct)}%` }} /> : null}
              </i>
              <small className={`khata-kpi-note ${noteTone ? `is-${noteTone}` : ''}`.trim()}>
                {loading ? null : sub}
              </small>
            </Tile>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="khata-stats"
      data-cols={columnsFor(items.length)}
      style={{ '--khata-cols': columnsFor(items.length) }}
      aria-busy={loading}
      aria-label={label}
      role={label ? 'group' : undefined}
    >
      {items.map(({ label: name, value, qualifier, sub, status, tone, noteTone, pct, onClick }) => {
        const Card = onClick ? 'button' : 'section';
        return (
          <Card
            key={name}
            type={onClick ? 'button' : undefined}
            className="khata-card khata-stat"
            onClick={onClick}
          >
            <div className="khata-card-head">
              <h3 className="khata-card-title">{name}</h3>
              {!loading && status ? (
                <KhataPill tone={tone || 'neutral'} small>
                  {status}
                </KhataPill>
              ) : null}
            </div>
            <div className="khata-figure">
              {loading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <strong className={VALUE_TONE[tone] || undefined}>{value}</strong>
                  {qualifier ? <span>{qualifier}</span> : null}
                </>
              )}
            </div>
            {!loading && pct != null ? (
              <span className="khata-track" aria-hidden="true">
                <span style={{ width: `${clampPct(pct)}%` }} />
              </span>
            ) : null}
            <div className={`khata-stat-note ${noteTone ? `is-${noteTone}` : ''}`.trim()}>
              {loading ? <Skeleton className="h-3 w-32" /> : sub}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
