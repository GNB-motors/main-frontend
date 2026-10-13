import { AlertTriangle, CheckCircle2, Clock, Truck } from 'lucide-react';
import { StatCard } from './vehicleDashboardCells';

export default function VehicleDashboardKpis({ kpis }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '14px 0 20px 0' }}>
      <StatCard
        title="Total Vehicles"
        value={kpis.total}
        subtext={`${kpis.totalDocSlots} document slots`}
        accent="#3b82f6"
        icon={<Truck size={20} />}
      />
      <StatCard
        title="Expired / Critical"
        value={kpis.expired + kpis.critical}
        subtext={`${kpis.expired} expired · ${kpis.critical} < 15d`}
        accent="#dc2626"
        icon={<AlertTriangle size={20} />}
      />
      <StatCard
        title="Expiring 15-30 days"
        value={kpis.warning}
        subtext="Plan renewals soon"
        accent="#f59e0b"
        icon={<Clock size={20} />}
      />
      <StatCard
        title="Healthy"
        value={kpis.healthy}
        subtext={`${kpis.missing} not uploaded yet`}
        accent="#16a34a"
        icon={<CheckCircle2 size={20} />}
      />
    </div>
  );
}
