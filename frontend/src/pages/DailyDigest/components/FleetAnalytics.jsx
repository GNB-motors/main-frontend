import Link from '@/components/redesign/FleetLink';
import {
  ArrowUpRight,
  BarChart3,
  Fuel,
  Trophy,
  PlugZap,
  ShieldAlert as TruckAttention,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatIstDate } from '../../../utils/redesign/format';
import { intelligenceLink } from '../../../utils/redesign/links';
import { numeric } from '../fleetOverviewModel';
import { fleetDestination } from '@/utils/redesign/fleetDestination';
import DigestSkeleton from './DigestSkeleton';

const fmt = (value) =>
  value == null ? '—' : value.toLocaleString('en-IN', { maximumFractionDigits: 1 });

function Panel({
  title,
  caption,
  icon,
  to,
  children,
  className = '',
  loading = false,
  skeleton = 'list',
}) {
  const Icon = icon;
  const destination = fleetDestination(to);
  return (
    <section className={`fo-panel fo-analytics-panel ${className}`}>
      <div className="fo-analytics-heading">
        <div>
          <h3>
            <Icon size={17} />
            {title}
          </h3>
          <p>{caption}</p>
        </div>
        {destination ? (
          <Link className="fo-icon-link" to={destination} aria-label={`Open ${title}`}>
            <ArrowUpRight size={17} />
          </Link>
        ) : null}
      </div>
      {loading ? (
        <DigestSkeleton variant={skeleton} label={`Loading ${title.toLowerCase()}`} />
      ) : (
        children
      )}
    </section>
  );
}

