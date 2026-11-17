import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, X } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { fleetViewService } from '../../../services/fleetViewService';
import { formatHours, formatMoment, formatMoney, humanCode } from '../ownerReportModel';
import digestDay from '../digestDay';
import DigestSkeleton from './DigestSkeleton';
import InfoTip from '../../../components/redesign/InfoTip';

const ATTENTION_KINDS = {
  sos: { label: 'SOS and breakdowns', unit: 'incidents' },
  moneyTheft: { label: 'Suspected fuel loss', unit: 'flags' },
  routeDeviations: { label: 'Route deviations', unit: 'events' },
  idling: { label: 'Long idling', unit: 'events' },
  stuckAtPlant: { label: 'Long plant visits', unit: 'visits' },
  papersWaiting: { label: 'Expense bills awaiting review', unit: 'bills' },
  documentsExpiring: { label: 'Documents needing renewal', unit: 'documents' },
  broadcastNotAcknowledged: { label: 'Alerts awaiting acknowledgement', unit: 'alerts' },
  etaSlipping: { label: 'ETA delays', unit: 'events' },
};

const unitFor = (kind, count) =>
  count === 1 ? ATTENTION_KINDS[kind].unit.slice(0, -1) : ATTENTION_KINDS[kind].unit;

function detailFor(row) {
  const n = row.numbers || {};
  if (row.kind === 'idling') {
    const parts = [`Engine on · at least ${n.thresholdMin ?? '—'} min per event`];
    if (Number.isFinite(n.verifiedIdleMinutes))
      parts.push(`${formatHours(n.verifiedIdleMinutes / 60)} recorded`);
    if (n.verifiedIdleMinutesUnknown)
      parts.push(`${n.verifiedIdleMinutesUnknown} unfinished durations excluded`);
    if (n.unknownEngineState)
      parts.push(`${n.unknownEngineState} other events have unknown engine state`);
    return parts.join(' · ');
  }
  if (row.kind === 'moneyTheft') return 'Fuel balance flags to investigate; theft is not confirmed';
  if (row.kind === 'routeDeviations') return 'Detected on this day; includes reviewed events';
  if (row.kind === 'stuckAtPlant')
    return 'Visits starting on this day above the site’s usual waiting time';
  if (row.kind === 'sos') return 'Reported on this day; includes resolved incidents';
  if (row.kind === 'documentsExpiring')
    return 'Recorded documents expired or due in the next 7 days';
  return 'Includes items from earlier days';
}

function evidence(row, kind) {
  if (kind === 'moneyTheft')
    return `Missing: ${row.missingL == null ? 'unknown' : `${row.missingL} L`} · billed: ${row.billedL == null ? 'unknown' : `${row.billedL} L`} · measured burn: ${row.burnedL == null ? 'unknown' : `${row.burnedL} L`}`;
  if (kind === 'routeDeviations')
    return `${row.corridor || 'Route not named'} · extra distance: ${row.extraKm == null ? 'unknown' : `${row.extraKm} km`} · ${humanCode(row.status)}`;
  if (kind === 'idling')
    return `${row.minutes == null ? 'Duration unfinished' : `${formatHours(row.minutes / 60)} recorded`} · engine on`;
  if (kind === 'stuckAtPlant')
    return `${row.site} · ${formatHours(row.stationaryMinutes / 60)} waiting · threshold ${formatHours(row.usualMaxMinutes / 60)} (${row.thresholdSource === 'LEARNED' ? 'learned at this site' : 'default'}) · ${row.status === 'DEPARTED' ? 'Departure recorded' : 'Departure not confirmed'}`;
  if (kind === 'sos') return `${humanCode(row.type)} · ${humanCode(row.status)}`;
  if (kind === 'papersWaiting') return `${humanCode(row.category)} · ${formatMoney(row.amount)}`;
  if (kind === 'documentsExpiring')
    return `${humanCode(row.docType)} · ${row.expired ? 'Expired' : 'Due'} ${formatMoment(row.expiryDate, { withTime: false })}`;
  return row.wants || row.condition || 'Review alert';
}

