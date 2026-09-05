import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, WifiOff, ArrowRight } from 'lucide-react';
import { ReportsService } from '../../pages/Reports/ReportsService.jsx';

/**
 * FleetEdgeStatusChip — telemetry connection health, wherever staleness shows.
 *
 * FleetEdge holds the tokens every live position depends on. When an account
 * needs re-authenticating the map quietly stops updating, and until now the
 * only places that said so were the Owner Alerts feed and a widget on the
 * extension-sync page — both phrased as "reconnect via the extension", neither
 * linking anywhere. /settings/fleetedge-accounts, the page that repairs it, had
 * zero inbound links in the entire codebase.
 *
 * So this chip goes where the symptom is visible: the live map, and the
 * FleetEdge settings page itself. It always offers the fix.
 *
 * It renders NOTHING while healthy on `compact` surfaces — a permanent green
 * badge saying "fine" is noise on a console you stare at all day. Degraded
 * state is never silent.
 *
 * Service note: `api/extension/*` is wrapped by ReportsService for historical
 * reasons (the extension sync surfaced under Reports first). The endpoints are
 * about FleetEdge, not reports; importing it here avoids duplicating the URLs.
 */
const FleetEdgeStatusChip = ({ compact = true, className = '' }) => {
  const [connectivity, setConnectivity] = useState(null);
  const [reauthCount, setReauthCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [conn, errors] = await Promise.all([
          ReportsService.getFleetEdgeConnectivity().catch(() => null),
          ReportsService.getUserErrors().catch(() => []),
        ]);
        if (cancelled) return;
        setConnectivity(conn);
        setReauthCount(
          (errors || []).filter((e) => e.errorCode === 'FLEETEDGE_REAUTH_REQUIRED').length,
        );
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return null;

  const accounts = connectivity?.accounts || [];
  const connected = accounts.filter((a) => a.status === 'ACTIVE').length;
  // Either signal counts as degraded: the account list can lag the error feed.
  const needsReauth = Math.max(accounts.filter((a) => a.status === 'NEEDS_REAUTH').length, reauthCount);
  const degraded = needsReauth > 0;

  // Nothing known at all (no accounts, no errors) — say nothing rather than
  // claiming a healthy connection that may simply not be configured yet.
  if (!degraded && accounts.length === 0) return null;
  if (!degraded && compact) return null;

  const tone = degraded ? 'var(--critical)' : 'var(--ok)';

  return (
    <span
      className={`fleet-edge-chip ${className}`.trim()}
      style={{ borderColor: tone, color: tone }}
      data-degraded={degraded ? 'true' : undefined}
    >
      {degraded ? <WifiOff size={13} /> : <Wifi size={13} />}
      <span>
        {degraded
          ? `FleetEdge — ${needsReauth} account${needsReauth === 1 ? '' : 's'} need${needsReauth === 1 ? 's' : ''} reconnecting`
          : `FleetEdge — ${connected} connected`}
      </span>
      {degraded && (
        <Link to="/settings/fleetedge-accounts" className="fleet-edge-chip__fix">
          Reconnect <ArrowRight size={12} />
        </Link>
      )}
    </span>
  );
};

export default FleetEdgeStatusChip;
