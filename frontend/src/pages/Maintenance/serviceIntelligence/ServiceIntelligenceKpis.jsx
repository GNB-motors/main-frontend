import { Wrench, AlertTriangle, AlertOctagon, Droplets, CalendarCheck } from 'lucide-react';
import KpiCard from '../../../components/ui/KpiCard';
import { formatCurrencyINR } from '../serviceIntelligenceLogic';

const ServiceIntelligenceKpis = ({ isService, summary, filterCounts, loading }) => (
  <div className="si-kpis-strip" style={{ margin: '0 0 12px 0' }}>
    <KpiCard
      title={`Total ${isService ? 'Services' : 'Repairs'}`}
      value={loading && !summary.total ? <span className="si-skel-kpi-val" /> : summary.total}
      accent={isService ? '#2563eb' : '#dc2626'}
      icon={isService ? <Wrench size={18} /> : <AlertOctagon size={18} />}
    />
    {isService ? (
      <>
        <KpiCard
          title="Last 30 days"
          value={loading && summary.last30 == null ? <span className="si-skel-kpi-val" /> : summary.last30}
          accent="#2563eb"
          icon={<CalendarCheck size={18} />}
        />
        <KpiCard
          title="Total Spend"
          value={
            loading && !summary.totalAmount ? (
              <span className="si-skel-kpi-val" />
            ) : (
              `₹${(summary.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
            )
          }
          accent="#16a34a"
          icon={<Wrench size={18} />}
        />
        <KpiCard
          title="Average Cost"
          value={
            loading && !summary.total ? (
              <span className="si-skel-kpi-val" />
            ) : (
              formatCurrencyINR(summary.total > 0 ? summary.totalAmount / summary.total : null)
            )
          }
          accent="#0284c7"
          icon={<Droplets size={18} />}
        />
      </>
    ) : (
      <>
        <KpiCard
          title="Critical (P0 Grounded)"
          value={loading && filterCounts.p0 == null ? <span className="si-skel-kpi-val" /> : (filterCounts.p0 ?? 0)}
          accent="#dc2626"
          icon={<AlertOctagon size={18} />}
        />
        <KpiCard
          title="Open Issues"
          value={loading && filterCounts.open == null ? <span className="si-skel-kpi-val" /> : (filterCounts.open ?? 0)}
          accent="#e11d48"
          icon={<AlertTriangle size={18} />}
        />
        <KpiCard
          title="Total Spend"
          value={
            loading && !summary.totalAmount ? (
              <span className="si-skel-kpi-val" />
            ) : (
              `₹${(summary.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
            )
          }
          accent="#16a34a"
          icon={<Wrench size={18} />}
        />
      </>
    )}
  </div>
);

export default ServiceIntelligenceKpis;
