import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Building2, LayoutGrid, RefreshCw, Search, Users, PanelLeft } from 'lucide-react';
import PageShell from '../../../../components/ui/PageShell.jsx';
import { Button } from '../../../../components/ui/button.jsx';
import {
  getOrgUsageSummary,
  listOrganizations,
} from '../../../../services/UsageAnalyticsService.js';
import { formatCount as number, visibleUsageRows } from './usageModel.js';
import UsageTrendPanel from './UsageTrendPanel.jsx';
import './UsageAnalytics.css';

const STATUS_COPY = {
  AT_OR_ABOVE_FLOOR: 'Frequently opened',
  BELOW_ORG_FLOOR: 'Less used',
  NEVER_OPENED: 'Not opened',
  NOT_MEASURED: 'Collecting history',
};

/**
 * App Usage — the superadmin view of which screens an organization opens.
 *
 * The page used to live in the client interface; product moved it here so
 * platform admins see usage across orgs while clients keep recording it (the
 * dashboard still POSTs every navigation to /api/usage/view). One org at a
 * time, picked from the platform's organization list; the chosen org is kept
 * in ?org= so a link reopens the same view.
 *
 * Unlike the old client page there is no org menu catalog here: the summary
 * lists the screens the org has actually opened, with no "never opened"
 * verdicts (those need the org's own nav list).
 */
