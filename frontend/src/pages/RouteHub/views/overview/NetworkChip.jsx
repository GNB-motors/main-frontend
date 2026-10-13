import Ico from '../../routeHubIcons.jsx';
import { Skel } from '../../routeHubShared.jsx';

export default function NetworkChip({ chip, setChip, go, first, routes }) {
  return (
    <div className="ov chipcard" style={{ top: 14, left: 14, maxWidth: 280 }}>
      {chip ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="eyebrow" style={{ flex: 1 }}>
              Route
            </span>
            <button
              type="button"
              className="btn btn--sm btn--icon"
              aria-label="Clear"
              onClick={() => setChip(null)}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: 'var(--type-s)', fontWeight: 600, marginTop: 2 }}>
            {chip.name}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 8,
              fontSize: 11,
              color: 'var(--fg-secondary)',
            }}
          >
            <span>
              <b style={{ color: 'var(--fg-primary)', fontSize: 'var(--type-xs)' }}>
                {chip.distanceKm ?? '—'}
              </b>{' '}
              km
            </span>
            <span>
              <b style={{ color: chip.health.c, fontSize: 'var(--type-xs)' }}>
                {Number(chip.marginPct ?? 0).toFixed(1)}%
              </b>{' '}
              margin
            </span>
            <span>
              <b style={{ color: 'var(--fg-primary)', fontSize: 'var(--type-xs)' }}>
                {chip.tripCount ?? 0}
              </b>{' '}
              trips
            </span>
          </div>
          <button
            type="button"
            onClick={() => go('profitability', { c: chip.routeId })}
            style={{
              display: 'inline-flex',
              gap: 4,
              alignItems: 'center',
              marginTop: 10,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--fg-brand)',
            }}
          >
            Open in profitability <Ico n="arrowR" s={12} />
          </button>
        </>
      ) : first ? (
        <>
          <div className="eyebrow">Network</div>
          <Skel w={170} h={16} style={{ marginTop: 6 }} />
          <Skel w={130} h={10} style={{ marginTop: 6 }} />
        </>
      ) : (
        <>
          <div className="eyebrow">Network</div>
          <div style={{ fontSize: 'var(--type-m)', fontWeight: 600, marginTop: 4 }}>
            {routes.length} routes ·{' '}
            {routes.reduce((a, r) => a + (r.distanceKm || 0), 0).toLocaleString('en-IN')} km
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 2 }}>
            {routes.length ? 'Click a route for its numbers' : 'No billed routes yet'}
          </div>
        </>
      )}
    </div>
  );
}
