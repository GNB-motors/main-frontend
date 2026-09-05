import { Link } from 'react-router-dom';
import { Truck, Check, Loader2, CheckCircle2 } from 'lucide-react';
import SlideOver from '../../components/cluster/SlideOver.jsx';
import { formatINR } from '../../utils/formatters';
import VehicleLink from '../../components/Fleet/VehicleLink.jsx';

/**
 * AlertDetailsDrawer — structured, single-alert investigation panel.
 * Reads the alert record verbatim; the full backend message is preserved under
 * IMPACT so nothing is lost while the header stays scannable.
 */
export default function AlertDetailsDrawer({ open, onClose, alert, onAck, acking }) {
  if (!alert) return null;
  const sev = alert.severity || 'WARNING';
  const color = sev === 'CRITICAL' ? 'var(--critical)' : sev === 'INFO' ? 'var(--gnb-400)' : 'var(--caution)';
  const source = String(alert.type || '').startsWith('FLEETEDGE') ? 'FleetEdge' : 'FleetEdge telemetry';

  return (
    <SlideOver open={open} onClose={onClose} title="Alert details" subtitle={alert.detectedRel || ''} width={460}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="ov-pill" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{sev}</span>
          {alert.acknowledged ? (
            <span className="ov-pill ov-pill--inert">Acknowledged</span>
          ) : (
            <span className="ov-pill ov-pill--caution">To review</span>
          )}
        </div>

        <div>
          <h3 className="cluster-title text-lg" style={{ color }}>{alert.title}</h3>
          {alert.vehicleNumber ? (
            <VehicleLink reg={alert.vehicleNumber} className="mt-2 inline-block" />
          ) : (
            <span className="text-dim mt-2 inline-block text-sm">Fleet-wide</span>
          )}
        </div>

        <div className="fi-detail-grid">
          <div className="fi-detail-cell fi-detail-cell--full">
            <div className="fi-detail-label">Detected</div>
            <div className="fi-detail-value">{alert.detectedAbs}</div>
            <div className="text-dim text-xs">{alert.detectedRel}</div>
          </div>
          <div className="fi-detail-cell">
            <div className="fi-detail-label">Alert type</div>
            <div className="fi-detail-value" style={{ fontSize: 13 }}>{alert.typeLabel}</div>
          </div>
          <div className="fi-detail-cell">
            <div className="fi-detail-label">Source</div>
            <div className="fi-detail-value" style={{ fontSize: 13 }}>{source}</div>
          </div>
          {alert.inrEstimate != null && (
            <div className="fi-detail-cell fi-detail-cell--full">
              <div className="fi-detail-label">Estimated value</div>
              <div className="fi-detail-value" style={{ color }}>{formatINR(alert.inrEstimate)}</div>
            </div>
          )}
          <div className="fi-detail-cell fi-detail-cell--full">
            <div className="fi-detail-label">Impact</div>
            <div className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--cluster-text)' }}>{alert.message}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {alert.vehicleNumber ? (
            <Link to={`/vehicles/${encodeURIComponent(alert.vehicleNumber)}`} className="ov-btn justify-center">
              <Truck size={15} /> View vehicle
            </Link>
          ) : (
            <span />
          )}
          {alert.acknowledged ? (
            <button type="button" className="ov-btn justify-center" disabled>
              <CheckCircle2 size={15} /> Acknowledged
            </button>
          ) : (
            <button type="button" className="ov-btn ov-btn--primary justify-center" disabled={acking} onClick={() => onAck?.(alert.id)}>
              {acking ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Acknowledge
            </button>
          )}
        </div>

        <p className="text-dim text-[11px] leading-relaxed">
          Alerts mean “please review”, never an accusation. Acknowledging records that you’ve seen it.
        </p>
      </div>
    </SlideOver>
  );
}
