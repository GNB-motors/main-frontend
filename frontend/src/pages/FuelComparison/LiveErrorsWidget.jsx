import { CheckCircle2, ShieldAlert, WifiOff } from 'lucide-react';
import { formatRelativeIST } from './formatIST';

const LiveErrorsWidget = ({ status, isLoading, userErrors }) => {
  if (isLoading) return null;

  const reauthErrors = (userErrors || []).filter(
    (e) => e.errorCode === 'FLEETEDGE_REAUTH_REQUIRED',
  );
  const displayErrors = status?.recentErrors || [];

  return (
    <div className="fc-live-errors-widget">
      <div className="fc-live-errors-header">
        <div className="fc-live-errors-title">
          <ShieldAlert size={16} /> <span>Live Extension Errors</span>
        </div>
        {status?.failed > 0 && <span className="fc-error-badge">{status.failed}</span>}
      </div>
      <div className="fc-live-errors-list">
        {reauthErrors.map((err, i) => (
          <div key={`reauth-${i}`} className="fc-error-item fc-error-reauth">
            <WifiOff size={12} />
            <span className="fc-error-msg">
              Re-auth needed: <strong>{err.externalFleetId || 'FleetEdge account'}</strong> —
              reconnect via the extension
            </span>
          </div>
        ))}
        {displayErrors.length === 0 && reauthErrors.length === 0 ? (
          <div className="fc-no-errors">
            <CheckCircle2 size={16} /> No recent sync errors detected.
          </div>
        ) : (
          displayErrors.map((err, i) => (
            <div key={i} className="fc-error-item">
              <span className="fc-error-time">{formatRelativeIST(err.timestamp)}</span>
              <span className="fc-error-msg">{err.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveErrorsWidget;
