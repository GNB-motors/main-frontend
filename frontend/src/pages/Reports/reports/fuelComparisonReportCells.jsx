import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const VarianceBadge = ({ variance, variancePercent }) => {
  if (variance == null) return <span className="text-dim">—</span>;
  const isOver = variance > 0;
  return (
    <div className={`fuel-variance-cell ${isOver ? 'fuel-variance-over' : 'fuel-variance-ok'}`}>
      <span className="fuel-variance-abs">
        {isOver ? '+' : ''}
        {variance.toFixed(2)} L
      </span>
      {variancePercent != null && (
        <span className="fuel-variance-pct">
          ({isOver ? '+' : ''}
          {variancePercent.toFixed(1)}%)
        </span>
      )}
    </div>
  );
};

export const FlagBadge = ({ isFlagged }) =>
  isFlagged ? (
    <span className="fuel-status-badge fuel-badge-flagged">
      <AlertTriangle size={12} /> Flagged
    </span>
  ) : (
    <span className="fuel-status-badge fuel-badge-ok">
      <CheckCircle2 size={12} /> OK
    </span>
  );

export const DriverCell = ({ driver }) => {
  if (!driver) return <span className="text-dim">—</span>;
  const name = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || '—';
  return (
    <div>
      <div className="cell-primary">{name}</div>
      {driver.mobileNumber && <div className="cell-secondary">{driver.mobileNumber}</div>}
    </div>
  );
};
