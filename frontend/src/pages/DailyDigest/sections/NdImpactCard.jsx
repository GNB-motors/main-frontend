import {
  Wrench,
  Route as RouteIcon,
  Fuel as FuelIcon,
  Clock,
  FileWarning,
  FileText,
  TrendingDown,
  Info,
  Gauge,
  Zap,
  Droplet,
  Droplets,
  MapPinOff,
} from 'lucide-react';
import { formatINR } from '../../../utils/formatters';
import NdImpactItems from './NdImpactItems.jsx';

export default function NdImpactCard({ money, atRisk, utilization, downtime }) {
  const lost = [
    {
      key: 'idling',
      label: 'Idling cost',
      v: money?.idlingWasteInr || 0,
      c: '#C56200',
      tint: 'rgba(197, 98, 0, 0.12)',
      icon: Clock,
    },
    {
      key: 'detour',
      label: 'Detour cost',
      v: money?.detourWasteInr || 0,
      c: '#2F58EE',
      tint: 'rgba(47, 88, 238, 0.12)',
      icon: RouteIcon,
    },
    {
      key: 'siphon',
      label: 'Fuel siphon loss',
      v: money?.theftLossInr || 0,
      c: '#C2323A',
      tint: 'rgba(194, 50, 58, 0.12)',
      icon: FuelIcon,
    },
    {
      key: 'mismatch',
      label: 'Bill mismatch',
      v: money?.billFraudSuspectInr || 0,
      c: '#6A43D8',
      tint: 'rgba(106, 67, 216, 0.12)',
      icon: FileWarning,
    },
    {
      key: 'empty',
      label: 'Empty-running waste',
      v: utilization?.fleet?.emptyKmWasteInr || 0,
      c: '#0D9488',
      tint: 'rgba(13, 148, 136, 0.12)',
      icon: Gauge,
    },
    {
      key: 'speed',
      label: 'Off-optimal speed',
      v: money?.speedingLossInr || 0,
      c: '#B45309',
      tint: 'rgba(180, 83, 9, 0.12)',
      icon: Zap,
    },
    {
      key: 'mileage',
      label: 'Low-mileage loss',
      v: money?.lowMileageLossInr || 0,
      c: '#9333EA',
      tint: 'rgba(147, 51, 234, 0.12)',
      icon: Droplet,
    },
  ];
  // Open exposure, not money lost today — shown apart and never added to the
  // headline, so the red total keeps meaning "lost today".
  const risk = [
    {
      key: 'downtime',
      label: 'Service downtime',
      v: downtime?.totalExposureInr || 0,
      c: '#C56200',
      tint: 'rgba(197, 98, 0, 0.12)',
      icon: Wrench,
    },
    {
      key: 'fines',
      label: atRisk?.expiredDocCount
        ? `Document fines (${atRisk.expiredDocCount} expired)`
        : 'Document fines',
      v: atRisk?.complianceFineInr || 0,
      c: '#C2323A',
      tint: 'rgba(194, 50, 58, 0.12)',
      icon: FileText,
    },
    {
      key: 'adblue',
      label: 'AdBlue unreconciled',
      v: atRisk?.adblueUnreconciledInr || 0,
      c: '#0D9488',
      tint: 'rgba(13, 148, 136, 0.12)',
      icon: Droplets,
    },
    {
      key: 'offpump',
      label: 'Off-pump refuels',
      v: atRisk?.offPumpRefuelInr || 0,
      c: '#2F58EE',
      tint: 'rgba(47, 88, 238, 0.12)',
      icon: MapPinOff,
    },
  ];
  const total = lost.reduce((s, r) => s + r.v, 0);
  const riskTotal = risk.reduce((s, r) => s + r.v, 0);
  const activeCount = lost.filter((r) => r.v > 0).length;

  return (
    <div className="nd-card nd-card--impact" id="nd-impact">
      <div className="nd-card-head">
        <h2>Today&apos;s ₹ impact</h2>
        <span className="nd-sp" />
        <span className="nd-hint">Estimated</span>
      </div>

      <div className="nd-impact-total">
        <div className="nd-impact-hero-top">
          <span className="nd-impact-tag">
            <TrendingDown size={13} />
            <span>Total loss today</span>
          </span>
          <span className="nd-impact-count-badge">
            {activeCount > 0 ? `${activeCount} active categories` : 'All nominal'}
          </span>
        </div>
        <div className="nd-v">{formatINR(total)}</div>
        <div className="nd-n">
          Across {lost.length} loss channels · plus {formatINR(riskTotal)} open exposure at risk
        </div>
      </div>

      <div className="nd-impact-list">
        <NdImpactItems rows={lost} total={total} />
        <div className="nd-eyebrow nd-bars-sub">
          At risk
          <span className="nd-a">{formatINR(riskTotal)}</span>
        </div>
        <NdImpactItems rows={risk} total={riskTotal} />
      </div>

      <div className="nd-impact-footer">
        <Info size={12} className="nd-impact-footer-ico" />
        <span>
          {money?.disclaimer ||
            'Calculated from live FleetEdge telemetry & configured fuel pricing.'}
        </span>
      </div>
    </div>
  );
}
