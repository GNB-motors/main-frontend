import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { fleetViewService } from '../../../services/fleetViewService';
import { formatMoment, humanCode } from '../ownerReportModel';
import digestDay from '../digestDay';
import attentionCopy from '../attentionCopy';
import DigestSkeleton from './DigestSkeleton';
import InfoTip from '../../../components/redesign/InfoTip';

/** Open queues read as they are now, whatever day is picked. */
const LIVE_KINDS = new Set(['papersWaiting', 'documentsExpiring', 'broadcastNotAcknowledged']);

/**
 * The rows to draw. A current server sends them ready (attentionVersion 2)
 * and each can be reviewed; an older server sends plain counts, which are
 * drawn the same way but without Review (it has no review endpoint).
 */
function rowsOf(section) {
  const rows = Array.isArray(section?.rows) ? section.rows.filter((r) => r && r.kind) : [];
  if (section?.numbers?.attentionVersion === 2) return { rows, reviewable: true };
  return {
    reviewable: false,
    rows: rows.map((r) => {
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
    }),
  };
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
  const label = attentionCopy.label(kind);
  // The freshly read count is shown with the records; the card's count is
  // updated when the review closes, so the two never silently disagree.
  return (
    <section ref={panelRef} className="db-attention-review" aria-label={`Review ${label}`}>
      <header className="db-attention-review-head">
        <div>
          <h4 ref={headingRef} tabIndex={-1}>
            {label}
          </h4>
          <p className="db-muted">
            {initial.period === 'live' ? 'Open now · includes earlier days' : digestDay.short(day)}
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
        <DigestSkeleton label="Loading the list" />
      ) : failed ? (
        <p className="db-error" role="alert">
          Couldn&apos;t load this list.{' '}
          <button className="db-link" type="button" onClick={review$.refetch}>
            Retry
          </button>
        </p>
      ) : result ? (
        <>
          <p className="db-attention-read" aria-live="polite">
            {result.count == null
              ? 'Not tracked yet'
              : `${result.count.toLocaleString('en-IN')} ${attentionCopy.unit(kind, result.count)}`}{' '}
            · Updated {formatMoment(result.readAt)}
          </p>
          {result.count !== initial.count ? (
            <p className="db-muted">{attentionCopy.changed}</p>
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
                        'Item'}
                    </strong>
                  )}
                  {row.at ? <time dateTime={row.at}>{formatMoment(row.at)}</time> : null}
                </div>
                <p>{attentionCopy.record(kind, row)}</p>
              </li>
            ))}
          </ul>
          {result.count === 0 ? <p className="db-muted">Nothing here.</p> : null}
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
              Open the alert inbox
            </Link>
          ) : null}
          {kind === 'papersWaiting' ? (
            <Link className="db-link" to="/khata-ledger?tab=all&expenseStatus=PENDING">
              Open bills to approve
            </Link>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Category({ row, reviewable, onReview }) {
  const label = attentionCopy.label(row.kind);
  if (row.state === 'unmeasured') return null;
  const failed = row.state === 'error';
  if (!failed && row.count === 0) {
    return <li className="db-attention-clear">{attentionCopy.none(row.kind, row.period)}</li>;
  }
  return (
    <li className="db-attention-row">
      <div>
        <h4>{label}</h4>
        <p>{failed ? attentionCopy.failed : attentionCopy.about(row)}</p>
      </div>
      <div className="db-attention-count">
        {failed || row.count == null ? '—' : row.count.toLocaleString('en-IN')}
        <small>{attentionCopy.unit(row.kind, row.count)}</small>
      </div>
      {reviewable && (failed || row.count > 0) ? (
        <button
          type="button"
          className="db-attention-button"
          onClick={(event) => onReview(row, event.currentTarget)}
          aria-label={`${failed ? 'Retry' : 'Review'} ${label}`}
        >
          {failed ? 'Retry' : 'Review'}
        </button>
      ) : (
        <span className="db-attention-none" />
      )}
    </li>
  );
}

export default function AttentionCard({ section, loading, day }) {
  const [selected, setSelected] = useState(null);
  const [overrides, setOverrides] = useState({});
  const triggerRef = useRef(null);
  const openReview = (row, trigger) => {
    triggerRef.current = trigger;
    setSelected(row);
  };
  const { rows: base, reviewable } = rowsOf(section);
  const rows = base.map((r) => overrides[r.kind] || r);
  const liveReadAt = rows.find((r) => r.period === 'live')?.readAt;
  const group = (period) =>
    rows
      .filter((r) => r.period === period)
      .map((r) => <Category key={r.kind} row={r} reviewable={reviewable} onReview={openReview} />);
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
          <p className="db-foot-line">{attentionCopy.notTracked}</p>
        </>
      )}
    </section>
  );
}
