import { KpiTile } from '../../../components/overview.primitives';
import { Skeleton } from '@/components/ui/skeleton';
import '../KhataLedger.css';

/** One card treatment for the dashboard, tabs, and individual ledgers. */
export default function KhataKpiGrid({ items, loading = false, columns = 4 }) {
  return (
    <div className="khata-kpis" style={{ '--khata-kpi-columns': columns }} aria-busy={loading}>
      {items.map(({ label, icon: Icon, value, sub, status, tone }) => (
        <KpiTile
          key={label}
          label={label}
          icon={Icon ? <Icon size={14} aria-hidden="true" /> : null}
          value={loading ? <Skeleton className="h-7 w-24" /> : value}
          sub={sub}
          trend={
            !loading && status ? (
              <span className={`khata-kpi-status khata-kpi-status--${tone || 'neutral'}`}>
                {status}
              </span>
            ) : null
          }
        />
      ))}
    </div>
  );
}
