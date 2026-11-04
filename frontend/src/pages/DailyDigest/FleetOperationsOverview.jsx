import { useMemo } from 'react';
import Link from '@/components/redesign/FleetLink';
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Route,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import { formatIst, formatIstDate } from '../../utils/redesign/format';
import { istDayString } from '../../utils/dateUtils';
import DigestStoryCard from './DigestStoryCard';
import OwnerReportPanel from './OwnerReportPanel';
import FleetLiveSection from './components/FleetLiveSection';
import FleetAnalytics from './components/FleetAnalytics';
import DigestSkeleton from './components/DigestSkeleton';
import { buildOverview, numeric, shiftDay } from './fleetOverviewModel';

const fmt = (value) => (value == null ? '—' : value.toLocaleString('en-IN'));
const SEVERITY = { act: 'Critical', watch: 'Warning', info: 'Info', good: 'Clear' };

export default function FleetOperationsOverview({
  date,
  onDateChange,
  report,
  live,
  fleet,
  inventory,
  trips,
  fuel,
  fuelTrend,
  accounts,
  onRefresh,
  legacy = null,
}) {
  const digest = report.data?.payload;
  const model = useMemo(() => buildOverview(digest, legacy), [digest, legacy]);
  const today = istDayString(new Date());
  const refreshing =
    report.loading || inventory.loading || trips.loading || fuel.loading || legacy?.loading;
  const issueLink = model.cards.issues?.link?.to || '/intelligence?tab=issues';
  const reportPending = legacy
    ? legacy.loading && !legacy.lastUpdated
    : report.loading && !report.data;
  const attentionPending = legacy
    ? (legacy.loadingSections?.attention ?? reportPending)
    : reportPending;
  const kpis = [
    {
      label: 'Total vehicles',
      loading: inventory.loading && !inventory.data,
      value: Array.isArray(inventory.data) ? inventory.data.length : null,
      note: inventory.error ? 'Fleet register could not refresh' : 'Registered fleet · current',
      to: '/vehicles/dashboard',
      icon: Truck,
      tone: 'info',
    },
    {
      label: 'Active trips',
      loading: trips.loading && !trips.data,
      value: numeric(trips.data?.total),
      note: trips.error ? 'Trip status could not refresh' : 'Open trips · current',
      to: '/auto-trips?status=OPEN',
      icon: Route,
      tone: 'good',
    },
    {
      label: 'Critical issues',
      loading: attentionPending,
      value: model.critical,
      note: legacy ? 'Priority action items · today' : 'Reported for the selected day',
      to: issueLink,
      icon: ShieldAlert,
      tone: model.critical > 0 ? 'act' : 'info',
    },
    {
      label: 'Pending actions',
      loading: attentionPending,
      value: model.pending,
      note: legacy ? 'Reported action items · today' : 'Place reviews + account reconnects',
      to: '#fo-attention',
      icon: ClipboardList,
      tone: model.pending > 0 ? 'watch' : 'info',
    },
  ];
  const reportUnavailable = report.error && report.error.status !== 404;
  const held = digest?.held === true;

  return (
    <div className="fleet-overview">
      <div className="fo-page">
        <header className="fo-page-header">
          <div>
            <div className="fo-eyebrow">Daily digest</div>
            <h1>Fleet Overview</h1>
            <p>
              {formatIstDate(new Date(`${date}T12:00:00+05:30`))}
              <span className="fo-header-divider">/</span>Operations at a glance
            </p>
          </div>
          <div className="fo-header-actions">
            <span className="fo-last-updated">
              {legacy?.lastUpdated
                ? `Report updated ${formatIst(legacy.lastUpdated)}`
                : report.data?.readAt
                  ? `Report updated ${formatIst(report.data.readAt)}`
                  : report.loading
                    ? 'Loading report…'
                    : 'Report update unavailable'}
            </span>
            <div className="fo-date-control">
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => onDateChange(shiftDay(date, -1))}
              >
                <ChevronLeft size={16} />
              </button>
              <label>
                <CalendarDays size={15} />
                <input
                  type="date"
                  aria-label="Digest date"
                  value={date}
                  max={today}
                  onChange={(e) => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && e.target.value <= today)
                      onDateChange(e.target.value);
                  }}
                />
              </label>
              <button
                type="button"
                aria-label="Next day"
                disabled={date >= today}
                onClick={() => onDateChange(shiftDay(date, 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {date !== today ? (
              <button type="button" className="fo-button" onClick={() => onDateChange(today)}>
                Today
              </button>
            ) : null}
            {legacy?.exportAction}
            <button
              type="button"
              className="fo-button fo-refresh"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={15} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {reportUnavailable || held ? (
          <div className="fo-notice" role="alert">
            <ShieldAlert size={18} />
            <div>
              <strong>We could not load today&apos;s digest.</strong>
              <p>
                {digest?.why?.text ||
                  (digest
                    ? 'The last successful report is shown. Live operations remain available below.'
                    : 'Live operations remain available. Retry the report to load daily insights.')}
              </p>
            </div>
            <button className="fo-button" type="button" onClick={report.refetch}>
              Retry report
            </button>
          </div>
        ) : null}
        {report.error?.status === 404 && !legacy ? (
          <div className="fo-notice" role="status">
            Historical digest reports are unavailable on this server. Select Today to view the
            available operational report.
          </div>
        ) : null}
        {legacy?.error ? (
          <div className="fo-notice" role="alert">
            Some daily report sources could not load. Live operations are still available.{' '}
            <button type="button" className="fo-text-link" onClick={legacy.refresh}>
              Retry daily report
            </button>
          </div>
        ) : null}

        <OwnerReportPanel day={date} digest={digest} />

        <section className="fo-kpis" aria-label="Fleet key metrics" aria-busy={refreshing}>
          {kpis.map((kpi) => {
            const { label, value, note, to, tone } = kpi;
            const Icon = kpi.icon;
            const body = (
              <>
                <span className="fo-kpi-label">
                  {label}
                  <span className={`fo-kpi-icon fo-tone--${tone}`}>
                    <Icon size={17} />
                  </span>
                </span>
                {kpi.loading ? (
                  <DigestSkeleton variant="metric" label={`Loading ${label.toLowerCase()}`} />
                ) : (
                  <>
                    <strong className="fo-kpi-value">{fmt(value)}</strong>
                    <span className="fo-kpi-note">{note}</span>
                  </>
                )}
              </>
            );
            if (kpi.loading)
              return (
                <div className="fo-kpi" key={label}>
                  {body}
                </div>
              );
            return to.startsWith('#') ? (
              <a
                className="fo-kpi"
                href={to}
                key={label}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById('fo-attention')?.scrollIntoView({ block: 'start' });
                }}
              >
                {body}
              </a>
            ) : (
              <Link className="fo-kpi" key={label} to={to}>
                {body}
              </Link>
            );
          })}
        </section>

        <FleetLiveSection fleet={fleet} live={live} trips={trips} />

        <section
          className="fo-panel fo-attention"
          id="fo-attention"
          aria-labelledby="fo-attention-title"
          aria-busy={report.loading || legacy?.loading || false}
        >
          <div className="fo-section-head">
            <div>
              <div className="fo-eyebrow">Action center</div>
              <h2 id="fo-attention-title">Needs your attention</h2>
              <p>Critical issues first. Open an item to investigate or take action.</p>
            </div>
            <Link className="fo-text-link" to={issueLink}>
              View issues <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="fo-attention-list">
            {attentionPending ? (
              <DigestSkeleton label="Loading action center" />
            ) : model.attention.length ? (
              model.attention.map((item) => (
                <Link className="fo-action" key={item.id} to={item.to}>
                  <span className={`fo-action-indicator fo-tone--${item.tone}`}>
                    <ShieldAlert size={18} />
                  </span>
                  <span className="fo-action-copy">
                    <span className="fo-action-title">
                      {item.title}
                      <span className={`fo-badge fo-tone--${item.tone}`}>
                        {SEVERITY[item.tone] || 'Review'}
                      </span>
                    </span>
                    <span className="fo-action-description">{item.description}</span>
                  </span>
                  <strong className="fo-action-count">
                    {item.count == null ? '—' : fmt(item.count)}
                    <small>
                      {item.count == null ? (legacy ? 'review' : 'unavailable') : 'reported'}
                    </small>
                  </strong>
                  <span className="fo-action-go">
                    {item.label || 'Review'} <ArrowUpRight size={15} />
                  </span>
                </Link>
              ))
            ) : (
              <p className="fo-empty">
                {legacy?.loading ? 'Loading actions…' : 'No action items returned by the report.'}
              </p>
            )}
          </div>
          <p className="fo-attention-note">
            {legacy
              ? 'Today’s available operational actions. Detailed reports below retain acknowledgements and vehicle drilldowns.'
              : 'Issue and place counts follow the digest’s organisation scope. Unknown counts are shown as —.'}
          </p>
        </section>

        <FleetAnalytics
          model={model}
          fuel={fuel}
          fuelTrend={fuelTrend}
          accounts={accounts}
          digest={digest}
          loading={reportPending}
          loadingSections={legacy?.loadingSections}
        />

        {legacy?.reports ? (
          <details className="fo-report-details">
            <summary>
              Detailed operational reports
              <span>Calendar, refuelling, cost estimates and follow-ups</span>
            </summary>
            <div className="fo-legacy-reports">{legacy.reports}</div>
          </details>
        ) : (
          <details className="fo-report-details">
            <summary>
              Daily report details<span>Source explanations and all original drilldowns</span>
            </summary>
            <div className="fo-report-content">
              {digest?.headline ? <p className="fo-report-headline">{digest.headline}</p> : null}
              {report.loading && !digest ? (
                <p role="status">Loading the day&apos;s report…</p>
              ) : !digest?.story?.length ? (
                <p>Nothing happened on this day that we can report yet.</p>
              ) : (
                <div className="fo-report-grid">
                  {digest.story.map((card) => (
                    <DigestStoryCard key={card.key} card={card} />
                  ))}
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
