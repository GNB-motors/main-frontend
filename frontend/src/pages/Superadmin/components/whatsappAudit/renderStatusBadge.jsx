import { CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';

// Render request status badge
const renderStatusBadge = (req) => {
  if (req.status === 'PROCESSED' && !req.isFailed) {
    return (
      <span className="wa-badge wa-badge--success">
        <CheckCircle2 size={12} /> Succeeded
      </span>
    );
  }
  if (req.isFailed || req.status === 'FAILED') {
    return (
      <span className="wa-badge wa-badge--fail">
        <XCircle size={12} /> Failed
      </span>
    );
  }
  if (req.status === 'CLAIMED') {
    return (
      <span className="wa-badge wa-badge--processing">
        <RefreshCw size={12} className="wa-spin" /> In-Flight
      </span>
    );
  }
  return (
    <span className="wa-badge wa-badge--queued">
      <Clock size={12} /> Queued
    </span>
  );
};

export default renderStatusBadge;
