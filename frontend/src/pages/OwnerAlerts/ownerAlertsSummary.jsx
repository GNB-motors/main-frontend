import { AlertTriangle, ShieldAlert, Bell, Truck } from 'lucide-react';
import { formatNum } from '../../utils/formatters';

export default function OwnerAlertsSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="ov-kpi" style={{ borderLeft: '3px solid var(--caution)' }}>
        <span className="ov-kpi-label">
          <AlertTriangle size={13} style={{ color: 'var(--caution)' }} /> To review
        </span>
        <span className="ov-kpi-value" style={{ color: 'var(--caution)' }}>
          {formatNum(summary.toReview)}
        </span>
        <span className="ov-kpi-sub">unacknowledged alerts</span>
      </div>

      <div
        className="ov-kpi"
        style={summary.critical > 0 ? { borderLeft: '3px solid var(--critical)' } : undefined}
      >
        <span className="ov-kpi-label">
          <ShieldAlert size={13} style={{ color: 'var(--critical)' }} /> Critical
        </span>
        <span
          className="ov-kpi-value"
          style={summary.critical > 0 ? { color: 'var(--critical)' } : undefined}
        >
          {formatNum(summary.critical)}
        </span>
        <span className="ov-kpi-sub">on this page</span>
      </div>

      <div className="ov-kpi">
        <span className="ov-kpi-label">
          <Bell size={13} style={{ color: 'var(--gnb-400)' }} /> Subscription
        </span>
        <span className="ov-kpi-value">{formatNum(summary.subscription)}</span>
        <span className="ov-kpi-sub">plan issues on this page</span>
      </div>

      <div className="ov-kpi">
        <span className="ov-kpi-label">
          <Truck size={13} style={{ color: 'var(--gnb-400)' }} /> Vehicles
        </span>
        <span className="ov-kpi-value">{formatNum(summary.vehicles)}</span>
        <span className="ov-kpi-sub">affected on this page</span>
      </div>
    </div>
  );
}
