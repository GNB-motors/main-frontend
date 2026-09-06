import { Link } from 'react-router-dom';
import { Truck, MapPin, ReceiptText, CheckCircle2, Fuel } from 'lucide-react';
import SlideOver from '../../components/cluster/SlideOver.jsx';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { formatINR, formatLitres } from '../../utils/formatters';

const STATUS_TONE = {
  CONFIRMED: { tone: 'ok', label: 'Confirmed' },
  REJECTED: { tone: 'inert', label: 'Rejected' },
  ESTIMATED: { tone: 'caution', label: 'Estimated' },
};

function Cell({ label, value, full = false, tone }) {
  return (
    <div className={`fi-detail-cell ${full ? 'fi-detail-cell--full' : ''}`}>
      <div className="fi-detail-label">{label}</div>
      <div className="fi-detail-value" style={tone ? { color: tone } : undefined}>
        {value ?? '—'}
      </div>
    </div>
  );
}

/**
 * EventInvestigationDrawer — operational investigation workflow for a single
 * detected fill. Everything shown is derived from the fill record plus the
 * vehicle's own fill history (previous / average / variance are computed here,
 * not invented).
 */
export default function EventInvestigationDrawer({ open, onClose, event, context = {}, reviewed, onMarkReviewed }) {
  if (!event) return null;

  const price = context.fuelPriceInrPerL ?? 95;
  const status = STATUS_TONE[event.confirmationStatus] || STATUS_TONE.ESTIMATED;
  const statusColor =
    status.tone === 'ok' ? 'var(--ok)' : status.tone === 'caution' ? 'var(--caution)' : 'var(--inert)';

  const litres = event.litres;
  const inr = litres != null ? litres * price : null;
  const prev = context.previousFill;
  const avg = context.averageFill;
  const variance = litres != null && avg != null ? litres - avg : null;
  const variancePct = variance != null && avg ? (variance / avg) * 100 : null;

  const billStatus = event.billFlag
    ? `Mismatch · ${event.billVarianceL ?? '—'} L variance`
    : event.claimedLitres != null
      ? 'Matched to bill'
      : 'No bill on file';

  const reasonForFlag = event.billFlag
    ? `Bill vs tank mismatch of ${event.billVarianceL ?? '—'} L — please review.`
    : event.confirmationStatus === 'ESTIMATED'
      ? 'Volume estimated from the tank-level jump. FleetEdge confirms in ~4h.'
      : event.confirmationStatus === 'REJECTED'
        ? 'FleetEdge did not confirm this as a fill.'
        : 'Confirmed fill — no anomaly detected.';

  const hasLoc = event.lat != null && event.lng != null;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={event.vehicle || 'Fuel event'}
      subtitle={`Fill · ${context.timestampLabel || ''}`}
      width={480}
    >
      <div className="flex flex-col gap-4">
        {/* headline */}
        <div className="ov-inset flex items-center justify-between p-4">
          <div>
            <div className="num text-2xl font-bold" style={{ color: 'var(--ok)' }}>
              +{formatLitres(litres ?? 0)}
            </div>
            <div className="text-dim text-xs">≈ {formatINR(inr)} estimated value</div>
          </div>
          <span className="ov-pill" style={{ color: statusColor, background: `color-mix(in srgb, ${statusColor} 12%, transparent)` }}>
            {status.label}
          </span>
        </div>

        {/* detail grid */}
        <div className="fi-detail-grid">
          <Cell label="Fuel type" value="Diesel" />
          <Cell label="Sensor jump" value={event.smoothedJumpL != null ? formatLitres(event.smoothedJumpL) : '—'} />
          <Cell label="Previous fill" value={prev != null ? formatLitres(prev) : '—'} />
          <Cell label="Average fill" value={avg != null ? formatLitres(avg) : '—'} />
          <Cell
            label="Variance vs avg"
            value={variance != null ? `${variance > 0 ? '+' : ''}${formatLitres(variance)}${variancePct != null ? ` (${variancePct > 0 ? '+' : ''}${variancePct.toFixed(0)}%)` : ''}` : '—'}
            tone={variance != null && Math.abs(variancePct || 0) > 40 ? 'var(--caution)' : undefined}
          />
          <Cell label="Odometer" value={event.odometer != null ? `${event.odometer} km` : '—'} />
          <Cell
            label="Bill status"
            value={billStatus}
            full
            tone={event.billFlag ? 'var(--caution)' : undefined}
          />
          <Cell
            label="Location"
            value={hasLoc ? <PlaceLabel lat={event.lat} lng={event.lng} /> : 'Not recorded'}
            full
          />
          <Cell label="Reason for flag" value={reasonForFlag} full tone={event.billFlag ? 'var(--caution)' : undefined} />
        </div>

        {/* actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link to={`/vehicles/${encodeURIComponent(event.vehicle)}`} className="ov-btn justify-center">
            <Truck size={15} /> View vehicle
          </Link>
          {hasLoc ? (
            <a href={`https://www.google.com/maps?q=${event.lat},${event.lng}`} target="_blank" rel="noreferrer" className="ov-btn justify-center">
              <MapPin size={15} /> View on map
            </a>
          ) : (
            <button type="button" className="ov-btn justify-center" disabled style={{ opacity: 0.5 }}>
              <MapPin size={15} /> No location
            </button>
          )}
          <Link to="/fuel-comparison" className="ov-btn justify-center">
            <ReceiptText size={15} /> View bill
          </Link>
          <button
            type="button"
            className={`ov-btn justify-center ${reviewed ? '' : 'ov-btn--primary'}`}
            onClick={() => onMarkReviewed?.(event.id)}
          >
            <CheckCircle2 size={15} /> {reviewed ? 'Reviewed' : 'Mark reviewed'}
          </button>
        </div>

        <p className="text-dim flex items-start gap-1.5 text-[11px] leading-relaxed">
          <Fuel size={12} className="mt-0.5 shrink-0" />
          All ₹ figures are estimates at ₹{price}/L. Flags mean “please review”, not a confirmed loss.
        </p>
      </div>
    </SlideOver>
  );
}
