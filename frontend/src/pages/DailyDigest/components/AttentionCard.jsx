import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  Check,
  Clock3,
  FileText,
  Fuel,
  MapPin,
  Route,
  ShieldAlert,
} from 'lucide-react';
import { formatMoment } from '../ownerReportModel';
import digestDay from '../digestDay';
import attentionCopy from '../attentionCopy';
import DigestLink from '../DigestLink';
import DigestSkeleton from './DigestSkeleton';
import InfoTip from '../../../components/redesign/InfoTip';

/** Open queues read as they are now, whatever day is picked. */
const LIVE_KINDS = new Set(['papersWaiting', 'documentsExpiring', 'broadcastNotAcknowledged']);
const ICONS = {
  moneyTheft: Fuel,
  fuelOrRoute: Fuel,
  routeDeviations: Route,
  idling: Clock3,
  stuckAtPlant: MapPin,
  papersWaiting: FileText,
  documentsExpiring: FileText,
  broadcastNotAcknowledged: Bell,
  sos: ShieldAlert,
};

/**
 * Where each count is handled. A day event opens its page on the chosen day
 * (DigestLink carries the date); an open queue opens as it is now — it holds
 * earlier days too, so a date would hide some of its items.
 */
const DESTINATION = {
  sos: '/alert-inbox?inboxView=INCIDENTS',
  // No page lists the daily fuel check's flagged trucks: possible fuel loss
  // names them as chips, each opening that truck's Fuel tab (TruckList).
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

/** The flagged trucks, with the selected day's fuel checks. */
function TruckList({ row, day }) {
  const trucks = (row.rows || []).filter((t) => t.registrationNumber);
  if (!trucks.length) return <span className="db-attention-none" />;
  const more = Number.isFinite(row.count) ? row.count - trucks.length : 0;
  return (
    <ul className="db-chips db-chips--tight db-attention-trucks">
      {trucks.map((t) => (
        <li key={t.id || t.registrationNumber}>
          <DigestLink
            className="db-chip"
            day={day}
            to={`/intelligence?tab=fuel&fuelView=drain&vehicle=${encodeURIComponent(t.registrationNumber)}`}
          >
            <span className="db-chip-reg">{t.registrationNumber}</span>
            {t.missingL != null ? (
              <span className="db-chip-detail">{`${t.missingL} L missing`}</span>
            ) : null}
          </DigestLink>
        </li>
      ))}
      {more > 0 ? <li className="db-muted">{`+${more} more`}</li> : null}
    </ul>
  );
}

function Category({ row, day }) {
  if (row.state === 'unmeasured') return null;
  // Not checked yet (the day's fuel check runs after the day ends): never "none".
  if (row.state === 'pending') {
    return <li className="db-attention-clear">{attentionCopy.pending(row.kind)}</li>;
  }
  const failed = row.state === 'error';
  if (!failed && row.count === 0) {
    return (
      <li className="db-attention-clear">
        <Check size={13} aria-hidden="true" />
        {attentionCopy.none(row.kind, row.period)}
      </li>
    );
  }
  // Possible fuel loss has no page to review on: its trucks are listed under
  // it instead, so the row has no Review column to leave empty.
  const trucksRow = row.kind === 'moneyTheft';
  const Icon = ICONS[row.kind] || Bell;
  return (
    <li className={trucksRow ? 'db-attention-row db-attention-row--trucks' : 'db-attention-row'}>
      <div className="db-attention-topic">
        <span className="db-attention-icon" aria-hidden="true">
          <Icon size={16} />
        </span>
        <div>
          <h4>{attentionCopy.label(row.kind)}</h4>
          <p>{failed ? attentionCopy.failed : attentionCopy.about(row)}</p>
        </div>
      </div>
      <div className="db-attention-count">
        {failed || row.count == null ? '—' : row.count.toLocaleString('en-IN')}
        <small>{attentionCopy.unit(row.kind, row.count)}</small>
      </div>
      {trucksRow ? null : <Review row={row} day={day} />}
      {trucksRow && !failed ? <TruckList row={row} day={day} /> : null}
    </li>
  );
}

export default function AttentionCard({ section, loading, day, idleCostRecorded = false }) {
  const rows = rowsOf(section);
  const liveReadAt = rows.find((r) => r.period === 'live')?.readAt;
  const group = (period) => {
    const inGroup = rows.filter((r) => r.period === period && r.state !== 'unmeasured');
    const separateIdleCoverage =
      period === 'day' &&
      idleCostRecorded &&
      inGroup.some((row) => row.kind === 'idling' && row.count === 0);
    const quiet = (row) => row.count === 0 && row.state !== 'error' && row.state !== 'pending';
    return (
      <>
        <ul className="db-attention-rows">
          {inGroup
            .filter((r) => !quiet(r))
            .map((r) => (
              <Category key={r.kind} row={r} day={day} />
            ))}
        </ul>
        {inGroup.some(quiet) ? (
          <ul className="db-attention-quiet">
            {inGroup.filter(quiet).map((r) =>
              r.kind === 'idling' && separateIdleCoverage ? (
                <li key={r.kind} className="db-muted">
                  No stops met the alert duration. The fuel estimate can include shorter idles.
                </li>
              ) : (
                <Category key={r.kind} row={r} day={day} />
              ),
            )}
          </ul>
        ) : null}
      </>
    );
  };
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
            <h4 className="db-attention-group-title">
              On {digestDay.short(day)}
              <span>Selected day</span>
            </h4>
            {group('day')}
          </div>
          <div className="db-attention-group">
            <h4 className="db-attention-group-title">
              Still open now <span className="db-live-tag">Live</span>
            </h4>
            <p className="db-muted">
              Includes earlier days{liveReadAt ? ` · updated ${formatMoment(liveReadAt)}` : ''}
            </p>
            {group('live')}
          </div>
          <p className="db-foot-line">{attentionCopy.notTracked}</p>
        </>
      )}
    </section>
  );
}
