import { Wrench, AlertTriangle, AlertOctagon, Droplets, CalendarCheck } from 'lucide-react';
import KpiCard from '../../../components/ui/KpiCard';
import { formatCurrencyINR } from '../serviceIntelligenceLogic';

const ServiceIntelligenceKpis = ({ isService, summary, filterCounts }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '16px 0 16px' }}>
    <KpiCard
      title={`Total ${isService ? 'Services' : 'Repairs'}`}
      value={summary.total}
      accent={isService ? '#2563eb' : '#dc2626'}
      icon={isService ? <Wrench size={18} /> : <AlertOctagon size={18} />}
    />
    {isService ? (
      <>
        <KpiCard
          title="Last 30 days"
          value={summary.last30}
          accent="#2563eb"
          icon={<CalendarCheck size={18} />}
        />
        <KpiCard
          title="Total Spend"
          value={`₹${summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          accent="#16a34a"
          icon={<Wrench size={18} />}
        />
        <KpiCard
          title="Average Service Cost"
          value={formatCurrencyINR(summary.total > 0 ? summary.totalAmount / summary.total : null)}
          accent="#0284c7"
          icon={<Droplets size={18} />}
        />
      </>
    ) : (
      <>
        <KpiCard
          title="Critical (P0 Grounded)"
          value={filterCounts.p0 ?? 0}
          accent="#dc2626"
          icon={<AlertOctagon size={18} />}
        />
        <KpiCard
          title="Open Issues"
          value={filterCounts.open ?? 0}
          accent="#e11d48"
          icon={<AlertTriangle size={18} />}
        />
        <KpiCard
          title="Total Spend"
          value={`₹${summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          accent="#16a34a"
          icon={<Wrench size={18} />}
        />
      </>
    )}
  </div>
);

export default ServiceIntelligenceKpis;
