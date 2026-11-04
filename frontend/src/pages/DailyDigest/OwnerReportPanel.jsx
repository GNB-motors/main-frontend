import { useMemo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import DigestSkeleton from './components/DigestSkeleton';
import {
  DASH,
  briefSections,
  drillRoute,
  drillTarget,
  exceptionRows,
  formatDayLabel,
  formatFooterText,
  formatMoney,
  isToday,
  numberPairs,
  rowPairs,
  sectionFooter,
  sectionReason,
  sectionState,
  sectionTitle,
} from './ownerReportModel';

/**
 * The owner's day: the morning brief on top, the eight report sections under
 * it, and the two people lists below that.
 *
 * The rules this panel keeps:
 *   - a section is never missing: it is ok | empty | error, and it says which;
 *   - an unknown is "—" with the reason beside it, never a zero;
 *   - the good-driver and needs-attention lists are ALWAYS rendered — an empty
 *     one says "No one this time" instead of disappearing;
 *   - nothing developer-ish is printed: no drill codes, no raw keys, no ISO
 *     timestamps, no empty boxes stretched over half a screen.
 */

const STATE_LABEL = { ok: 'Measured', empty: 'Nothing yet', error: 'Failed' };

function RetryButton({ onRetry, label = 'Retry' }) {
  return (
    <button type="button" className="fo-text-link" onClick={onRetry}>
      {label} <RefreshCw size={14} />
    </button>
  );
}

function MorningBriefCard({ brief$, day }) {
  const brief = brief$.data;
  const sections = useMemo(() => briefSections(brief), [brief]);

  if (brief$.loading && !brief) {
    return (
      <section className="fo-card fo-owner-brief">
        <DigestSkeleton label="Loading the morning brief" />
      </section>
    );
  }

  if (brief$.error) {
    const forbidden = brief$.error?.status === 403;
    return (
      <section className="fo-card fo-owner-brief">
        <p className="fo-card-title">Morning brief</p>
        <p className="fo-owner-error">
          {forbidden ? 'Not available for your role' : "Couldn't load"} ·{' '}
          {forbidden ? null : <RetryButton onRetry={brief$.refetch} />}
        </p>
        <p className="fo-owner-note">
          {forbidden
            ? 'The morning brief is read by owners and managers only.'
            : brief$.error?.message || 'The morning brief could not be read.'}
        </p>
      </section>
    );
  }

  return (
    <section className="fo-card fo-owner-brief">
      <p className="fo-card-title">Morning brief</p>
      <p className="fo-owner-brief-total">
        <strong>{formatMoney(brief?.totalRupees)}</strong>
        <span> lost · {formatDayLabel(day)}</span>
      </p>
      {sections.length === 0 ? (
        <p className="fo-owner-note">Nothing was flagged for this day — no leak measured.</p>
      ) : (
        <div className="fo-money-table-wrap"><table className="fo-money-table">
          <thead><tr><th>Problem</th><th>Trucks</th><th>Amount</th></tr></thead>
          <tbody>{[...sections].sort((a, b) => (b.rupees ?? -1) - (a.rupees ?? -1)).map((section) => (
            <tr key={section.key}>
              <td><strong>{section.label}</strong><small>{section.suggestedAction}</small></td>
              <td>{section.vehicles.length ? <><span>{section.vehicles.slice(0, 3).map((v) => <span className="fo-extra-truck" key={v.registrationNumber}>{v.registrationNumber}{v.rupees != null ? ` · ${formatMoney(v.rupees)}` : ''}</span>)}</span>{section.vehicles.length > 3 ? <details><summary>Show all ({section.vehicles.length})</summary>{section.vehicles.slice(3).map((v) => <span className="fo-extra-truck" key={v.registrationNumber}>{v.registrationNumber}{v.rupees != null ? ` · ${formatMoney(v.rupees)}` : ''}</span>)}</details> : null}</> : DASH}</td>
              <td>{section.rupees == null ? DASH : formatMoney(section.rupees)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {brief?.disclaimer ? <p className="fo-owner-note">{brief.disclaimer}</p> : null}
    </section>
  );
}

const EXCEPTION_LINKS = { sos: '/alert-inbox', moneyTheft: '/intelligence?tab=fuel', idling: '/place-hub?tab=idling', stuckAtPlant: '/place-hub', etaSlipping: '/auto-trips', papersWaiting: '/expenses', documentsExpiring: '/vehicles/dashboard', broadcastNotAcknowledged: '/alert-inbox' };

function HeadlineTiles({ sections, brief, pendingDay }) {
  const byId = Object.fromEntries(sections.map((section) => [section.id, section.numbers || {}]));
  const fleet = byId.fleetNow || {};
  const work = byId.yesterdaysWork || {};
  const trend = byId.trend || {};
  const notCounted = pendingDay && work.trips === 0 && work.km === 0;
  const tiles = [
    { label: 'Moving now', value: fleet.moving },
    { label: 'Trips today', value: notCounted ? null : work.trips, delta: notCounted ? null : trend.tripsVsPrev7Pct, note: notCounted ? 'Not counted yet' : null },
    { label: 'km today', value: notCounted ? null : work.km, delta: notCounted ? null : trend.kmVsPrev7Pct, note: notCounted ? 'Not counted yet' : null },
    { label: '₹ lost today', value: brief?.totalRupees, money: true },
    { label: 'Trucks dark', value: fleet.dark },
  ];
  return <section className="fo-headline-tiles" aria-label="Daily key metrics">{tiles.map((tile) => (
    <div className="fo-headline-tile" key={tile.label}>
      <span>{tile.label}</span><strong>{tile.value == null ? DASH : tile.money ? formatMoney(tile.value) : Number(tile.value).toLocaleString('en-IN')}</strong>
      <small className={tile.delta == null ? '' : tile.delta >= 0 ? 'fo-delta-up' : 'fo-delta-down'}>{tile.note || (tile.delta == null ? '7-day comparison unavailable' : `${tile.delta >= 0 ? '↑' : '↓'} ${Math.abs(tile.delta)}% vs 7-day average`)}</small>
    </div>
  ))}</section>;
}

function ExceptionsBars({ section }) {
  const rows = exceptionRows(section?.rows);
  if (!section) return null;
  const max = rows[0]?.count || 1;
  return <section className="fo-card fo-exception-bars"><p className="fo-card-title">Exceptions</p>{rows.length ? rows.map((row) => (
    <Link key={row.key} className="fo-exception-row" to={EXCEPTION_LINKS[row.key] || '/alert-inbox'}><span>{row.label}</span><span className="fo-exception-track"><i style={{ width: `${row.count / max * 100}%` }} /></span><strong>{row.count}</strong></Link>
  )) : <p className="fo-owner-note">{sectionState(section) === 'error' ? 'Exceptions unavailable.' : 'No exceptions reported.'}</p>}</section>;
}

function ReportSection({ section, onRetry, isPendingDay }) {
  const state = sectionState(section);
  const numbers = useMemo(
    () => numberPairs(section?.numbers, { isPendingDay }),
    [section?.numbers, isPendingDay],
  );
  const isExceptions = section?.id === 'exceptions';
  const rows = useMemo(
    () => (isExceptions ? exceptionRows(section?.rows) : rowPairs(section?.rows)),
    [isExceptions, section?.rows],
  );
  const route = drillRoute(drillTarget(section));
  const title =
    section?.id === 'yesterdaysWork' && isPendingDay ? 'Today so far' : sectionTitle(section);
  const footer = formatFooterText(sectionFooter(section));

  return (
    <section className={`fo-card fo-owner-section fo-owner-section--${state}`}>
      <div className="fo-owner-section-head">
        <p className="fo-card-title">{title}</p>
        <span className={`fo-badge fo-tone--${state === 'ok' ? 'good' : state === 'error' ? 'act' : 'info'}`}>
          {STATE_LABEL[state]}
        </span>
      </div>

      {state === 'error' ? (
        <>
          <p className="fo-owner-error">
            Couldn&apos;t load · <RetryButton onRetry={onRetry} />
          </p>
          <p className="fo-owner-note">{section?.error || 'The section query failed.'}</p>
        </>
      ) : null}

      {state === 'empty' ? <p className="fo-owner-note">{sectionReason(section)}</p> : null}

      {state === 'ok' ? (
        <>
          <dl className="fo-kv">
            {numbers.map((pair) => (
              <div key={pair.key} className={pair.unknown ? 'is-unknown' : undefined}>
                <dt>{pair.label}</dt>
                <dd>
                  {pair.value}
                  {pair.note ? <span className="fo-owner-kv-note">{pair.note}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
          {rows.length ? (
            <ul className="fo-owner-rows">
              {rows.map((row) => (
                <li key={row.key}>
                  <span className="fo-owner-row-label">{row.label}</span>
                  {row.count != null ? (
                    <span className="fo-owner-row-count">{row.count}</span>
                  ) : null}
                  {row.note ? <span className="fo-owner-note">{row.note}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {state !== 'error' ? (
        <div className="fo-owner-foot">
          {route ? (
            <Link className="fo-owner-open" to={route}>
              Open →
            </Link>
          ) : null}
          {footer ? (
            <details className="fo-owner-how">
              <summary>How we know</summary>
              <p className="fo-owner-note">{footer}</p>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function SubjectList({ title, note, items }) {
  return (
    <section className="fo-card fo-owner-people-card">
      <p className="fo-card-title">{title}</p>
      {items.length === 0 ? (
        <p className="fo-owner-empty">No one this time</p>
      ) : (
        <ul className="fo-owner-people-list">
          {items.map((item) => (
            <li key={item.id || item.name}>
              <span className="fo-owner-row-label">{item.name || item.id || '—'}</span>
              <span className="fo-owner-note">{item.headline || item.grade || ''}</span>
              {item.score != null ? (
                <span className="fo-owner-people-score">{item.score}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="fo-owner-note">{note}</p> : null}
    </section>
  );
}

export default function OwnerReportPanel({ day, digest }) {
  const brief$ = useApi((signal) => fleetViewService.getMorningBrief({ date: day, signal }), [day]);
  const report$ = useApi((signal) => fleetViewService.getOwnerReport({ day, signal }), [day]);
  const isPendingDay = useMemo(() => isToday(day), [day]);

  const sections = Array.isArray(report$.data?.sections) ? report$.data.sections : [];
  const untracked = sections.filter((s) => ['moneyIn', 'people'].includes(s.id) && sectionState(s) === 'empty');
  const detailed = sections.filter((s) => s.id !== 'exceptions' && !untracked.includes(s));
  const goodDrivers = Array.isArray(digest?.goodDrivers) ? digest.goodDrivers : [];
  const needsAttention = Array.isArray(digest?.needsAttention) ? digest.needsAttention : [];

  return (
    <section className="fo-panel fo-owner" aria-labelledby="fo-owner-title">
      <div className="fo-section-head">
        <div>
          <div className="fo-eyebrow">Owner&apos;s report</div>
          <h2 id="fo-owner-title">Aaj ka hisaab</h2>
          <p>
            Eight sections for {formatDayLabel(day)}. Each one says whether it was measured, whether
            it was empty, or whether it failed — never a silent zero.
          </p>
        </div>
      </div>

      <HeadlineTiles sections={sections} brief={brief$.data} pendingDay={isPendingDay} />
      <MorningBriefCard brief$={brief$} day={day} />
      <ExceptionsBars section={sections.find((s) => s.id === 'exceptions')} />
      {untracked.length ? <p className="fo-untracked">Not tracked yet: {untracked.map((s) => s.id === 'moneyIn' ? 'Money in (SAP freight)' : 'People').join(', ')}</p> : null}

      {report$.loading && !report$.data ? (
        <div className="fo-owner-grid">
          <DigestSkeleton label="Loading the owner's report" />
        </div>
      ) : report$.error ? (
        <div className="fo-owner-grid">
          <section className="fo-card fo-owner-section fo-owner-section--error">
            <div className="fo-owner-section-head">
              <p className="fo-card-title">Owner&apos;s report</p>
              <span className="fo-badge fo-tone--act">
                <AlertTriangle size={13} /> Failed
              </span>
            </div>
            <p className="fo-owner-error">
              Couldn&apos;t load · <RetryButton onRetry={report$.refetch} />
            </p>
            <p className="fo-owner-note">{report$.error?.message || 'The report could not be read.'}</p>
          </section>
        </div>
      ) : (
        <details className="fo-report-details"><summary>More report details</summary><div className="fo-owner-grid">
          {detailed.map((section) => (
            <ReportSection
              key={section?.id || section?.title}
              section={section}
              onRetry={report$.refetch}
              isPendingDay={isPendingDay}
            />
          ))}
        </div></details>
      )}

      <details className="fo-report-details"><summary>Driver insights</summary><div className="fo-owner-people">
        <SubjectList
          title="Who drove well"
          items={goodDrivers}
          note="Drivers who beat your own fleet average over the last 30 days."
        />
        <SubjectList
          title="Who needs a word"
          items={needsAttention}
          note="Trucks and drivers whose behaviour dropped over the last 30 days."
        />
      </div></details>
    </section>
  );
}
