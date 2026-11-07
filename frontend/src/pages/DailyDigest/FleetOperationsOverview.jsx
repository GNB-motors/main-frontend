import { useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, ShieldAlert } from 'lucide-react';
import { formatIst, formatIstDate } from '../../utils/redesign/format';
import { istDayString } from '../../utils/dateUtils';
import OwnerReportPanel from './OwnerReportPanel';
import useOwnerReport from './useOwnerReport';
import FleetAnalytics from './components/FleetAnalytics';
import { buildOverview, shiftDay } from './fleetOverviewModel';

const WEEKDAY = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });

/** The "Waiting on you" rows: the digest's action items, written for an owner. */
function waitingItems(model, legacy) {
  if (legacy) return model.attention;
  const issues = model.cards.issues;
  const first = issues?.items?.find((item) => item.link && item.value === 'critical')?.label;
  return model.attention
    .filter((item) => item.id !== 'accounts' || item.count > 0)
    .map((item) => {
      if (item.id === 'issues') {
        const parts = [];
        if (model.caution != null)
          parts.push(`${model.caution.toLocaleString('en-IN')} cautions too`);
        if (first) parts.push(`start with ${first.charAt(0).toLowerCase()}${first.slice(1)}`);
        return { ...item, description: parts.length ? parts.join(' · ') : item.description };
      }
      if (item.id === 'questions') {
        const names = (model.cards.questions?.items || [])
          .filter((i) => i.link)
          .map((i) => i.label)
          .slice(0, 2);
        return {
          ...item,
          title: 'Places waiting for your answer',
          description: names.length
            ? `Start with ${names.join(', ')}`
            : 'Answering them sharpens trip detection.',
        };
      }
      if (item.id === 'fuel') return { ...item, title: 'Fuel to explain' };
      return item;
    });
}

function accountsLine(accounts) {
  const list = Array.isArray(accounts?.data?.accounts) ? accounts.data.accounts : null;
  if (!list) return accounts?.checking ? 'Checking vendor accounts…' : null;
  const healthy = list.filter((a) => a.state === 'HEALTHY').length;
  const relink = list.filter((a) => a.state === 'NEEDS_RELINK').length;
  const other = list.length - healthy - relink;
  return `FleetEdge accounts: ${healthy} connected${relink ? `, ${relink} to re-link` : ''}${
    other > 0 ? `, ${other} in another state` : ''
  }.`;
}

export default function FleetOperationsOverview({
  date,
  onDateChange,
  report,
  live,
  fleet,
  fuel,
  fuelTrend,
  accounts,
  onRefresh,
  legacy = null,
}) {
  const digest = report.data?.payload;
  const owner = useOwnerReport(date);
  const work = owner.report$.data?.sections?.find(
    (section) => section.id === 'yesterdaysWork',
  )?.numbers;
  const model = useMemo(() => buildOverview(digest, legacy, work), [digest, legacy, work]);
  const today = istDayString(new Date());
  const refreshing =
    report.loading ||
    fuel.loading ||
    owner.report$.loading ||
    owner.brief$.loading ||
    legacy?.loading;
  const reportPending = legacy
    ? legacy.loading && !legacy.lastUpdated
    : report.loading && !report.data;
  const attentionPending = legacy
    ? (legacy.loadingSections?.attention ?? reportPending)
    : reportPending;
  const reportUnavailable = report.error && report.error.status !== 404;
  const held = digest?.held === true;
  const generatedAt = owner.report$.data?.generatedAt;
  const builtAt = generatedAt ? formatIst(generatedAt) : null;
  const dayDate = new Date(`${date}T12:00:00+05:30`);

  const handleRefresh = () => {
    owner.brief$.refetch();
    owner.report$.refetch();
    onRefresh();
  };

  return (
    <div className="fleet-overview">
      <div className="fo-page">
        <header className="db-header">
          <div className="db-header-text">
            <h1>Daily digest</h1>
            <p>
              {date === today ? 'Today' : WEEKDAY.format(dayDate)}, {formatIstDate(dayDate)}.{' '}
              {digest?.headline || 'What happened, what it cost and what needs you.'}
              {builtAt ? <span className="db-header-meta"> Report built {builtAt}.</span> : null}
            </p>
          </div>
          <div className="db-header-actions">
            <div className="db-date">
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => onDateChange(shiftDay(date, -1))}
              >
                <ChevronLeft size={16} />
              </button>
              <label>
                <CalendarDays size={15} aria-hidden="true" />
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
              <button type="button" className="db-button" onClick={() => onDateChange(today)}>
                Today
              </button>
            ) : null}
            {legacy?.exportAction}
            <button
              type="button"
              className="db-button db-button--primary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={15} aria-hidden="true" />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {reportUnavailable || held ? (
          <div className="db-notice" role="alert">
            <ShieldAlert size={18} aria-hidden="true" />
            <div>
              <strong>We could not load today&apos;s digest.</strong>
              <p>
                {digest?.why?.text ||
                  (digest
                    ? 'The last successful report is shown. Retry to update daily insights.'
                    : 'Retry the report to load daily insights.')}
              </p>
            </div>
            <button className="db-button" type="button" onClick={report.refetch}>
              Retry report
            </button>
          </div>
        ) : null}
        {report.error?.status === 404 && !legacy ? (
          <div className="db-notice" role="status">
            Historical digest reports are unavailable on this server. Select Today to view the
            available operational report.
          </div>
        ) : null}
        {legacy?.error ? (
          <div className="db-notice" role="alert">
            Some daily report sources could not load.{' '}
            <button type="button" className="db-link" onClick={legacy.refresh}>
              Retry daily report
            </button>
          </div>
        ) : null}

        <OwnerReportPanel
          day={date}
          digest={digest}
          brief$={owner.brief$}
          report$={owner.report$}
          builtAt={builtAt}
          fleet={fleet}
          live={live}
          attention={waitingItems(model, legacy)}
          attentionPending={attentionPending}
          attentionNote={
            legacy
              ? 'Priority action items from the daily report. They may group several alerts.'
              : 'Counts follow the digest for this organisation. An unknown count is shown as —.'
          }
          accountsSummary={accountsLine(accounts)}
          drivers={legacy ? model.drivers : null}
          performance={
            <FleetAnalytics
              day={date}
              model={model}
              fuel={fuel}
              fuelTrend={fuelTrend}
              loading={reportPending}
              loadingSections={legacy?.loadingSections}
            />
          }
        />

        {legacy?.reports ? (
          <section className="db-section" aria-labelledby="db-legacy-title">
            <header className="db-section-head">
              <h2 id="db-legacy-title">Detailed operational reports</h2>
              <p>Calendar, refuelling, cost estimates and follow-ups.</p>
            </header>
            <div className="fo-legacy-reports">{legacy.reports}</div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