export default function FleetAnalytics({
  model,
  fuel,
  fuelTrend,
  accounts,
  digest,
  loading,
  loadingSections = {},
}) {
  const { loadedKm, emptyKm } = model;
  const measured = loadedKm != null && emptyKm != null;
  const total = measured ? loadedKm + emptyKm : null;
  const issueParts = [
    { label: 'Critical', count: model.critical, tone: 'act' },
    { label: 'Warning', count: model.caution, tone: 'watch' },
  ];
  if (
    model.open != null &&
    model.critical != null &&
    model.caution != null &&
    model.open >= model.critical + model.caution
  )
    issueParts.push({
      label: 'Other',
      count: model.open - model.critical - model.caution,
      tone: 'info',
    });
  const issueTotal = issueParts.reduce((sum, part) => sum + (part.count ?? 0), 0);
  const accountList = Array.isArray(accounts.data?.accounts) ? accounts.data.accounts : null;
  const reconnect = digest?.reconnect || [];
  const healthy = accountList ? accountList.filter((a) => a.state === 'HEALTHY').length : null;
  const disconnected = accountList
    ? accountList.filter((a) => a.state === 'NEEDS_RELINK').length
    : null;
  const otherAccounts = accountList ? accountList.length - healthy - disconnected : null;
  const followUps = model.followUps;
  const knownDays = fuelTrend.filter((d) => d.litres != null);
  const summary = fuelTrend.reduce((sum, d) => sum + (d.litres ?? 0), 0);

  return (
    <section className="fo-performance" aria-labelledby="fo-performance-title">
      <div className="fo-section-heading">
        <div>
          <div className="fo-eyebrow">Performance & reliability</div>
          <h2 id="fo-performance-title">Know where to improve</h2>
        </div>
        <span>Daily report and latest learned performance</span>
      </div>
      <div className="fo-analytics-grid">
        <Panel
          title="Loaded vs. empty running"
          caption="Distance attributed to the selected day"
          icon={BarChart3}
          to={model.cards.loaded?.link?.to || '/auto-trips'}
          className="fo-running-panel"
          loading={loadingSections.running ?? (loading && !measured)}
          skeleton="chart"
        >
          {!measured ? (
            <div className="fo-empty">
              <p>
                {loading
                  ? 'Loading distance…'
                  : `— ${model.runningReason || 'Comparable loaded and empty distances are not available for this day.'}`}
              </p>
            </div>
          ) : (
            <>
              <div className="fo-chart-number">
                {fmt(total)} <span>km reported</span>
              </div>
              {total > 0 ? (
                <div
                  className="fo-distance-bar"
                  role="img"
                  aria-label={`Loaded ${fmt(loadedKm)} km, empty ${fmt(emptyKm)} km`}
                >
                  <span style={{ width: `${(loadedKm / total) * 100}%` }} />
                  <span style={{ width: `${(emptyKm / total) * 100}%` }} />
                </div>
              ) : (
                <p className="fo-muted">No attributed running distance for this day.</p>
              )}
              <div className="fo-distance-key">
                <div>
                  <span>
                    <i className="fo-key fo-key--loaded" />
                    Loaded
                  </span>
                  <strong>{fmt(loadedKm)} km</strong>
                  <small>
                    {total > 0
                      ? `${((loadedKm / total) * 100).toFixed(1)}% of attributed distance`
                      : 'No distance'}
                  </small>
                </div>
                <div>
                  <span>
                    <i className="fo-key fo-key--empty" />
                    Empty
                  </span>
                  <strong>{fmt(emptyKm)} km</strong>
                  <small>
                    {total > 0
                      ? `${((emptyKm / total) * 100).toFixed(1)}% of attributed distance`
                      : 'No distance'}
                  </small>
                </div>
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Fuel consumption"
          caption="7 days ending on the report date · completed cycles"
          icon={Fuel}
          to="/mileage?tab=live&subtab=completed"
          className="fo-fuel-panel"
          loading={fuel.loading && !fuel.data}
          skeleton="chart"
        >
          {fuel.error ? (
            <div className="fo-empty">
              <p>Fuel history could not load.</p>
              <button type="button" className="fo-text-link" onClick={fuel.refetch}>
                Retry fuel history
              </button>
            </div>
          ) : fuel.loading && !fuel.data ? (
            <div className="fo-empty" role="status">
              Loading fuel history…
            </div>
          ) : knownDays.length < 2 ? (
            <div className="fo-empty">
              <Fuel size={24} />
              <p>
                {knownDays.length
                  ? 'One day has measured cycles. More observations are needed to show a trend.'
                  : 'No measured fuel cycles in this window.'}
              </p>
              <span>Unmeasured days are left blank.</span>
            </div>
          ) : (
            <>
              <div className="fo-fuel-caption">
                <strong>{fmt(summary)} L</strong>
                <span>from fully measured days shown</span>
              </div>
              <div
                className="fo-fuel-chart"
                role="img"
                aria-label="Fuel consumed in completed cycles by cycle end date"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelTrend} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--rd-line)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(d) => d.slice(8)}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--rd-ink-2)' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--rd-ink-2)' }}
                    />
                    <Tooltip
                      labelFormatter={(d) => formatIstDate(new Date(`${d}T12:00:00+05:30`))}
                      formatter={(v) => [`${fmt(v)} L`, 'Consumed']}
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: 'var(--rd-line)',
                        background: 'var(--rd-card)',
                        color: 'var(--rd-ink)',
                      }}
                    />
                    <Line
                      dataKey="litres"
                      type="linear"
                      stroke="var(--rd-brand-2)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="fo-chart-note">
                Consumption is grouped by cycle end date; it is not a daily burn estimate. Gaps mean
                unavailable data.
              </p>
              <details className="fo-chart-data">
                <summary>View measured values</summary>
                <ul>
                  {knownDays.map((day) => (
                    <li key={day.day}>
                      {day.day}: {fmt(day.litres)} L · {day.cycles} cycles
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </Panel>

        <Panel
          title="Driver performance"
          caption={model.driverNote}
          icon={Trophy}
          to="/intelligence?tab=drivers"
          className="fo-drivers-panel"
          loading={loadingSections.drivers ?? (loading && !model.drivers.length)}
        >
          {!model.drivers.length ? (
            <div className="fo-empty">
              <p>
                {loading
                  ? 'Loading driver performance…'
                  : 'No qualified driver scores available yet.'}
              </p>
            </div>
          ) : (
            <ol className="fo-leaderboard">
              {model.drivers.map((driver, index) => (
                <li key={driver.id}>
                  <Link to={driver.to}>
                    <span className="fo-rank">{index + 1}</span>
                    <span className="fo-driver-name">
                      <strong>{driver.name}</strong>
                      <small>{driver.headline || 'Performance report available'}</small>
                    </span>
                    <span className="fo-driver-score">
                      {fmt(numeric(driver.score))}
                      <small>score</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel
          title="Driver attention"
          caption="Follow up on the reported driver and vehicle findings"
          icon={TruckAttention}
          to="/intelligence?tab=drivers"
          className="fo-followup-panel"
          loading={loading && !followUps.length}
        >
          {!followUps.length ? (
            <div className="fo-empty">
              <p>
                {loading
                  ? 'Loading follow-ups…'
                  : model.cards.needsWord?.status === 'ok'
                    ? 'No follow-ups reported.'
                    : 'No follow-up report available.'}
              </p>
            </div>
          ) : (
            <ul className="fo-followups">
              {followUps.map((subject) => (
                <li key={`${subject.subject}-${subject.id}`}>
                  <Link
                    to={intelligenceLink({
                      tab: subject.subject === 'driver' ? 'drivers' : 'vehicles',
                      driver: subject.subject === 'driver' ? subject.id : null,
                      vehicle: subject.subject === 'vehicle' ? subject.id : null,
                    })}
                  >
                    <span>
                      <strong>{subject.name}</strong>
                      <small>{subject.headline || 'Review the latest report'}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Truck issues"
          caption={model.issueNote}
          icon={TruckAttention}
          to={model.cards.issues?.link?.to || '/intelligence?tab=issues'}
          className="fo-issues-panel"
          loading={loadingSections.issues ?? loading}
        >
          <div className="fo-severity-list">
            {issueParts.map((part) => (
              <div key={part.label}>
                <span>
                  <i className={`fo-key fo-key--${part.tone}`} />
                  {part.label}
                </span>
                <strong>{fmt(part.count)}</strong>
                <span className="fo-severity-track">
                  <span
                    className={`fo-severity-fill fo-severity-fill--${part.tone}`}
                    style={{
                      width: `${issueTotal && part.count != null ? (part.count / issueTotal) * 100 : 0}%`,
                    }}
                  />
                </span>
              </div>
            ))}
          </div>
          <p className="fo-chart-note">
            {model.critical == null || model.caution == null
              ? 'Severity counts are unavailable for this report.'
              : issueTotal === 0
                ? 'No issues reported in these categories.'
                : model.open != null
                  ? `${fmt(model.open)} open issues in total.`
                  : 'Total issue count is unavailable.'}
          </p>
        </Panel>

        <Panel
          title="Account connectivity"
          caption="Current FleetEdge account status"
          icon={PlugZap}
          to="/settings/fleetedge-accounts"
          className="fo-accounts-panel"
          loading={accounts.checking && !accounts.data}
        >
          {accounts.error ? (
            <p className="fo-chart-note" role="status">
              Account status could not refresh. Last received values are shown when available.
            </p>
          ) : null}
          <div className="fo-connectivity">
            <div>
              <i className="fo-dot fo-dot--moving" />
              <strong>{fmt(healthy)}</strong>
              <span>Connected</span>
            </div>
            <div>
              <i className="fo-dot fo-dot--act" />
              <strong>{fmt(disconnected)}</strong>
              <span>Disconnected</span>
            </div>
            {otherAccounts > 0 ? (
              <div>
                <i className="fo-dot fo-dot--idling" />
                <strong>{otherAccounts}</strong>
                <span>Other states</span>
              </div>
            ) : null}
          </div>
          {!accountList ? (
            <p className="fo-chart-note">
              {accounts.checking
                ? 'Checking account connections…'
                : 'Full account status is unavailable.'}
            </p>
          ) : null}
          {reconnect.length ? (
            <ul className="fo-account-actions">
              {reconnect.map((account, index) => (
                <li key={`${account.accountName}-${index}`}>
                  <div>
                    <strong>{account.accountName}</strong>
                    <span>
                      {account.trucksAffected == null
                        ? 'Vehicle count unavailable'
                        : `${account.trucksAffected} vehicles affected`}{' '}
                      ·{' '}
                      {account.state === 'NEEDS_RELINK'
                        ? 'is disconnected'
                        : account.state === 'EXPIRING'
                          ? 'connection expires soon'
                          : 'needs attention'}
                    </span>
                  </div>
                  <Link to={account.action?.to || '/settings/fleetedge-accounts'}>
                    {account.action?.label || 'Reconnect'} <ArrowUpRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      </div>
    </section>
  );
}
