import { AlertTriangle, CheckCircle2, FlaskConical, MapPin } from 'lucide-react';
import SlideOver from './SlideOver';
import { formatINR, formatLitres } from '../../utils/formatters';

/**
 * EvidenceDrawer — the trust mechanic for any flagged fuel-integrity window.
 * Shows the actual mass-balance working so the owner sees *how* the number
 * was produced, not just the number itself.
 *
 * Props:
 *   open, onClose,
 *   window: a FuelIntegrityWindow row
 *   context?: { hotspot?, lastLocation? } optional human context
 */
export default function EvidenceDrawer({ open, onClose, window: w, context = {} }) {
  if (!w) return null;

  const pricePerL = context.fuelPriceInrPerL ?? 95;
  const unaccountedInr = w.unaccountedLossL != null ? Math.max(0, w.unaccountedLossL) * pricePerL : null;
  const isLoss = (w.unaccountedLossL || 0) > 0.5;
  const confidence = (w.siphonConfidence || '').toLowerCase();

  const Row = ({ label, value, sign, highlight = false, note }) => (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px dashed var(--hairline)' }}
    >
      <span className="text-sm" style={{ color: 'var(--cluster-text-dim)' }}>{label}</span>
      <div className="text-right">
        <span
          className={`font-mono text-sm tabular-nums ${highlight ? 'font-semibold' : ''}`}
          style={{ color: highlight ? 'var(--cluster-text)' : 'var(--cluster-text)' }}
        >
          {sign ? `${sign} ` : ''}{value}
        </span>
        {note && <div className="text-xs text-dim mt-0.5">{note}</div>}
      </div>
    </div>
  );

  const SummaryLine = () => {
    if (!isLoss) {
      return (
        <div className="flex items-start gap-2 rounded-lg p-3 signal-bg-ok">
          <CheckCircle2 size={16} className="mt-0.5 signal-ok" />
          <p className="text-sm signal-ok">
            Mass balance closes. Fuel in − fuel out ≈ tank change; no unexplained volume.
          </p>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-2 rounded-lg p-3 signal-bg-caution">
        <AlertTriangle size={16} className="mt-0.5 signal-caution" />
        <p className="text-sm signal-caution">
          Unaccounted fuel: the tank dropped more than fills + burn can explain.
          This can also be sensor drift, a missed fill, or a unit mismatch — please review.
          {confidence && ` Confidence: ${confidence}.`}
        </p>
      </div>
    );
  };

  const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Fuel mass-balance working"
      subtitle={`${w.registrationNumber || 'Vehicle'} · ${windowDates(w)}`}
      width={480}
    >
      <div className="space-y-5">
        <SummaryLine />

        <div className="cluster-inset p-4">
          <div className="cluster-eyebrow mb-3">The working</div>
          <Row
            label="Fills detected"
            value={formatLitres(w.fillsLitres, { decimals: 1 })}
            sign="+"
            note={`${w.fillCount || 0} fill events in this window`}
          />
          <Row
            label="Engine burn (CAN fuel_used)"
            value={formatLitres(w.engineBurnL, { decimals: 1 })}
            sign="−"
          />
          <Row
            label="Tank level change (Δ)"
            value={formatLitres(w.tankDeltaL, { decimals: 1 })}
            sign={w.tankDeltaL > 0 ? '+' : '−'}
            note={tankDeltaNote(w)}
          />
          <div
            className="my-2"
            style={{ borderTop: '1px solid var(--hairline)' }}
          />
          <Row
            label="Unaccounted volume"
            value={formatLitres(w.unaccountedLossL, { decimals: 1 })}
            sign={w.unaccountedLossL > 0 ? '−' : ''}
            highlight
          />
          {unaccountedInr != null && (
            <Row
              label={`≈ value @ ₹${pricePerL}/L`}
              value={formatINR(unaccountedInr, { decimals: 0 })}
              highlight
            />
          )}
        </div>

        <div className="cluster-inset p-4">
          <div className="cluster-eyebrow mb-3">Assumptions</div>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--cluster-text-dim)' }}>
            <li>
              Tank-level unit: <span className="font-mono">{w.tankLevelUnit || 'unknown'}</span>
              {w.capacityL && <span> · tank capacity {formatLitres(w.capacityL, { decimals: 0 })}</span>}
            </li>
            <li>
              Fuel price used: <span className="font-mono">₹{pricePerL}/L</span> (estimate from summary)
            </li>
            <li>
              Mass balance: fills − engine burn − Δtank = unaccounted.
            </li>
          </ul>
        </div>

        {context.hotspot && (
          <div className="cluster-inset p-4">
            <div className="cluster-eyebrow mb-2">Context</div>
            <p className="text-sm" style={{ color: 'var(--cluster-text)' }}>
              Stopped {context.hotspot.durationMin} min at {context.hotspot.lat}°N {context.hotspot.lng}°E
              {' — '}{context.hotspot.name || 'known hotspot'}
            </p>
            <a
              href={mapsLink(context.hotspot.lat, context.hotspot.lng)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--gnb-400)' }}
            >
              <MapPin size={14} /> Open in Google Maps
            </a>
          </div>
        )}

        {context.lastLocation && context.lastLocation.lat != null && (
          <a
            href={mapsLink(context.lastLocation.lat, context.lastLocation.lng)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--gnb-400)' }}
          >
            <MapPin size={14} /> Last known location
          </a>
        )}

        <div className="flex items-start gap-2 rounded-lg p-3" style={{ background: 'var(--glass)' }}>
          <FlaskConical size={16} className="mt-0.5 text-dim" />
          <p className="text-xs text-dim leading-relaxed">
            This is an estimate produced from tank-sensor telemetry. A positive unexplained loss
            is a flag, not proof. Please cross-check with pump bills, video logs and driver
            statements before acting.
          </p>
        </div>
      </div>
    </SlideOver>
  );
}

function windowDates(w) {
  const from = w.windowFrom ? new Date(w.windowFrom) : null;
  const to = w.windowTo ? new Date(w.windowTo) : null;
  if (!from && !to) return 'window dates unavailable';
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  if (!to) return fmt(from);
  if (!from) return fmt(to);
  return `${fmt(from)} → ${fmt(to)}`;
}

function tankDeltaNote(w) {
  if (w.tankDeltaL == null) return 'no tank-level reading';
  if (w.tankDeltaL < -5) return 'tank dropped significantly';
  if (w.tankDeltaL > 5) return 'tank level rose';
  return 'tank level stayed flat';
}
