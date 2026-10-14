import { AlertTriangle, CheckCircle2, Clock, Minus } from 'lucide-react';

const AlertCell = ({ interval }) => {
  const fe = interval.fleetEdge || {};
  const isFlagged = fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage;
  const reasons = fe.flagReasons || [];

  if (interval.status === 'ONGOING' || fe.status === 'PENDING') {
    return (
      <span className="mt-status-badge mt-status-badge--warning">
        <Clock size={11} /> Pending GPS
      </span>
    );
  }
  if (fe.status === 'FAILED' || fe.status === 'NO_DATA') {
    return (
      <span className="mt-status-badge mt-status-badge--neutral">
        <Minus size={11} /> No GPS
      </span>
    );
  }
  if (isFlagged && reasons.length > 0) {
    return (
      <span className="mt-status-badge mt-status-badge--danger" title={reasons.join('\n')}>
        <AlertTriangle size={11} /> {reasons.length > 1 ? `${reasons.length} flags` : 'Flagged'}
      </span>
    );
  }
  if (fe.status === 'COMPUTED') {
    return (
      <span className="mt-status-badge mt-status-badge--success">
        <CheckCircle2 size={11} /> Validated
      </span>
    );
  }
  return <span className="mt-status-badge mt-status-badge--neutral">—</span>;
};

export default AlertCell;
