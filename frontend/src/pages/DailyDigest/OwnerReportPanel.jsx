import { useMemo, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import useOwnerReport from './useOwnerReport';
import InfoTip from '../../components/redesign/InfoTip';
import DigestSkeleton from './components/DigestSkeleton';
import {
  DASH,
  drillRoute,
  drillTarget,
  formatFooterText,
  isToday,
  numberPairs,
  sectionFooter,
  sectionReason,
  sectionState,
  sectionTitle,
} from './ownerReportModel';
import {
  NUMBER_SECTIONS,
  attentionGroups,
  buildKpis,
  count,
  exceptionSummary,
  leakRows,
  rupees,
  sectionsById,
} from './briefingModel';

/**
 * The owner's morning briefing: five headline numbers, where the money
 * leaked, the exceptions, the trucks that need someone, and then the day's
 * report as plain sections.
 *
 * The rules this panel keeps:
 *   - a section is never missing: it is ok | empty | error, and it says which;
 *   - an unknown is "—" with the reason beside it, never a zero;
 *   - "how we know" lives behind an InfoTip, never as a paragraph;
 *   - nothing developer-ish is printed: no drill codes, raw keys or ISO times.
 */

const truckLink = (reg) => `/vehicles/${encodeURIComponent(reg)}`;

function RetryButton({ onRetry, label = 'Retry' }) {
  return (
    <button type="button" className="db-link" onClick={onRetry}>
      {label} <RefreshCw size={13} />
    </button>
  );
}

function Card({ title, info, meta, action, className = '', children }) {
  return (
    <section className={`db-card ${className}`}>
      <header className="db-card-head">
        <h3>{title}</h3>
        {info ? <InfoTip text={info} label={`How we know: ${title}`} /> : null}
        {meta ? <span className="db-card-meta">{meta}</span> : null}
        {action ? <span className="db-card-action">{action}</span> : null}
      </header>
      {children}
    </section>
  );
}

/* ── KPI strip ───────────────────────────────────────────────────────── */

function KpiStrip({ tiles, loading }) {
  return (
    <section className="db-kpis" aria-label="Key numbers for the day">
      {tiles.map((tile) => {
        const value =
          tile.value == null
            ? DASH
            : tile.money
              ? rupees(tile.value)
              : Number(tile.value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const body = (
          <>
            <span className="db-kpi-label">
              {tile.tone ? (
                <i className={`db-dot db-dot--${tile.tone}`} aria-hidden="true" />
              ) : null}
              {tile.label}
              {tile.why ? <InfoTip text={tile.why} label={`About ${tile.label}`} /> : null}
            </span>
            <strong className={`db-kpi-value ${tile.value == null ? 'is-unknown' : ''}`}>
              {loading && tile.value == null ? <span className="db-shimmer" /> : value}
            </strong>
            <span className="db-kpi-context">
              {tile.delta != null ? (
                <span className={tile.delta >= 0 ? 'db-up' : 'db-down'}>
                  {tile.delta >= 0 ? '↑' : '↓'} {Math.abs(tile.delta)}% vs 7-day average
                </span>
              ) : (
                tile.context || '7-day comparison unavailable'
              )}
            </span>
          </>
        );
        return tile.to ? (
          <Link key={tile.key} className="db-kpi db-kpi--link" to={tile.to}>
            {body}
          </Link>
        ) : (
          <div key={tile.key} className="db-kpi">
            {body}
          </div>
        );
      })}
    </section>
  );
}

/* ── Where money leaked ──────────────────────────────────────────────── */

const CHIP_LIMIT = 6;

function TruckChips({ trucks }) {
  const [open, setOpen] = useState(false);
  if (!trucks.length) return <p className="db-muted">No truck named for this one.</p>;
  const shown = open ? trucks : trucks.slice(0, CHIP_LIMIT);
  return (
    <ul className="db-chips">
      {shown.map((truck, i) => (
        <li key={`${truck.reg}-${i}`}>
          <Link className="db-chip" to={truckLink(truck.reg)} title={truck.detail || undefined}>
            <span className="db-chip-reg">{truck.reg}</span>
            {truck.rupees != null ? (
              <span className="db-chip-amt">{rupees(truck.rupees)}</span>
            ) : null}
            {truck.detail ? <span className="db-chip-detail">{truck.detail}</span> : null}
          </Link>
        </li>
      ))}
      {trucks.length > CHIP_LIMIT ? (
        <li>
          <button type="button" className="db-chip db-chip--more" onClick={() => setOpen(!open)}>
            {open ? 'Show fewer' : `+${trucks.length - CHIP_LIMIT} more`}
          </button>
        </li>
      ) : null}
    </ul>
  );
}

function MoneyLeakCard({ brief$, isPendingDay }) {
  const brief = brief$.data;
  const rows = useMemo(() => leakRows(brief), [brief]);

  if (brief$.loading && !brief) {
    return (
      <Card title="Where money leaked" className="db-leak">
        <DigestSkeleton label="Loading the morning brief" />
      </Card>
    );
  }
  if (brief$.error) {
    const forbidden = brief$.error?.status === 403;
    return (
      <Card title="Where money leaked" className="db-leak">
        <p className="db-error">
          {forbidden ? 'Not available for your role.' : "Couldn't load the morning brief."}{' '}
          {forbidden ? null : <RetryButton onRetry={brief$.refetch} />}
        </p>
        <p className="db-muted">
          {forbidden
            ? 'The morning brief is read by owners and managers only.'
            : brief$.error?.message || 'The morning brief could not be read.'}
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Where money leaked"
      className="db-leak"
      info={brief?.disclaimer || null}
      meta={isPendingDay ? 'So far today' : null}
    >
      <div className="db-leak-total">
        <strong>{rupees(brief?.totalRupees)}</strong>
        <span>
          {brief?.totalRupees == null
            ? 'Not estimated for this day'
            : `estimated loss across ${rows.length} problem${rows.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {rows.length > 1 && rows.some((r) => r.share) ? (
        <div className="db-leak-split" role="img" aria-label="How the loss splits by problem">
          {rows.map((row, i) =>
            row.share ? (
              <span
                key={row.key}
                className={`db-leak-seg db-leak-seg--${i}`}
                style={{ flexGrow: row.share }}
                title={`${row.label}: ${Math.round(row.share * 100)}%`}
              />
            ) : null,
          )}
        </div>
      ) : null}
      {rows.length === 0 ? (
        <p className="db-empty-line">Nothing was flagged for this day. No leak measured.</p>
      ) : (
        <ol className="db-leak-list">
          {rows.map((row, i) => (
            <li key={row.key} className="db-leak-row">
              <div className="db-leak-row-head">
                <span className={`db-leak-key db-leak-seg--${i}`} aria-hidden="true" />
                <h4>{row.label}</h4>
                {row.share != null ? (
                  <span className="db-leak-share">{Math.round(row.share * 100)}%</span>
                ) : null}
                <strong className="db-leak-amt">
                  {row.rupees == null ? DASH : rupees(row.rupees)}
                </strong>
              </div>
              {row.action ? <p className="db-leak-action">{row.action}</p> : null}
              <TruckChips trucks={row.trucks} />
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ── Waiting on you ──────────────────────────────────────────────────── */

function WaitingCard({ items, pending, note }) {
  if (!items) return null;
  return (
    <Card title="Waiting on you" className="db-waiting" info={note}>
      {pending ? (
        <DigestSkeleton label="Loading actions" />
      ) : !items.length ? (
        <p className="db-empty-line">Nothing is waiting on you.</p>
      ) : (
        <ul className="db-rows">
          {items.map((item) => (
            <li key={item.id}>
              <Link className={`db-row ${item.count === 0 ? 'is-quiet' : ''}`} to={item.to}>
                <i
                  className={`db-dot db-dot--${item.tone === 'act' ? 'act' : item.tone === 'watch' ? 'watch' : 'quiet'}`}
                />
                <span className="db-row-main">
                  <span className="db-row-title">{item.title}</span>
                  {item.description ? (
                    <span className="db-row-sub" title={item.description}>
                      {item.description}
                    </span>
                  ) : null}
                </span>
                <strong className="db-row-num">
                  {item.count == null ? DASH : count(item.count)}
                </strong>
                <ArrowUpRight size={15} className="db-row-go" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ── Exceptions ──────────────────────────────────────────────────────── */

function ExceptionsCard({ section, loading, onRetry }) {
  const summary = useMemo(() => exceptionSummary(section), [section]);
  const state = sectionState(section);
  const footer = formatFooterText(sectionFooter(section));
  const max = summary.counted[0]?.count || 1;
  return (
    <Card
      title="Exceptions"
      className="db-exceptions"
      info={footer || null}
      meta={summary.total != null ? `${count(summary.total)} in all` : null}
    >
      {loading && !section ? (
        <DigestSkeleton label="Loading exceptions" />
      ) : state === 'error' ? (
        <p className="db-error">
          Exceptions unavailable. <RetryButton onRetry={onRetry} />
        </p>
      ) : summary.counted.length ? (
        <ul className="db-bars">
          {summary.counted.map((row) => (
            <li key={row.key}>
              <Link className="db-bar" to={row.to}>
                <span className="db-bar-label">
                  {row.label}
                  {row.detail ? <small>{row.detail}</small> : null}
                </span>
                <span className="db-bar-track">
                  <i
                    className={row.urgent ? 'is-urgent' : ''}
                    style={{ width: `${Math.max((row.count / max) * 100, 1.5)}%` }}
                  />
                </span>
                <strong>{count(row.count)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="db-empty-line">No exceptions reported.</p>
      )}
      {summary.clear.length || summary.unmeasured.length ? (
        <p className="db-foot-line">
          {summary.clear.length ? <>None today: {summary.clear.join(', ')}.</> : null}
          {summary.clear.length && summary.unmeasured.length ? ' ' : null}
          {summary.unmeasured.length ? (
            <>Not measured yet: {summary.unmeasured.join(', ')}.</>
          ) : null}
        </p>
      ) : null}
    </Card>
  );
}

/* ── Trucks needing attention ────────────────────────────────────────── */

const DARK_LIMIT = 10;

function TrucksCard({ groups, live, reconnect, accountsSummary }) {
  const [showAll, setShowAll] = useState(false);
  if (!groups) return null;
  const { dark, darkRange, stuck, stuckCount, neverReported, feeds } = groups;
  const darkShown = showAll ? dark : dark.slice(0, DARK_LIMIT);
  const nothing =
    !dark.length && !stuck.length && !neverReported.length && !feeds.length && !reconnect.length;

  return (
    <Card
      title="Trucks needing attention"
      className="db-trucks"
      action={
        <Link className="db-link" to="/live-tracking">
          Live map <ArrowUpRight size={13} />
        </Link>
      }
    >
      {live?.isLoading && !dark.length ? (
        <DigestSkeleton label="Loading live positions" />
      ) : nothing ? (
        <p className="db-empty-line">Every truck is reporting and none is stuck.</p>
      ) : (
        <div className="db-groups">
          {dark.length ? (
            <div className="db-group">
              <p className="db-group-title">
                <i className="db-dot db-dot--watch" />
                <strong>{dark.length} dark now</strong>
                <span>{darkRange ? `silent ${darkRange}` : 'no recent signal'}</span>
              </p>
              <ul className="db-chips db-chips--tight">
                {darkShown.map((truck) => (
                  <li key={truck.reg}>
                    <Link className="db-chip" to={truckLink(truck.reg)}>
                      <span className="db-chip-reg">{truck.reg}</span>
                      <span className="db-chip-detail">{truck.silent || 'never'}</span>
                    </Link>
                  </li>
                ))}
                {dark.length > DARK_LIMIT ? (
                  <li>
                    <button
                      type="button"
                      className="db-chip db-chip--more"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? 'Show fewer' : `+${dark.length - DARK_LIMIT} more`}
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {stuck.length || stuckCount ? (
            <div className="db-group">
              <p className="db-group-title">
                <i className="db-dot db-dot--watch" />
                <strong>{count(stuckCount)} stuck at a plant</strong>
                <span>stationary 3 h or more</span>
              </p>
              <ul className="db-chips db-chips--tight">
                {stuck.map((truck, i) => (
                  <li key={`${truck.reg}-${i}`}>
                    <Link className="db-chip" to={truckLink(truck.reg)}>
                      <span className="db-chip-reg">{truck.reg}</span>
                      {truck.silent ? <span className="db-chip-detail">{truck.silent}</span> : null}
                    </Link>
                  </li>
                ))}
                {Number(stuckCount) > stuck.length ? (
                  <li>
                    <Link className="db-chip db-chip--more" to="/place-hub">
                      +{count(Number(stuckCount) - stuck.length)} more
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {neverReported.length ? (
            <div className="db-group">
              <p className="db-group-title">
                <i className="db-dot db-dot--quiet" />
                <strong>{neverReported.length} with no data</strong>
                <span>no position on record</span>
              </p>
              <ul className="db-chips db-chips--tight">
                {neverReported.map((truck) => (
                  <li key={truck.reg}>
                    <Link className="db-chip" to={truckLink(truck.reg)}>
                      <span className="db-chip-reg">{truck.reg}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {feeds.length || reconnect.length ? (
            <div className="db-group">
              <p className="db-group-title">
                <i className="db-dot db-dot--act" />
                <strong>
                  {feeds.length + reconnect.length} vendor link
                  {feeds.length + reconnect.length === 1 ? '' : 's'} failing
                </strong>
              </p>
              <ul className="db-feed-list">
                {reconnect.map((account, i) => (
                  <li key={`re-${account.accountName}-${i}`} className="db-feed-relink">
                    <span>
                      <strong>{account.accountName}</strong>
                      <span>
                        {account.state === 'EXPIRING'
                          ? 'connection expires soon'
                          : account.state === 'NEEDS_RELINK'
                            ? 'is disconnected'
                            : 'needs attention'}
                        {account.trucksAffected == null
                          ? ''
                          : ` · ${account.trucksAffected} trucks affected`}
                      </span>
                    </span>
                    <Link
                      className="db-button"
                      to={account.action?.to || '/settings/fleetedge-accounts'}
                    >
                      {account.action?.label || 'Reconnect'}
                    </Link>
                  </li>
                ))}
                {feeds.map((feed) => (
                  <li key={feed.key}>
                    <Link to="/settings/fleetedge-accounts">
                      <strong>
                        FleetEdge feed:{' '}
                        {feed.failedPulls != null
                          ? `${feed.failedPulls} failed pulls in a row`
                          : 'pulls failing'}
                        {feed.lastSuccess ? ` · last success ${feed.lastSuccess}` : ''}
                      </strong>
                      {feed.reason ? <span title={feed.rawReason}>{feed.reason}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
      {accountsSummary ? <p className="db-foot-line">{accountsSummary}</p> : null}
    </Card>
  );
}

/* ── The day in numbers ──────────────────────────────────────────────── */

const TREND_REPEATS = new Set(['trips', 'km']);

const sentence = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

function ReportSection({ section, onRetry, isPendingDay, builtAt }) {
  const state = sectionState(section);
  const pairs = useMemo(
    () => numberPairs(section?.numbers, { isPendingDay }),
    [section?.numbers, isPendingDay],
  );
  // Trend repeats the day's trips and km; "Today so far" already shows them.
  const shown = section?.id === 'trend' ? pairs.filter((p) => !TREND_REPEATS.has(p.key)) : pairs;
  const known = shown.filter((p) => !p.unknown);
  // Unknowns are grouped by their reason: one line each, never a column of dashes.
  const unknownGroups = [];
  for (const pair of shown.filter((p) => p.unknown)) {
    const reason = pair.note || 'Not measured';
    const group = unknownGroups.find((g) => g.reason === reason);
    if (group) group.labels.push(pair.label);
    else unknownGroups.push({ reason, labels: [pair.label] });
  }
  const route = drillRoute(drillTarget(section));
  const title =
    section?.id === 'yesterdaysWork' && isPendingDay
      ? 'Today so far'
      : section?.id === 'fleetNow' && builtAt
        ? `Fleet at ${builtAt}`
        : sectionTitle(section);
  const footer = formatFooterText(sectionFooter(section));

  return (
    <Card
      title={title}
      className={`db-report db-report--${state}`}
      info={footer ? `How we know: ${footer}` : null}
      action={
        route && state !== 'error' ? (
          <Link className="db-link" to={route}>
            Open
          </Link>
        ) : null
      }
    >
      {state === 'error' ? (
        <>
          <p className="db-error">
            Couldn&apos;t load. <RetryButton onRetry={onRetry} />
          </p>
          <p className="db-muted">{section?.error || 'The section query failed.'}</p>
        </>
      ) : state === 'empty' ? (
        <p className="db-empty-line">
          <span className="db-badge">Nothing recorded</span> {sentence(sectionReason(section))}
        </p>
      ) : (
        <>
          {known.length ? (
            <dl className="db-kv">
              {known.map((pair) => (
                <div key={pair.key}>
                  <dt>{pair.label}</dt>
                  <dd>{pair.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {unknownGroups.map((group) => (
            <p key={group.reason} className="db-foot-line">
              {DASH} {group.reason}: {group.labels.join(', ')}
            </p>
          ))}
        </>
      )}
    </Card>
  );
}

/* ── People ──────────────────────────────────────────────────────────── */

function SubjectList({ title, info, items, reason, emptyTo }) {
  return (
    <Card title={title} className="db-people" info={info}>
      {items.length === 0 ? (
        <div className="db-people-empty">
          <p className="db-empty-line">No one this time</p>
          {reason ? <p className="db-muted">{reason}</p> : null}
          {emptyTo ? (
            <Link className="db-link" to={emptyTo}>
              See the drivers <ArrowUpRight size={13} />
            </Link>
          ) : null}
        </div>
      ) : (
        <ol className="db-people-list">
          {items.map((item, i) => (
            <li key={item.id || item.name || i}>
              <Link to={item.to || '/intelligence?tab=drivers'}>
                <span className="db-rank">{i + 1}</span>
                <span className="db-row-main">
                  <span className="db-row-title">{item.name || item.id || DASH}</span>
                  {item.headline || item.grade ? (
                    <span className="db-row-sub">{item.headline || item.grade}</span>
                  ) : null}
                </span>
                {item.score != null ? <strong className="db-row-num">{item.score}</strong> : null}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ── The panel ───────────────────────────────────────────────────────── */

function FetchingPanel(props) {
  const { brief$, report$ } = useOwnerReport(props.day);
  return <BriefingPanel {...props} brief$={brief$} report$={report$} />;
}

export default function OwnerReportPanel(props) {
  if (props.brief$ && props.report$) return <BriefingPanel {...props} />;
  return <FetchingPanel {...props} />;
}

function BriefingPanel({
  day,
  digest,
  brief$,
  report$,
  builtAt = null,
  fleet = null,
  live = null,
  attention = null,
  attentionPending = false,
  attentionNote = null,
  accountsSummary = null,
  drivers = null,
  followUps = null,
  performance = null,
}) {
  const isPendingDay = useMemo(() => isToday(day), [day]);
  const sections = useMemo(
    () => (Array.isArray(report$.data?.sections) ? report$.data.sections : []),
    [report$.data],
  );
  const byId = useMemo(() => sectionsById(sections), [sections]);
  const reportLoading = report$.loading && !report$.data;

  const tiles = useMemo(
    () =>
      buildKpis({
        day,
        byId,
        brief: brief$.data,
        briefState: brief$.error ? 'error' : 'ok',
        isToday: isPendingDay,
        liveCounts: fleet?.fleetCounts || null,
        builtAt,
      }),
    [byId, brief$.data, brief$.error, isPendingDay, fleet?.fleetCounts, builtAt, day],
  );
  const groups = useMemo(
    () => (fleet ? attentionGroups({ vehicles: fleet.vehicles, byId }) : null),
    [fleet, byId],
  );

  const untracked = sections.filter(
    (s) => ['moneyIn', 'people'].includes(s.id) && sectionState(s) === 'empty',
  );
  const numberSections = sections
    .filter((s) => !untracked.includes(s) && s.id !== 'exceptions')
    .sort((a, b) => {
      const ia = NUMBER_SECTIONS.indexOf(a.id);
      const ib = NUMBER_SECTIONS.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

  const story = Object.fromEntries((digest?.story || []).map((card) => [card.key, card]));
  const goodDrivers = drivers ?? (Array.isArray(digest?.goodDrivers) ? digest.goodDrivers : []);
  const needsWord =
    followUps ?? (Array.isArray(digest?.needsAttention) ? digest.needsAttention : []);

  return (
    <div className="db-briefing">
      <KpiStrip tiles={tiles} loading={reportLoading || (brief$.loading && !brief$.data)} />

      <div className="db-grid">
        <div className="db-col db-col--primary">
          <MoneyLeakCard brief$={brief$} isPendingDay={isPendingDay} />
          <WaitingCard items={attention} pending={attentionPending} note={attentionNote} />
        </div>
        <div className="db-col">
          {report$.error ? (
            <Card title="Owner's report" className="db-report db-report--error">
              <p className="db-error">
                Couldn&apos;t load. <RetryButton onRetry={report$.refetch} />
              </p>
              <p className="db-muted">
                {report$.error?.message || 'The report could not be read.'}
              </p>
            </Card>
          ) : (
            <ExceptionsCard
              section={byId.exceptions}
              loading={reportLoading}
              onRetry={report$.refetch}
              isPendingDay={isPendingDay}
            />
          )}
          <TrucksCard
            groups={groups}
            live={live}
            reconnect={Array.isArray(digest?.reconnect) ? digest.reconnect : []}
            accountsSummary={accountsSummary}
          />
        </div>
      </div>

      {untracked.length ? (
        <p className="db-untracked">
          Not tracked yet:{' '}
          {untracked.map((s) => (s.id === 'moneyIn' ? 'Money in' : 'People')).join(', ')}
          <InfoTip
            text={untracked.map((s) => `${sectionTitle(s)}: ${sectionReason(s)}`).join(' · ')}
            label="Why these are not tracked"
          />
        </p>
      ) : null}

      <section className="db-section" aria-labelledby="db-numbers-title">
        <header className="db-section-head">
          <h2 id="db-numbers-title">The day in numbers</h2>
          <p>
            Every section of the owner&apos;s report, measured or with the reason it isn&apos;t.
          </p>
        </header>
        {reportLoading ? (
          <DigestSkeleton label="Loading the owner's report" />
        ) : report$.error ? (
          <p className="db-muted">The owner&apos;s report did not load. Retry it above.</p>
        ) : (
          <div className="db-report-grid">
            {numberSections.map((section) => (
              <ReportSection
                key={section?.id || section?.title}
                section={section}
                onRetry={report$.refetch}
                isPendingDay={isPendingDay}
                builtAt={builtAt}
              />
            ))}
          </div>
        )}
      </section>

      <section className="db-section" aria-labelledby="db-people-title">
        <header className="db-section-head">
          <h2 id="db-people-title">Running, fuel and drivers</h2>
          <p>Loaded and empty distance, the week&apos;s fuel, and the drivers worth a word.</p>
        </header>
        <div className="db-perf-grid">
          {performance}
          <SubjectList
            title="Who drove well"
            items={goodDrivers}
            info="Drivers who beat your own fleet average over the last 30 days."
            reason={story.goodDrivers?.why?.text || null}
            emptyTo={story.goodDrivers ? '/intelligence?tab=drivers' : null}
          />
          <SubjectList
            title="Who needs a word"
            items={needsWord.map((s) => ({
              ...s,
              to:
                s.to ||
                (s.subject === 'vehicle'
                  ? `/intelligence?tab=vehicles&vehicle=${encodeURIComponent(s.id)}`
                  : `/intelligence?tab=drivers&driver=${encodeURIComponent(s.id || '')}`),
            }))}
            info="Trucks and drivers whose behaviour dropped over the last 30 days."
            reason={story.needsWord?.why?.text || null}
            emptyTo={story.needsWord ? '/intelligence?tab=drivers' : null}
          />
        </div>
      </section>
    </div>
  );
}
