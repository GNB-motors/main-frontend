import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { formatClockIST } from './formatIST';

const FleetEdgeConnectivityBar = ({ connectivity, status }) => {
  if (!connectivity) return null;

  const accounts = connectivity.accounts || [];
  const pull = connectivity.pull || {};
  const connected = accounts.filter((a) => a.status === 'ACTIVE').length;
  const needsReauth = accounts.filter((a) => a.status === 'NEEDS_REAUTH').length;
  const pullingNow = status?.pullingNow > 0 || pull.running;

  return (
    <div className={`fc-connectivity-bar ${needsReauth > 0 ? 'fc-conn-degraded' : ''}`}>
      <div className="fc-conn-left">
        {needsReauth > 0 ? <WifiOff size={14} /> : <Wifi size={14} />}
        <span className="fc-conn-label">FleetEdge</span>
        <span className="fc-conn-chip fc-conn-ok">{connected} connected</span>
        {needsReauth > 0 && (
          <span className="fc-conn-chip fc-conn-warn">{needsReauth} need re-auth</span>
        )}
      </div>
      <div className="fc-conn-right">
        {pullingNow && (
          <span className="fc-conn-chip fc-conn-pulling">
            <Loader2 size={11} className="fc-spin" /> pulling now
          </span>
        )}
        {pull.lastRunAt && (
          <span className="fc-conn-meta">last pull {formatClockIST(pull.lastRunAt)}</span>
        )}
        {pull.nextRunAt && (
          <span className="fc-conn-meta">next ~{formatClockIST(pull.nextRunAt)}</span>
        )}
      </div>
    </div>
  );
};

export default FleetEdgeConnectivityBar;