export default function UsageAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orgId = searchParams.get('org') || '';
  const [orgs, setOrgs] = React.useState(null);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [revision, setRevision] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [disposition, setDisposition] = React.useState('');
  const [sort, setSort] = React.useState('views');

  React.useEffect(() => {
    const controller = new AbortController();
    listOrganizations({ signal: controller.signal })
      .then(setOrgs)
      .catch(() => {
        if (!controller.signal.aborted) setOrgs([]);
      });
    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    if (!orgId) {
      setData(null);
      setError(null);
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getOrgUsageSummary(orgId, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err?.userMessage || err?.message || 'Could not load app usage.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [orgId, revision]);

  const org = (orgs || []).find((o) => String(o._id) === orgId) || null;
  const rows = visibleUsageRows(data?.surfaces || [], new Map(), { query, disposition, sort });
  const lessUsed = (data?.surfaces || []).filter(
    (s) => s.disposition === 'BELOW_ORG_FLOOR' || s.disposition === 'NEVER_OPENED',
  ).length;
  const activeScreens = (data?.surfaces || []).filter((row) => row.evidence?.views > 0).length;
  const refresh = () => setRevision((value) => value + 1);

  return (
    <PageShell
      title="App Usage"
      subtitle="See which screens an organization opens — page opens, active screens, and the nightly rollup."
      freshnessAt={data?.computedAt}
      className="usage-page"
      actions={
        <Button size="sm" variant="secondary" onClick={refresh} disabled={loading || !orgId}>
          <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      }
    >
      <div className="usage-org-bar">
        <label className="usage-org-picker">
          <Building2 size={15} aria-hidden="true" />
          <span className="sr-only">Organization</span>
          <select
            aria-label="Organization"
            value={orgId}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              if (event.target.value) next.set('org', event.target.value);
              else next.delete('org');
              setSearchParams(next, { replace: true });
              setQuery('');
              setDisposition('');
            }}
          >
            <option value="">Choose an organization…</option>
            {(orgs || []).map((o) => (
              <option key={o._id} value={o._id}>
                {o.name || o.ownerEmail || o._id}
              </option>
            ))}
          </select>
        </label>
        {orgId && (
          <p className="usage-scope">
            {org ? `${org.name || org.ownerEmail || orgId} · ` : ''}Updated nightly
            {data?.window?.to ? ` · Data through ${data.window.to}` : ''}. Today’s activity appears
            after the next rollup.
          </p>
        )}
      </div>

      {error && (
        <div className="usage-error" role="alert">
          {error}
          <Button size="sm" variant="ghost" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}

      {!orgId ? (
        <div className="usage-empty usage-empty--picker">
          <Building2 size={26} aria-hidden="true" />
          <h3>No organization selected</h3>
          <p>Pick an organization above to see which of its screens get opened.</p>
        </div>
      ) : (
        <>
          {!data && loading && (
            <div role="status" className="usage-loading">
              Loading app usage…
            </div>
          )}
          {data && (
            <>
              <div className="usage-stats">
                {[
                  { label: 'Page opens', value: data.learned?.totalViews, Icon: Activity },
                  { label: 'Active screens', value: activeScreens, Icon: LayoutGrid },
                  { label: 'User-days', value: data.learned?.userDays, Icon: Users },
                  { label: 'Less-used screens', value: lessUsed, Icon: PanelLeft },
                ].map(({ label, value, Icon }) => (
                  <div className="usage-stat" key={label}>
                    <span className="usage-stat-icon">
                      {React.createElement(Icon, { size: 19, 'aria-hidden': true })}
                    </span>
                    <div>
                      <span>{label}</span>
                      <strong>{number(value)}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="usage-explanation">
                <strong>
                  {data.state === 'LEARNED' ? 'Compared with its own usage' : 'Collecting history'}
                </strong>
                <p>
                  {data.state === 'LEARNED'
                    ? `${number(lessUsed)} screens are opened less than this organization’s median of ${number(data.learned?.engagementFloor)} opens, or not at all.`
                    : 'Less-used screens are flagged once there is enough history across multiple screens and completed days to compare usage.'}
                </p>
                <small>
                  A user-day counts one person once per day across all screens. Navigation
                  transitions count moves between screens; they do not indicate completed work.
                </small>
              </div>
              <UsageTrendPanel daily={data.daily} windowTo={data.window?.to} />
              <section
                className="usage-panel"
                aria-labelledby="usage-screens-title"
                aria-busy={loading}
              >
                <header className="usage-panel-head">
                  <div>
                    <h2 id="usage-screens-title">Screen activity</h2>
                    <p>
                      {data.window?.from && data.window?.to
                        ? `${data.window.from} – ${data.window.to} · All recorded history`
                        : 'All recorded history'}
                    </p>
                  </div>
                  <span className="usage-count">{rows.length} screens</span>
                </header>
                <div className="usage-toolbar">
                  <label className="usage-search">
                    <Search size={16} aria-hidden="true" />
                    <input
                      aria-label="Search screens"
                      placeholder="Search screens"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Usage category"
                    value={disposition}
                    onChange={(event) => setDisposition(event.target.value)}
                  >
                    <option value="">All usage categories</option>
                    {Object.entries(STATUS_COPY).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Sort screens"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="views">Most opened</option>
                    <option value="recent">Recently opened</option>
                    <option value="name">Screen name</option>
                  </select>
                </div>
                {rows.length ? (
                  <div className="usage-table-scroll">
                    <table>
                      <caption className="sr-only">
                        Usage by screen over all recorded history
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Screen</th>
                          <th scope="col">Page opens</th>
                          <th scope="col">Active days</th>
                          <th scope="col">Transitions</th>
                          <th scope="col">Usage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.surfaceKey}>
                            <th scope="row">
                              {row.label}
                              <small>{row.surfaceKey}</small>
                              <details className="usage-row-detail">
                                <summary>View breakdown</summary>
                                <p>
                                  {row.evidence.lastViewedAt
                                    ? `Last opened ${new Date(row.evidence.lastViewedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`
                                    : 'No recorded opens'}
                                </p>
                                {Object.entries(row.evidence.viewsByRole || {}).map(
                                  ([role, count]) => (
                                    <p key={role}>
                                      {role.replaceAll('_', ' ')}: {number(count)} opens
                                    </p>
                                  ),
                                )}
                              </details>
                            </th>
                            <td>{number(row.evidence.views)}</td>
                            <td>{number(row.evidence.activeDays)}</td>
                            <td>{number(row.evidence.followOn)}</td>
                            <td>
                              <span className={`usage-badge usage-badge--${row.disposition}`}>
                                {STATUS_COPY[row.disposition] || 'Collecting history'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="usage-empty">
                    <LayoutGrid size={26} aria-hidden="true" />
                    <h3>
                      {query || disposition ? 'No matching screens' : 'No screen history yet'}
                    </h3>
                    <p>
                      {query || disposition
                        ? 'Try another search or clear the filters.'
                        : 'As the team opens screens, their activity appears after the nightly rollup.'}
                    </p>
                    {(query || disposition) && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setQuery('');
                          setDisposition('');
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
                <footer className="usage-footer">
                  Counts are aggregated across the organization. No individual activity profiles are
                  shown.
                </footer>
              </section>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