function ReviewList({ kind, day, initial, onClose, onUpdate }) {
  const [page, setPage] = useState(1);
  const panelRef = useRef(null);
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView?.({ block: 'start' });
  }, [kind]);
  const review$ = useApi(
    (signal) => fleetViewService.getAttentionReview({ day, kind, page, signal }),
    [day, kind, page],
    { scopeKey: `${day}:${kind}:${page}` },
  );
  const result = review$.data;
  const failed = review$.error || result?.state === 'error';
  // The freshly read count is shown alongside the evidence. The summary is
  // updated explicitly when the user returns; there is no silent mismatch.
  return (
    <section
      ref={panelRef}
      className="db-attention-review"
      aria-label={`Review ${ATTENTION_KINDS[kind].label}`}
    >
      <header className="db-attention-review-head">
        <div>
          <h4 ref={headingRef} tabIndex={-1}>
            {ATTENTION_KINDS[kind].label}
          </h4>
          <p className="db-muted">
            {initial.period === 'live'
              ? 'Open now · includes earlier days'
              : `${digestDay.short(day)} · IST`}
          </p>
        </div>
        <button
          type="button"
          className="db-attention-button"
          onClick={() => {
            if (result && !failed) onUpdate(result);
            onClose();
          }}
          aria-label="Close review"
        >
          <X size={16} />
        </button>
      </header>
      {review$.loading ? (
        <DigestSkeleton label="Loading matching records" />
      ) : failed ? (
        <p className="db-error" role="alert">
          Couldn&apos;t load these records.{' '}
          <button className="db-link" type="button" onClick={review$.refetch}>
            Retry
          </button>
        </p>
      ) : result ? (
        <>
          <p className="db-attention-read" aria-live="polite">
            {result.count == null
              ? 'Not tracked yet'
              : `${result.count.toLocaleString('en-IN')} ${unitFor(kind, result.count)}`}{' '}
            · Read {formatMoment(result.readAt)}
          </p>
          {result.count !== initial.count ? (
            <p className="db-muted">
              The count changed since the card was read. These are the latest matching records.
            </p>
          ) : null}
          <ul className="db-attention-records">
            {(result.rows || []).map((row) => (
              <li key={row.id}>
                <div className="db-attention-record-title">
                  {row.registrationNumber ? (
                    <Link to={`/vehicles/${encodeURIComponent(row.registrationNumber)}`}>
                      {row.registrationNumber}
                    </Link>
                  ) : (
                    <strong>
                      {row.subject ||
                        row.title ||
                        row.incidentNumber ||
                        humanCode(row.entityType) ||
                        'Recorded item'}
                    </strong>
                  )}
                  {row.at ? <time dateTime={row.at}>{formatMoment(row.at)}</time> : null}
                </div>
                <p>{evidence(row, kind)}</p>
              </li>
            ))}
          </ul>
          {result.count === 0 ? <p className="db-muted">No matching records.</p> : null}
          {result.totalPages > 1 ? (
            <nav className="db-attention-pages" aria-label="Review pages">
              <button
                type="button"
                className="db-attention-button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {result.totalPages}
              </span>
              <button
                type="button"
                className="db-attention-button"
                disabled={page >= result.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </nav>
          ) : null}
          {kind === 'broadcastNotAcknowledged' ? (
            <Link className="db-link" to="/alert-inbox?inboxStatus=OPEN">
              Open inbox to acknowledge alerts
            </Link>
          ) : null}
          {kind === 'papersWaiting' ? (
            <Link className="db-link" to="/khata-ledger?tab=all&expenseStatus=PENDING">
              Open expense reviews
            </Link>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Category({ row, onReview }) {
  const meta = ATTENTION_KINDS[row.kind];
  if (!meta || row.state === 'unmeasured') return null;
  const failed = row.state === 'error';
  if (!failed && row.count === 0) {
    if (row.kind === 'sos')
      return (
        <li className="db-attention-clear">No SOS or breakdown incidents recorded for this day.</li>
      );
    return (
      <li className="db-attention-clear">
        No {meta.label.toLowerCase()} found
        {row.kind === 'idling' && row.numbers?.unknownEngineState
          ? ` with verified engine on · ${row.numbers.unknownEngineState} events have unknown engine state`
          : ''}
        .
      </li>
    );
  }
  return (
    <li className="db-attention-row">
      <div>
        <h4>{meta.label}</h4>
        <p>{failed ? 'Could not load this category' : detailFor(row)}</p>
      </div>
      <div className="db-attention-count">
        {failed || row.count == null ? '—' : row.count.toLocaleString('en-IN')}
        <small>{unitFor(row.kind, row.count)}</small>
      </div>
      {failed || row.count > 0 ? (
        <button
          type="button"
          className="db-attention-button"
          onClick={(event) => onReview(row, event.currentTarget)}
          aria-label={`${failed ? 'Retry' : 'Review'} ${meta.label}`}
        >
          {failed ? 'Retry' : 'Review'}
        </button>
      ) : (
        <span className="db-attention-none">None found</span>
      )}
    </li>
  );
}

export default function AttentionCard({ section, loading, onRetry, day }) {
  const [selected, setSelected] = useState(null);
  const [overrides, setOverrides] = useState({});
  const triggerRef = useRef(null);
  const openReview = (row, trigger) => {
    triggerRef.current = trigger;
    setSelected(row);
  };
  const modern = section?.numbers?.attentionVersion === 2;
  const rows = modern ? (section.rows || []).map((r) => overrides[r.kind] || r) : [];
  const liveReadAt = rows.find((r) => r.period === 'live')?.readAt;
  return (
    <section className="db-card db-exceptions" aria-label="Needs attention">
      <header className="db-card-head">
        <h3>Needs attention</h3>
        <InfoTip
          text="Day events and items still open now are shown separately. A truck can have several events. Review opens the records behind each count."
          label="About Needs attention"
        />
      </header>
      {loading ? (
        <DigestSkeleton label="Loading attention items" />
      ) : !modern ? (
        <p className="db-error">
          Attention details are unavailable.{' '}
          <button type="button" className="db-link" onClick={onRetry}>
            Retry <RefreshCw size={13} />
          </button>
        </p>
      ) : (
        <>
          <div className="db-attention-group">
            <h4 className="db-attention-group-title">
              On the selected day <span>{digestDay.short(day)} · IST</span>
            </h4>
            <ul className="db-attention-rows">
              {rows
                .filter((r) => r.period === 'day')
                .map((r) => (
                  <Category key={r.kind} row={r} onReview={openReview} />
                ))}
            </ul>
          </div>
          <div className="db-attention-group">
            <h4 className="db-attention-group-title">
              Still open now <span className="db-live-tag">Live</span>
            </h4>
            <p className="db-muted">
              Includes earlier days{liveReadAt ? ` · read ${formatMoment(liveReadAt)}` : ''}
            </p>
            <ul className="db-attention-rows">
              {rows
                .filter((r) => r.period === 'live')
                .map((r) => (
                  <Category key={r.kind} row={r} onReview={openReview} />
                ))}
            </ul>
          </div>
          {selected ? (
            <ReviewList
              key={selected.kind}
              kind={selected.kind}
              day={day}
              initial={selected}
              onClose={() => {
                setSelected(null);
                triggerRef.current?.focus();
              }}
              onUpdate={(r) => setOverrides((current) => ({ ...current, [r.kind]: r }))}
            />
          ) : null}
          <p className="db-foot-line">ETA delays are not tracked yet.</p>
        </>
      )}
    </section>
  );
}
