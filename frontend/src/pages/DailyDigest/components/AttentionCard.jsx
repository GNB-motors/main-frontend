import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { formatMoment } from '../ownerReportModel';
import digestDay from '../digestDay';
import attentionCopy from '../attentionCopy';
import DigestLink from '../DigestLink';
import DigestSkeleton from './DigestSkeleton';
import InfoTip from '../../../components/redesign/InfoTip';

/** Open queues read as they are now, whatever day is picked. */
const LIVE_KINDS = new Set(['papersWaiting', 'documentsExpiring', 'broadcastNotAcknowledged']);

/**
 * Where each count is handled. A day event opens its page on the chosen day
 * (DigestLink carries the date); an open queue opens as it is now — it holds
 * earlier days too, so a date would hide some of its items.
 */
const DESTINATION = {
  sos: '/alert-inbox?inboxView=INCIDENTS',
  moneyTheft: '/intelligence?tab=fuel',
  fuelOrRoute: '/intelligence?tab=fuel',
  routeDeviations: '/intelligence?tab=detours',
  idling: '/intelligence?tab=idling&idleSubview=instances',
  stuckAtPlant: '/auto-trips?tab=history&minDwellMin=180',
  papersWaiting: '/khata-ledger?tab=all&expenseStatus=PENDING',
  documentsExpiring: '/vehicles/dashboard?docFilter=EXPIRING_SOON',
  broadcastNotAcknowledged: '/alert-inbox?inboxStatus=OPEN',
};

/**
 * The rows to draw. A current server sends them ready (attentionVersion 2);
 * an older one sends plain counts, drawn the same way.
 */
function rowsOf(section) {
  const rows = Array.isArray(section?.rows) ? section.rows.filter((r) => r && r.kind) : [];
  if (section?.numbers?.attentionVersion === 2) return rows;
  return rows.map((r) => {
    const unmeasured =
      r.count == null ||
      String(r.note || '')
        .trim()
        .toLowerCase() === 'not built yet';
    const count = unmeasured ? null : Number(r.count);
    return {
      ...r,
      // Its "theft" count also held route deviations: say both, not one.
      kind: r.kind === 'moneyTheft' ? 'fuelOrRoute' : r.kind,
      count,
      period: LIVE_KINDS.has(r.kind) ? 'live' : 'day',
      state: unmeasured ? 'unmeasured' : count > 0 ? 'ok' : 'empty',
    };
  });
}

function Review({ row, day }) {
  const label = attentionCopy.label(row.kind);
  const to = DESTINATION[row.kind];
  if (!to) return <span className="db-attention-none" />;
  const props = {
    className: 'db-attention-button',
    'aria-label': `Review ${label}`,
  };
  const body = (
    <>
      Review <ArrowUpRight size={13} aria-hidden="true" />
    </>
  );
  return row.period === 'live' ? (
    <Link to={to} {...props}>
      {body}
    </Link>
  ) : (
    <DigestLink to={to} day={day} {...props}>
      {body}
    </DigestLink>
  );
}

function Category({ row, day }) {
  if (row.state === 'unmeasured') return null;
  const failed = row.state === 'error';
  if (!failed && row.count === 0) {
    return <li className="db-attention-clear">{attentionCopy.none(row.kind, row.period)}</li>;
  }
  return (
    <li className="db-attention-row">
      <div>
        <h4>{attentionCopy.label(row.kind)}</h4>
        <p>{failed ? attentionCopy.failed : attentionCopy.about(row)}</p>
      </div>
      <div className="db-attention-count">
        {failed || row.count == null ? '—' : row.count.toLocaleString('en-IN')}
        <small>{attentionCopy.unit(row.kind, row.count)}</small>
      </div>
      <Review row={row} day={day} />
    </li>
  );
}

export default function AttentionCard({ section, loading, day }) {
  const rows = rowsOf(section);
  const liveReadAt = rows.find((r) => r.period === 'live')?.readAt;
  const group = (period) =>
    rows.filter((r) => r.period === period).map((r) => <Category key={r.kind} row={r} day={day} />);
  return (
    <section className="db-card db-exceptions" aria-label="Needs attention">
      <header className="db-card-head">
        <h3>Needs attention</h3>
        <InfoTip text={attentionCopy.info} label="About Needs attention" />
      </header>
      {loading ? (
        <DigestSkeleton label="Loading" />
      ) : !rows.length ? (
        <p className="db-empty-line">Nothing needs attention.</p>
      ) : (
        <>
          <div className="db-attention-group">
            <h4 className="db-attention-group-title">On {digestDay.short(day)}</h4>
            <ul className="db-attention-rows">{group('day')}</ul>
          </div>
          <div className="db-attention-group">
            <h4 className="db-attention-group-title">
              Still open now <span className="db-live-tag">Live</span>
            </h4>
            <p className="db-muted">
              Includes earlier days{liveReadAt ? ` · updated ${formatMoment(liveReadAt)}` : ''}
            </p>
            <ul className="db-attention-rows">{group('live')}</ul>
          </div>
          <p className="db-foot-line">{attentionCopy.notTracked}</p>
        </>
      )}
    </section>
  );
}
