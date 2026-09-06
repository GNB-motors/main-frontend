import { TrendingUp, TrendingDown, Droplets, MapPin } from 'lucide-react';
import { formatINR, formatLitres } from '../../utils/formatters';
import { Panel, StatusPill } from '../Overview/components/overview.primitives.jsx';
import { formatIST, formatRelativeIST, mapsLink } from './fiDates.js';

const SKELETON_ROWS = ['fi-sk-1', 'fi-sk-2', 'fi-sk-3', 'fi-sk-4', 'fi-sk-5', 'fi-sk-6'];

export default function EventsFeedPanel({
  isLoading,
  filteredCount,
  pageEvents,
  page,
  totalPages,
  reviewed,
  onOpenEvent,
  onPageChange,
}) {
  return (
    <Panel
      id="fi-events"
      eyebrow="Recent fuel events"
      question="Which event should I investigate first?"
      action={<span className="text-dim text-xs">{filteredCount} events · newest first</span>}
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {SKELETON_ROWS.map((key) => (
            <div key={key} className="ov-inset h-11 animate-pulse" />
          ))}
        </div>
      ) : filteredCount === 0 ? (
        <div className="text-dim py-10 text-center text-sm">No events match these filters.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Event</th>
                  <th>Time</th>
                  <th className="text-right">Fuel volume</th>
                  <th className="text-right">Est. value</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageEvents.map((ev) => {
                  const flagged = ev.kind === 'loss' || ev.kind === 'def' || ev.billFlag;
                  const crit = ev.kind === 'loss';
                  const isRev = reviewed.has(ev.id);
                  return (
                    <tr
                      key={ev.id}
                      className={`fi-row-click ${crit ? 'fi-row-crit' : flagged ? 'fi-row-flag' : ''}`}
                      onClick={() => onOpenEvent(ev)}
                    >
                      <td>
                        <span className="reg-plate">{ev.vehicle || '—'}</span>
                      </td>
                      <td>
                        {ev.kind === 'fill' && (
                          <span
                            className="inline-flex items-center gap-1 text-sm"
                            style={{ color: 'var(--ok)' }}
                          >
                            <TrendingUp size={13} /> Fill
                          </span>
                        )}
                        {ev.kind === 'loss' && (
                          <span
                            className="inline-flex items-center gap-1 text-sm"
                            style={{ color: 'var(--critical)' }}
                          >
                            <TrendingDown size={13} /> Loss
                          </span>
                        )}
                        {ev.kind === 'def' && (
                          <span
                            className="inline-flex items-center gap-1 text-sm"
                            style={{ color: 'var(--caution)' }}
                          >
                            <Droplets size={13} /> DEF
                          </span>
                        )}
                      </td>
                      <td className="num text-dim" title={formatIST(ev.at)}>
                        {formatRelativeIST(ev.at) || '—'}
                      </td>
                      <td
                        className="num text-right font-semibold"
                        style={{
                          color:
                            ev.kind === 'loss'
                              ? 'var(--critical)'
                              : ev.kind === 'fill'
                                ? 'var(--ok)'
                                : 'var(--cluster-text-dim)',
                        }}
                      >
                        {ev.kind === 'def'
                          ? ev.defPct != null
                            ? `${ev.defPct}%`
                            : '—'
                          : `${ev.kind === 'loss' ? '−' : '+'}${formatLitres(Math.abs(ev.litres ?? 0))}`}
                      </td>
                      <td className="num text-right text-dim">
                        {ev.inr != null ? formatINR(ev.inr) : '—'}
                      </td>
                      <td>
                        {ev.lat != null && ev.lng != null ? (
                          <a
                            href={mapsLink(ev.lat, ev.lng)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs"
                            style={{ color: 'var(--gnb-400)' }}
                          >
                            <MapPin size={12} /> Map
                          </a>
                        ) : (
                          <span className="text-dim text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {isRev ? (
                          <StatusPill tone="ok">Reviewed</StatusPill>
                        ) : ev.kind === 'fill' ? (
                          ev.billFlag ? (
                            <StatusPill tone="caution">Review</StatusPill>
                          ) : ev.confirmationStatus === 'CONFIRMED' ? (
                            <StatusPill tone="ok">Confirmed</StatusPill>
                          ) : ev.confirmationStatus === 'REJECTED' ? (
                            <StatusPill tone="inert">Rejected</StatusPill>
                          ) : (
                            <StatusPill tone="caution">Estimated</StatusPill>
                          )
                        ) : ev.kind === 'loss' ? (
                          <StatusPill tone="critical">Suspected</StatusPill>
                        ) : (
                          <StatusPill tone="caution">
                            DEF {ev.defFlag?.toLowerCase?.() || 'flag'}
                          </StatusPill>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-dim text-xs">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="ov-btn"
                  disabled={page === 1}
                  onClick={() => onPageChange((p) => Math.max(1, p - 1))}
                  style={page === 1 ? { opacity: 0.5 } : undefined}
                >
                  Prev
                </button>
                <button
                  className="ov-btn"
                  disabled={page === totalPages}
                  onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
                  style={page === totalPages ? { opacity: 0.5 } : undefined}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
