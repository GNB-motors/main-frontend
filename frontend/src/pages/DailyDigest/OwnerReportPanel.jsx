import { useMemo, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import Link from './DigestLink';
import { digestSubjectDestination } from './digestDestination';
import useOwnerReport from './useOwnerReport';
import InfoTip from '../../components/redesign/InfoTip';
import sectionCopy from './sectionCopy';
import DigestSkeleton from './components/DigestSkeleton';
import digestExplain from './digestExplain';
import digestDay from './digestDay';
import TrendBody from './components/TrendBody';
import AttentionCard from './components/AttentionCard';
import {
  DASH,
  drillRoute,
  drillTarget,
  isToday,
  numberPairs,
  partialLabel,
  sectionState,
  sectionTitle,
} from './ownerReportModel';
import {
  NUMBER_SECTIONS,
  attentionGroups,
  buildKpis,
  count,
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

/**
 * `liveNote` marks a card read live on a past day: it shows the fleet as it is
 * now, so it says so ("Live · not for 10 Nov") instead of passing for
 * that day's numbers.
 */
function Card({
  title,
  info,
  infoBasis = null,
  meta,
  action,
  liveNote = null,
  className = '',
  children,
}) {
  return (
    <section className={`db-card ${className}`}>
      <header className="db-card-head">
        <h3 title={title}>{title}</h3>
        {info ? <InfoTip text={info} basis={infoBasis} label={`About ${title}`} /> : null}
        {liveNote ? (
          <span className="db-live-tag" title={`Live: shows the fleet now, ${liveNote}`}>
            Live
          </span>
        ) : null}
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

function TruckChips({ trucks, day, kind }) {
  const [open, setOpen] = useState(false);
  if (!trucks.length) return <p className="db-muted">No truck named for this one.</p>;
  const shown = open ? trucks : trucks.slice(0, CHIP_LIMIT);
  return (
    <ul className="db-chips">
      {shown.map((truck, i) => (
        <li key={`${truck.reg}-${i}`}>
          <Link
            className="db-chip"
            day={day}
            to={
              kind === 'excessIdling'
                ? `/intelligence?tab=idling&vehicle=${encodeURIComponent(truck.reg)}`
                : truckLink(truck.reg)
            }
            title={truck.detail || undefined}
          >
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
  const categorySum = rows.reduce((sum, row) => sum + (row.rupees ?? 0), 0);
  // Explain the server's per-truck maximum without changing its valuation.
  const overlap =
    brief?.totalRule && brief.totalRupees != null
      ? Math.round((categorySum - brief.totalRupees) * 100) / 100
      : null;

  if (brief$.loading && !brief) {
    return (
      <Card title="Extra fuel costs to review" className="db-leak">
        <DigestSkeleton label="Loading the morning brief" />
      </Card>
    );
  }
  if (brief$.error) {
    const forbidden = brief$.error?.status === 403;
    return (
      <Card title="Extra fuel costs to review" className="db-leak">
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
      title="Extra fuel costs to review"
      className="db-leak"
      info={digestExplain.extraFuelCost()}
      meta={isPendingDay ? 'So far today' : null}
    >
      <div className="db-leak-summary">
        <div className="db-leak-total">
          <strong>{rupees(brief?.totalRupees)}</strong>
          <span>
            {brief?.totalRupees == null
              ? 'Not estimated for this day'
              : brief?.partial
                ? 'Calculated loss · Incomplete'
                : 'estimated extra fuel cost for this period'}
          </span>
        </div>
        {brief?.partial ? <span className="db-coverage-badge">Incomplete data</span> : null}
      </div>
      {overlap > 0 ? (
        <div className="db-leak-math" aria-label="How the fuel cost total is calculated">
          <div>
            <span>Combined categories</span>
            <strong>{rupees(categorySum)}</strong>
          </div>
          <div>
            <span>Counted in both · removed once</span>
            <strong>−{rupees(overlap)}</strong>
          </div>
          <div className="db-leak-math-total">
            <span>Estimated extra fuel cost</span>
            <strong>{rupees(brief.totalRupees)}</strong>
          </div>
          <p>
            For each truck, the larger of extra diesel cost and idling cost is counted. The same
            fuel is never added twice.
          </p>
        </div>
      ) : null}
      {brief?.partial ? (
        <p className="db-muted" role="status">
          {brief.coverageNote}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="db-empty-line">No extra fuel costs were flagged for this day.</p>
      ) : (
        <ol className="db-leak-list">
          {rows.map((row, i) => (
            <li key={row.key} className="db-leak-row">
              <div className="db-leak-row-head">
                <span className={`db-leak-key db-leak-seg--${i}`} aria-hidden="true" />
                <h4>{row.label}</h4>
                <strong className="db-leak-amt">
                  {row.rupees == null ? DASH : rupees(row.rupees)}
                </strong>
              </div>
              <p className="db-leak-preview-label">
                Top trucks · amounts are part of this category
              </p>
              <TruckChips trucks={row.trucks} />
              <details className="db-leak-details">
                <summary>Why flagged{row.partial ? ' · Incomplete data' : ''}</summary>
                {row.comparedTo ? <p className="db-leak-compare">{row.comparedTo}</p> : null}
                {row.action ? <p className="db-leak-action">{row.action}</p> : null}
                {row.partial ? (
                  <p className="db-muted">
                    Incomplete · {row.coverageNote}
                    {row.reasons ? ` ${row.reasons}` : ''}
                  </p>
                ) : null}
              </details>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ── Waiting on you ──────────────────────────────────────────────────── */

function WaitingCard({ items, pending, note, day }) {
  if (!items) return null;
  return (
    <Card
      title="Waiting on you"
      className="db-waiting"
      info={note}
      liveNote={digestDay.notFor(day)}
    >
      {pending ? (
        <DigestSkeleton label="Loading actions" />
      ) : !items.length ? (
        <p className="db-empty-line">Nothing is waiting on you.</p>
      ) : (
        <ul className="db-rows">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                className={`db-row ${item.count === 0 ? 'is-quiet' : ''}`}
                to={item.to}
                day={day}
              >
                <i
                  className={`db-dot db-dot--${item.tone === 'act' ? 'act' : item.tone === 'watch' ? 'watch' : 'quiet'}`}
                />
                <span className="db-row-main">
                  <span className="db-row-title">{item.title}</span>
                  {item.description ? <span className="db-row-sub">{item.description}</span> : null}
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

/* ── Trucks needing attention ────────────────────────────────────────── */

const DARK_LIMIT = 10;

function TrucksCard({ groups, live, reconnect, accountsSummary, day }) {
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
      liveNote={digestDay.notFor(day)}
      action={
        <Link className="db-link" to="/live-tracking">
          Live map <ArrowUpRight size={13} />
        </Link>
      }
    >
      {live?.isLoading && !dark.length ? (
        <DigestSkeleton label="Loading live positions" />
      ) : nothing ? (
        <p className="db-empty-line">No trucks need attention from the available live feeds.</p>
      ) : (
        <div className="db-groups">
          {dark.length ? (
            <div className="db-group">
              <p className="db-group-title">
                <i className="db-dot db-dot--watch" />
                <strong>{dark.length} dark now</strong>
                <span>
                  {darkRange ? `silent ${darkRange}` : 'no recent signal'} · live positions
                </span>
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
                    <Link
                      className="db-chip db-chip--more"
                      to="/auto-trips?tab=history&minDwellMin=180"
                      day={day}
                    >
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
                <span>no position on record · daily report</span>
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
/** Sections the server always reads as they are now, whatever the day. */
const LIVE_SECTIONS = new Set(['fleetNow', 'dataHealth']);

function ReportSection({ section, onRetry, isPendingDay, builtAt, day }) {
  const state = sectionState(section);
  const pairs = useMemo(
    () =>
      numberPairs(section?.numbers, {
        isPendingDay,
        // The earlier money-out payload put auto-confirmed toll charges in
        // these expense fields. Keep their display names accurate until the
        // separate toll/bill payload is available.
        legacyTollLabels:
          section?.id === 'moneyOut' &&
          section.numbers?.tollCount == null &&
          section.numbers?.tollInr == null &&
          !Object.hasOwn(section.numbers || {}, 'expenseRecordedCount'),
      }),
    [section?.id, section?.numbers, isPendingDay],
  );
  // The partial flag is not one of the numbers: it is a note on the section.
  const partial = partialLabel(section?.numbers);
  // Trend repeats the day's trips and km; "Today so far" already shows them.
  const shown = section?.id === 'trend' ? pairs.filter((p) => !TREND_REPEATS.has(p.key)) : pairs;
  const known = shown.filter((p) => !p.unknown);
  // Unknowns are grouped by their reason: one line each, never a column of dashes.
  const unknownGroups = [];
  for (const pair of shown.filter((p) => p.unknown)) {
    const reason = pair.note || 'Not available yet';
    const group = unknownGroups.find((g) => g.reason === reason);
    if (group) group.labels.push(pair.label);
    else unknownGroups.push({ reason, labels: [pair.label] });
  }
  const route = drillRoute(drillTarget(section));
  const title =
    section?.id === 'yesterdaysWork'
      ? digestDay.workTitle(day)
      : section?.id === 'fleetNow'
        ? isPendingDay && builtAt
          ? `Fleet at ${builtAt}`
          : 'Fleet now'
        : sectionTitle(section);
  // Read live whatever the day: on a past day they say so.
  const liveNote = LIVE_SECTIONS.has(section?.id) ? digestDay.notFor(day) : null;
  return (
    <Card
      title={title}
      className={`db-report db-report--${state}`}
      info={sectionCopy.about(section)}
      infoBasis={sectionCopy.updated(section)}
      liveNote={liveNote}
      action={
        route && state !== 'error' ? (
          <Link className="db-link" to={route} day={day}>
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
          <span className="db-badge">Nothing recorded</span>
          <span className="db-empty-text">
            {sectionCopy.empty(section, { pending: isPendingDay })}
          </span>
        </p>
      ) : section?.id === 'trend' ? (
        <TrendBody numbers={section.numbers} day={day} pending={isPendingDay} />
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
          {partial ? (
            <p className="db-foot-line">
              <span className="db-badge">{partial}</span> Some distance was not measured.
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}

/* ── People ──────────────────────────────────────────────────────────── */

function SubjectList({ title, info, items, reason, emptyTo, day, grade, context }) {
  return (
    <Card title={title} className="db-people" info={info}>
      {items.length === 0 ? (
        <div className="db-people-empty">
          <p className="db-empty-line">No one this time</p>
          {reason ? <p className="db-muted">{reason}</p> : null}
          {emptyTo ? (
            <Link
              className="db-link"
              to={digestSubjectDestination({ to: emptyTo }, day, grade, context)}
            >
              See the drivers <ArrowUpRight size={13} />
            </Link>
          ) : null}
        </div>
      ) : (
        <ol className="db-people-list">
          {items.map((item, i) => (
            <li key={item.id || item.name || i}>
              <Link to={digestSubjectDestination(item, day, grade, context)}>
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
          <MoneyLeakCard brief$={brief$} isPendingDay={isPendingDay} day={day} />
          <WaitingCard
            items={attention}
            pending={attentionPending}
            note={attentionNote}
            day={day}
          />
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
            <AttentionCard
              key={`${day}:${report$.data?.generatedAt || ''}`}
              day={day}
              section={byId.exceptions}
              loading={reportLoading}
              onRetry={report$.refetch}
              isPendingDay={isPendingDay}
            />
          )}
          <TrucksCard
            day={day}
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
            text={untracked.map((s) => `${sectionTitle(s)}: ${sectionCopy.empty(s)}`).join(' · ')}
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
                day={day}
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
            day={day}
            grade="EXCELLENT"
            context={story.goodDrivers}
            title="Who drove well"
            items={goodDrivers}
            info={digestExplain.goodDrivers()}
            reason={story.goodDrivers?.why?.text || null}
            emptyTo={
              story.goodDrivers ? story.goodDrivers.link?.to || '/intelligence?tab=drivers' : null
            }
          />
          <SubjectList
            day={day}
            grade="FALLING"
            context={story.needsWord}
            title="Who needs a word"
            items={needsWord.map((s) => ({
              ...s,
              to:
                s.to ||
                (s.subject === 'vehicle'
                  ? `/intelligence?tab=vehicles&vehicle=${encodeURIComponent(s.id)}`
                  : `/intelligence?tab=drivers&driver=${encodeURIComponent(s.id || '')}`),
            }))}
            info={digestExplain.needsWord()}
            reason={story.needsWord?.why?.text || null}
            emptyTo={
              story.needsWord ? story.needsWord.link?.to || '/intelligence?tab=drivers' : null
            }
          />
        </div>
      </section>
    </div>
  );
}
