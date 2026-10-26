import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  LayoutGrid,
  RefreshCw,
  Search,
  Users,
  PanelLeft,
} from 'lucide-react';
import PageShell from '../../components/ui/PageShell.jsx';
import { Button } from '../../components/ui/button.jsx';
import { getUsageSummary } from '../../services/UsageAnalyticsService.js';
import { useUsageAnalytics } from '../../contexts/UsageAnalyticsContext';
import { applyUsageCut } from '../../utils/navCut';
import { calendarTrend, navLabels, visibleUsageRows } from './usageModel.js';
import './UsageAnalytics.css';

const STATUS_COPY = {
  AT_OR_ABOVE_FLOOR: 'Frequently opened',
  BELOW_ORG_FLOOR: 'Less used',
  NEVER_OPENED: 'Not opened',
  NOT_MEASURED: 'Collecting history',
};
const number = (value) => Number(value || 0).toLocaleString('en-IN');

export default function UsageAnalyticsPage() {
  const { catalog, surfaces, updateProfile } = useUsageAnalytics();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [revision, setRevision] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [disposition, setDisposition] = React.useState('');
  const [sort, setSort] = React.useState('views');
  const [period, setPeriod] = React.useState(14);
  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getUsageSummary({ surfaces, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        updateProfile(result);
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err?.userMessage || err?.message || 'Could not load app usage.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [surfaces, updateProfile, revision]);

  const labels = React.useMemo(() => navLabels(catalog), [catalog]);
  const rows = visibleUsageRows(data?.surfaces || [], labels, { query, disposition, sort });
  const cut = applyUsageCut(catalog, data);
  const moved = new Set(cut.folded.map((entry) => entry.to));
  const days = calendarTrend(data?.daily, data?.window?.to, period);
  const maxViews = Math.max(1, ...days.map((day) => day.views));
  const activeScreens = (data?.surfaces || []).filter((row) => row.evidence?.views > 0).length;
  const refresh = () => setRevision((value) => value + 1);

  return (
    <PageShell
      title="App Usage"
      subtitle="Understand which screens your team opens and how your menu is organized."
      freshnessAt={data?.computedAt}
      className="usage-page"
      actions={
        <Button size="sm" variant="secondary" onClick={refresh} disabled={loading}>
          <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      }
    >
      <p className="usage-scope">
        Organization-wide · Updated nightly at 2:13 AM IST
        {data?.window?.to ? ` · Data through ${data.window.to}` : ''}. Today’s activity appears
        after the next rollup.
      </p>
      {error && (
        <div className="usage-error" role="alert">
          {error}
          <Button size="sm" variant="ghost" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}
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
              { label: 'Links in More', value: cut.folded.length, Icon: PanelLeft },
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
              {data.state === 'LEARNED'
                ? 'Your menu reflects recorded usage'
                : 'Collecting history'}
            </strong>
            <p>
              {data.state === 'LEARNED'
                ? `${number(cut.folded.length)} eligible links are grouped under “More inside this job”. Less-used screens are compared with your organization’s median of ${number(data.learned?.engagementFloor)} opens. Every page remains available.`
                : 'Your menu stays intact until there is enough history across multiple screens and completed days to compare usage.'}
            </p>
            <small>
              A user-day counts one person once per day across all screens. Navigation transitions
              count moves between screens; they do not indicate completed work.
            </small>
          </div>
          <section className="usage-panel" aria-labelledby="usage-trend-title">
            <header className="usage-panel-head">
              <div>
                <h2 id="usage-trend-title">Daily page opens</h2>
                <p>
                  Last {period} calendar days ending {data.window?.to || 'at the next rollup'}
                </p>
              </div>
              <select
                aria-label="Chart period"
                value={period}
                onChange={(event) => setPeriod(Number(event.target.value))}
              >
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </header>
            {days.length ? (
              <>
                <div
                  className="usage-chart"
                  role="img"
                  aria-label={`Daily page opens for ${days[0].day} through ${days[days.length - 1].day}. Exact values are in the daily data table below.`}
                >
                  <div className="usage-axis">
                    <span>{number(maxViews)}</span>
                    <span>0</span>
                  </div>
                  <div className="usage-bars">
                    {days.map((day, index) => (
                      <div className="usage-day" key={day.day}>
                        <div className="usage-bar-space">
                          <span
                            className="usage-bar"
                            style={{ height: `${(day.views / maxViews) * 100}%` }}
                            title={`${day.day}: ${number(day.views)} opens`}
                          />
                        </div>
                        <span className="usage-tick">
                          {index === 0 ||
                          index === days.length - 1 ||
                          index % (period === 14 ? 3 : 7) === 0
                            ? day.day.slice(5)
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <details className="usage-daily-data">
                  <summary>View daily data</summary>
                  <div className="usage-table-scroll">
                    <table>
                      <caption className="sr-only">Daily usage counts</caption>
                      <thead>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col">Page opens</th>
                          <th scope="col">Navigation transitions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {days.map((day) => (
                          <tr key={day.day}>
                            <th scope="row">{day.day}</th>
                            <td>{number(day.views)}</td>
                            <td>{number(day.followOn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <p className="usage-empty">
                Daily activity appears after your first completed rollup.
              </p>
            )}
          </section>
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
                  <caption className="sr-only">Usage by screen over all recorded history</caption>
                  <thead>
                    <tr>
                      <th scope="col">Screen</th>
                      <th scope="col">Page opens</th>
                      <th scope="col">Active days</th>
                      <th scope="col">Transitions</th>
                      <th scope="col">Usage</th>
                      <th scope="col">Menu location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.surfaceKey}>
                        <th scope="row">
                          {row.canOpen ? (
                            <Link to={row.surfaceKey}>
                              {row.label}
                              <ArrowUpRight size={13} aria-hidden="true" />
                            </Link>
                          ) : (
                            row.label
                          )}
                          <small>{row.surfaceKey}</small>
                          <details className="usage-row-detail">
                            <summary>View breakdown</summary>
                            <p>
                              {row.evidence.lastViewedAt
                                ? `Last opened ${new Date(row.evidence.lastViewedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`
                                : 'No recorded opens'}
                            </p>
                            {Object.entries(row.evidence.viewsByRole || {}).map(([role, count]) => (
                              <p key={role}>
                                {role.replaceAll('_', ' ')}: {number(count)} opens
                              </p>
                            ))}
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
                        <td>
                          {moved.has(row.surfaceKey)
                            ? 'More inside this job'
                            : row.canOpen
                              ? 'Main menu'
                              : 'Outside your menu'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="usage-empty">
                <LayoutGrid size={26} aria-hidden="true" />
                <h3>{query || disposition ? 'No matching screens' : 'No screen history yet'}</h3>
                <p>
                  {query || disposition
                    ? 'Try another search or clear the filters.'
                    : 'As your team opens screens, their activity will appear after the nightly rollup.'}
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
              Counts are aggregated across your organization. No individual activity profiles are
              shown.
            </footer>
          </section>
        </>
      )}
    </PageShell>
  );
}
