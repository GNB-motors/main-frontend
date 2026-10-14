import SlimAnomalyAlert from './intervalDetail/SlimAnomalyAlert';
import CompactKpiCard from './intervalDetail/CompactKpiCard';

/**
 * Presentational components for Mileage Interval Detail page (Layer 3).
 * Redesigned for high information density, clean hierarchy, and executive data presentation.
 */

/* ── Backwards compatibility wrappers ── */
export const AnomalyAlertBanner = ({ flags }) => <SlimAnomalyAlert flags={flags} />;

export const HeroComparisonCard = (props) => <CompactKpiCard {...props} />;

export const BentoCard = (props) => {
  const { title, children } = props;
  return (
    <div className="mt-recon-card" style={{ padding: 12 }}>
      <h4>{title}</h4>
      {children}
    </div>
  );
};

export const BentoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
    <span>{label}</span>
    <span>{value ?? '—'}</span>
  </div>
);

export const TimelineNode = ({ log, label }) => (
  <div style={{ padding: 6, fontSize: 12 }}>
    <span>{label}: </span>
    <span>{log?.litres} L</span>
  </div>
);

export const SectionCard = ({ title, children }) => (
  <div className="mt-recon-card" style={{ padding: 12 }}>
    <h4>{title}</h4>
    {children}
  </div>
);

export const MetricRow = ({ label, value }) => <BentoRow label={label} value={value} />;

export const VarianceBlock = (props) => <CompactKpiCard {...props} />;

export const TimelineEntry = (props) => <TimelineNode {...props} />;
