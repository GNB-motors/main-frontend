import { Link } from 'react-router-dom';
import { ArrowRight, Radio } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { listAccounts } from '../Profile/FleetEdgeAccountService';
import { getToken } from '../../utils/session.js';
import { formatNum, formatPct } from '../../utils/formatters';
import { Card, SectionHead, Skeleton } from './settingsAtoms';

const STATUS = {
  ACTIVE: { label: 'Active', tone: 'ok' },
  DISABLED: { label: 'Disabled', tone: 'muted' },
  AUTH_FAILED: { label: 'Login failed', tone: 'bad' },
};

const plural = (n, one, many) => (n === 1 ? one : many);

const NO_FEED_HINT =
  'Connect FleetEdge from the GNB Edge Chrome extension and its vehicles appear here.';

function FleetEdgeAccounts() {
  const { data, loading, error } = useApi(() => listAccounts(getToken()), []);
  const accounts = data || [];

  return (
    <Card
      title="FleetEdge accounts"
      aside={
        <Link to="/settings/fleetedge-accounts" className="stx-link">
          Manage accounts
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      }
      flush
    >
      {loading && !data ? (
        <Skeleton rows={2} />
      ) : error && !data ? (
        <p className="stx-inline-error">Could not load FleetEdge accounts.</p>
      ) : accounts.length === 0 ? (
        <div className="stx-empty">
          <Radio size={20} aria-hidden="true" />
          <p className="stx-empty-title">No FleetEdge account connected</p>
          <p className="stx-empty-hint">{NO_FEED_HINT}</p>
        </div>
      ) : (
        <ul className="stx-rows">
          {accounts.map((a) => {
            const st = STATUS[a.status] || STATUS.DISABLED;
            return (
              <li key={a._id} className="stx-row">
                <span className="stx-row-icon" aria-hidden="true">
                  <Radio size={16} />
                </span>
                <div className="stx-row-main">
                  <div className="stx-row-title">
                    <span className="stx-row-name">{a.friendlyName || a.externalAccountId}</span>
                  </div>
                  <p className="stx-row-sub">
                    {formatNum(a.vehicleCount ?? 0)} {plural(a.vehicleCount, 'vehicle', 'vehicles')}
                    {a.friendlyName && !a.friendlyName.includes(a.externalAccountId) ? (
                      <span className="stx-mono"> · {a.externalAccountId}</span>
                    ) : null}
                  </p>
                </div>
                <span className={`stx-status stx-status--${st.tone}`}>{st.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="stx-stat">
      <span className="stx-stat-label">{label}</span>
      <span className={`stx-stat-value${tone ? ` stx-stat-value--${tone}` : ''}`}>{value}</span>
    </div>
  );
}

/** `coverage` is the page's GET /api/fleet-coverage, shared with the nav badge. */
function Coverage({ coverage }) {
  const { data, loading, error } = coverage;
  const summary = data?.summary || {};
  const onlyEdge = summary.onlyFleetEdge ?? (data?.onlyInFleetEdge || []).length;
  const onlyMaster = summary.onlyFleetMaster ?? (data?.onlyInFleetMaster || []).length;
  const linked = summary.linked ?? (data?.linked || []).length;
  const pct = summary.inFleetEdge > 0 ? (100 * linked) / summary.inFleetEdge : null;
  const noDirectory = data && summary.inFleetEdge === 0;

  let verdict = null;
  if (onlyEdge > 0) {
    const them = plural(onlyEdge, 'it', 'them');
    verdict = (
      <p className="stx-callout stx-callout--warn">
        <strong>
          {formatNum(onlyEdge)}{' '}
          {plural(onlyEdge, "truck on FleetEdge isn't", "trucks on FleetEdge aren't")} in your
          fleet.
        </strong>{' '}
        Mileage, trips and alerts can&apos;t see {them} until you add {them}.
      </p>
    );
  } else if (onlyMaster > 0) {
    verdict = (
      <p className="stx-callout">
        Every FleetEdge truck is in your fleet. {formatNum(onlyMaster)}{' '}
        {plural(onlyMaster, "fleet vehicle isn't", "fleet vehicles aren't")} reporting through
        FleetEdge.
      </p>
    );
  } else if (data && !noDirectory) {
    verdict = <p className="stx-callout stx-callout--ok">Every vehicle is linked and reporting.</p>;
  }

  return (
    <Card
      title="Fleet data coverage"
      aside={
        <Link to="/fleet-coverage" className="stx-link">
          {onlyEdge > 0 ? 'Review and add vehicles' : 'See both lists'}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      }
    >
      <p className="stx-card-lead">
        The vehicles your FleetEdge account reports, matched against the vehicles in your fleet.
      </p>
      {loading && !data ? (
        <Skeleton rows={2} />
      ) : error && !data ? (
        <p className="stx-inline-error">Coverage data is unavailable right now.</p>
      ) : noDirectory ? (
        <p className="stx-callout">{NO_FEED_HINT}</p>
      ) : (
        <>
          <div className="stx-stats">
            <Stat label="Linked" value={formatNum(linked)} tone="ok" />
            <Stat
              label="Only on FleetEdge"
              value={formatNum(onlyEdge)}
              tone={onlyEdge ? 'warn' : null}
            />
            <Stat label="Only in your fleet" value={formatNum(onlyMaster)} />
            <Stat label="Coverage" value={pct == null ? '—' : formatPct(pct)} />
          </div>
          {verdict}
        </>
      )}
    </Card>
  );
}

export function FleetDataSettings({ showAccounts, coverage }) {
  return (
    <>
      <SectionHead
        id="stx-sec-fleet-data"
        title="Fleet data"
        desc="Where your trucks' GPS and engine data comes from, and which trucks it covers."
      />
      {showAccounts ? <FleetEdgeAccounts /> : null}
      {coverage ? <Coverage coverage={coverage} /> : null}
    </>
  );
}
