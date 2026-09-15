import { getPerformanceColor } from './modelComparisonLogic';

/**
 * Chart tooltips and the KPI card for the Model Comparison page. Kept
 * separate from modelComparisonColumns.jsx because that module exports a
 * plain function; react-refresh requires a file to export components OR
 * non-components, never both (rule 15).
 */

export const ModelTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="mc-glass-tooltip">
      <p className="mc-glass-tooltip-title">{d.model}</p>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Avg Mileage</span>
        <span className="mc-glass-tooltip-value">{d.avgMileage} km/L</span>
      </div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Range</span>
        <span className="mc-glass-tooltip-value">
          {d.minMileage} – {d.maxMileage} km/L
        </span>
      </div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Vehicles</span>
        <span className="mc-glass-tooltip-value">{d.vehicleCount}</span>
      </div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Records</span>
        <span className="mc-glass-tooltip-value">{d.recordCount}</span>
      </div>
    </div>
  );
};

export const VehicleTooltip = ({ active, payload, modelAvg }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const color = getPerformanceColor(d.status);
  return (
    <div className="mc-glass-tooltip">
      <p className="mc-glass-tooltip-title">{d.vehicleNumber}</p>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Vehicle Avg</span>
        <span className="mc-glass-tooltip-value">{d.avgMileage} km/L</span>
      </div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Model Avg</span>
        <span className="mc-glass-tooltip-value">{modelAvg} km/L</span>
      </div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Variance</span>
        <span
          className="mc-glass-tooltip-value"
          style={{ color, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {d.variancePct > 0 ? '+' : ''}
          {d.variancePct}%<span className="mc-indicator-dot" style={{ background: color }} />
        </span>
      </div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Status</span>
        <span className="mc-glass-tooltip-value" style={{ color }}>
          {d.status}
        </span>
      </div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Records</span>
        <span className="mc-glass-tooltip-value">{d.recordCount}</span>
      </div>
    </div>
  );
};

export const KpiCard = (props) => {
  const { icon: Icon, label, value, iconBg, iconColor } = props;
  return (
    <div className="mc-kpi-card">
      <div className="mc-kpi-icon" style={{ background: iconBg }}>
        <Icon size={18} color={iconColor} />
      </div>
      <div className="mc-kpi-body">
        <span className="mc-kpi-label">{label}</span>
        <span className="mc-kpi-value">{value}</span>
      </div>
    </div>
  );
};
