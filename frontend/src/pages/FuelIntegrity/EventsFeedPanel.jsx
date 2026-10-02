import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Droplets,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Gauge,
  Columns,
  Table as TableIcon,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { formatINR, formatLitres } from '../../utils/formatters';
import { StatusPill } from '../../components/overview.primitives.jsx';
import TablePager from './TablePager.jsx';
import { formatIST, formatRelativeIST, mapsLink } from './fiDates.js';

const SKELETON_ROWS = ['fi-sk-1', 'fi-sk-2', 'fi-sk-3', 'fi-sk-4', 'fi-sk-5'];

export default function EventsFeedPanel({
  isLoading,
  filteredCount,
  pageEvents = [],
  page = 1,
  totalPages = 1,
  reviewed = new Set(),
  onOpenEvent,
  onPageChange,
  selectedEventId,
  onSelectEvent,
  viewMode = 'split',
  onToggleViewMode,
  onMarkReviewed,
  fills = [],
}) {
  // Determine the active event for the sticky forensic inspector
  const activeEvent = useMemo(() => {
    if (!pageEvents || pageEvents.length === 0) return null;
    const found = pageEvents.find((e) => e.id === selectedEventId);
    return found || pageEvents[0];
  }, [pageEvents, selectedEventId]);

  // Derived context for the active event (historical averages, variance)
  const activeCtx = useMemo(() => {
    if (!activeEvent || activeEvent.kind !== 'fill') return null;
    const sameVeh = fills
      .filter((f) => f.registrationNumber === activeEvent.vehicle)
      .sort((a, b) => new Date(b.at) - new Date(a.at));
    const idx = sameVeh.findIndex((f) => `fill-${f._id}` === activeEvent.id);
    const previousFill = idx >= 0 && sameVeh[idx + 1] ? sameVeh[idx + 1].litres : null;
    const vals = sameVeh.map((f) => f.litres).filter((n) => n != null);
    const averageFill = vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : null;
    const variance =
      activeEvent.litres != null && averageFill != null ? activeEvent.litres - averageFill : null;
    const variancePct = variance != null && averageFill ? (variance / averageFill) * 100 : null;

    return {
      previousFill,
      averageFill,
      variance,
      variancePct,
    };
  }, [activeEvent, fills]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {SKELETON_ROWS.map((key) => (
          <div key={key} className="ov-inset h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredCount === 0) {
    return (
      <div className="text-dim py-12 text-center text-sm">
        No fuel events match these criteria. Try loosening your filter tags.
      </div>
    );
  }

  return (
    <div>
      {/* View Switcher Header Sub-bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <span className="text-xs text-slate-500 font-medium">
          Showing {pageEvents.length} of {filteredCount} events · Click an incident to inspect
          telematics
        </span>
        <div className="fi-view-toggle">
          <button
            type="button"
            className={`fi-view-toggle-btn ${viewMode === 'split' ? 'is-active' : ''}`}
            onClick={() => onToggleViewMode && onToggleViewMode('split')}
            title="Split Command Inspector"
          >
            <Columns size={12} />
            <span>Inspector</span>
          </button>
          <button
            type="button"
            className={`fi-view-toggle-btn ${viewMode === 'table' ? 'is-active' : ''}`}
            onClick={() => onToggleViewMode && onToggleViewMode('table')}
            title="Dense Data Grid"
          >
            <TableIcon size={12} />
            <span>Table Grid</span>
          </button>
        </div>
      </div>

      {/* ── MODE 1: SPLIT MASTER-DETAIL COMMAND INSPECTOR ─────────────────────── */}
      {viewMode === 'split' ? (
        <div className="fi-split-layout">
          {/* Left Column: Event Audit Stream */}
          <div className="fi-feed-col">
            <div className="fi-event-cards-stream">
              {pageEvents.map((ev) => {
                const isSelected = activeEvent?.id === ev.id;
                const isRev = reviewed.has(ev.id);
                const isLoss = ev.kind === 'loss';
                const isDef = ev.kind === 'def';
                const isFill = ev.kind === 'fill';

                return (
                  <div
                    key={ev.id}
                    className={`fi-event-card fi-event-card--${ev.kind} ${isSelected ? 'is-active' : ''}`}
                    onClick={() => onSelectEvent(ev.id)}
                  >
                    {/* Top Row: Vehicle Reg + Event Type + Time */}
                    <div className="fi-card-top-row">
                      <div className="flex items-center gap-2">
                        <div className="hsrp-plate">
                          <span className="hsrp-ind">
                            <span className="hsrp-chakra" />
                            IND
                          </span>
                          <span className="hsrp-num">{ev.vehicle || 'UNKNOWN'}</span>
                        </div>

                        {/* Event Nature Chip */}
                        {isFill && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                            <TrendingUp size={11} /> Refuel Fill
                          </span>
                        )}
                        {isLoss && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-800 animate-pulse">
                            <TrendingDown size={11} /> Siphon Loss
                          </span>
                        )}
                        {isDef && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800">
                            <Droplets size={11} /> DEF Tamper / Low
                          </span>
                        )}
                      </div>

                      <div className="fi-card-meta" title={formatIST(ev.at)}>
                        <span>{formatRelativeIST(ev.at)}</span>
                      </div>
                    </div>

                    {/* Middle Row: Volume + Rupee Cost + Status */}
                    <div className="fi-card-body-row">
                      <div className="flex items-baseline gap-2">
                        <span className={`fi-card-vol fi-card-vol--${ev.kind}`}>
                          {isDef
                            ? ev.defPct != null
                              ? `${ev.defPct}% Burn Ratio`
                              : '0% DEF'
                            : `${isLoss ? '−' : '+'}${formatLitres(Math.abs(ev.litres ?? 0))}`}
                        </span>
                        {ev.inr != null && (
                          <span className="fi-card-inr">≈ {formatINR(ev.inr)}</span>
                        )}
                      </div>

                      {/* Status Chip */}
                      <div>
                        {isRev ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={11} /> Reviewed
                          </span>
                        ) : isFill ? (
                          ev.billFlag ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                              <AlertTriangle size={11} /> Bill Mismatch
                            </span>
                          ) : ev.confirmationStatus === 'CONFIRMED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                              <CheckCircle2 size={11} /> Verified Match
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              Sensor Estimated
                            </span>
                          )
                        ) : isLoss ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/50 px-2 py-0.5 rounded-md">
                            <ShieldAlert size={11} /> Loss Suspected
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                            DEF Flagged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Reconciliation Note & Map Location */}
                    <div className="fi-card-foot-row">
                      <span>
                        {isFill
                          ? ev.smoothedJumpL != null
                            ? `Tank jump: +${formatLitres(ev.smoothedJumpL)} · Invoice: ${ev.claimedLitres != null ? `${ev.claimedLitres} L` : 'Pending'}`
                            : 'Sensor rise confirmed'
                          : isLoss
                            ? `Mass-balance deficit window: ~${formatINR(ev.inr)} financial exposure`
                            : 'Exhaust fluid telemetry discrepancy detected'}
                      </span>

                      {ev.lat != null && ev.lng != null ? (
                        <a
                          href={mapsLink(ev.lat, ev.lng)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          <MapPin size={11} />
                          <span>Map</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">Station GPS</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-2">
                <TablePager page={page} totalPages={totalPages} onPageChange={onPageChange} />
              </div>
            )}
          </div>

          {/* Right Column: Sticky Forensic Telemetry Inspector */}
          <div className="fi-inspector-col">
            <div className="fi-inspector-sticky">
              {activeEvent ? (
                <div className="fi-inspector-panel">
                  {/* Inspector Header */}
                  <div className="fi-inspector-header">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                        Forensic Telematics Inspector
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="hsrp-plate">
                          <span className="hsrp-ind">
                            <span className="hsrp-chakra" />
                            IND
                          </span>
                          <span className="hsrp-num">{activeEvent.vehicle}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {formatIST(activeEvent.at)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pshell-btn text-xs"
                      onClick={() => onOpenEvent && onOpenEvent(activeEvent)}
                      title="Open full telemetry modal"
                    >
                      <Activity size={13} />
                      <span>Full Physics</span>
                    </button>
                  </div>

                  {/* Mass-Balance Reconciliation Gauge */}
                  <div className="fi-reconciliation-meter">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        Sensor Rise vs Invoice Billed
                      </span>
                      <span
                        className={
                          activeEvent.billFlag
                            ? 'text-amber-600 font-bold'
                            : 'text-emerald-600 font-bold'
                        }
                      >
                        {activeEvent.billFlag
                          ? `${activeEvent.billVarianceL ?? '—'} L Variance`
                          : '100% Reconciled'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: activeEvent.billFlag ? '88%' : '100%' }}
                      />
                      {activeEvent.billFlag && (
                        <div
                          className="bg-amber-500 h-full rounded-r-full"
                          style={{ width: '12%' }}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Sensor: +{formatLitres(activeEvent.litres ?? 0)}</span>
                      <span>
                        Billed:{' '}
                        {activeEvent.claimedLitres != null
                          ? `${activeEvent.claimedLitres} L`
                          : activeEvent.litres != null
                            ? `${activeEvent.litres} L`
                            : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Telematics Metrics Grid */}
                  <div className="fi-telematics-grid">
                    <div className="fi-tele-item">
                      <span className="fi-tele-label">Event Nature</span>
                      <span className="fi-tele-val capitalize">
                        {activeEvent.kind === 'fill'
                          ? 'Refuel Fill'
                          : activeEvent.kind === 'loss'
                            ? 'Siphon Loss'
                            : 'DEF Telemetry'}
                      </span>
                    </div>

                    <div className="fi-tele-item">
                      <span className="fi-tele-label">Est. Financial Value</span>
                      <span className="fi-tele-val text-emerald-600 dark:text-emerald-400">
                        {activeEvent.inr != null ? formatINR(activeEvent.inr) : '—'}
                      </span>
                    </div>

                    <div className="fi-tele-item">
                      <span className="fi-tele-label">Sensor Tank Jump</span>
                      <span className="fi-tele-val">
                        {activeEvent.smoothedJumpL != null
                          ? `+${formatLitres(activeEvent.smoothedJumpL)}`
                          : formatLitres(activeEvent.litres ?? 0)}
                      </span>
                    </div>

                    <div className="fi-tele-item">
                      <span className="fi-tele-label">Previous Fill</span>
                      <span className="fi-tele-val">
                        {activeCtx?.previousFill != null
                          ? formatLitres(activeCtx.previousFill)
                          : '—'}
                      </span>
                    </div>

                    <div className="fi-tele-item">
                      <span className="fi-tele-label">Vehicle Avg Fill</span>
                      <span className="fi-tele-val">
                        {activeCtx?.averageFill != null ? formatLitres(activeCtx.averageFill) : '—'}
                      </span>
                    </div>

                    <div className="fi-tele-item">
                      <span className="fi-tele-label">Odometer Reading</span>
                      <span className="fi-tele-val">
                        {activeEvent.odometer != null
                          ? `${activeEvent.odometer.toLocaleString()} km`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Geolocation & Pump Info */}
                  <div className="p-3 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-blue-500" />
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Dispensing Coordinates
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {activeEvent.lat != null && activeEvent.lng != null
                            ? `${activeEvent.lat.toFixed(4)}, ${activeEvent.lng.toFixed(4)}`
                            : 'GPS telemetry unavailable'}
                        </div>
                      </div>
                    </div>

                    {activeEvent.lat != null && activeEvent.lng != null && (
                      <a
                        href={mapsLink(activeEvent.lat, activeEvent.lng)}
                        target="_blank"
                        rel="noreferrer"
                        className="pshell-btn text-xs"
                      >
                        <ExternalLink size={12} />
                        <span>Google Maps</span>
                      </a>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      className="pshell-btn flex-1 text-xs justify-center"
                      onClick={() => onOpenEvent && onOpenEvent(activeEvent)}
                    >
                      <Gauge size={13} />
                      <span>Deep Physics Graph</span>
                    </button>

                    <button
                      type="button"
                      className={`pshell-btn text-xs justify-center ${
                        reviewed.has(activeEvent.id)
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                          : ''
                      }`}
                      onClick={() => onMarkReviewed && onMarkReviewed(activeEvent.id)}
                    >
                      <CheckCircle2 size={13} />
                      <span>{reviewed.has(activeEvent.id) ? 'Reviewed' : 'Mark Reviewed'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="fi-inspector-panel text-center py-12 text-slate-400 text-sm">
                  Select an event card on the left to inspect its live forensic telemetry.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── MODE 2: DENSE DATA GRID (TABLE) ─────────────────────────────────── */
        <div className="p-4">
          <div className="fi-table-scroll">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Event Nature</th>
                  <th>Timestamp</th>
                  <th className="text-right">Volume</th>
                  <th className="text-right">Est. Value</th>
                  <th>Location</th>
                  <th>Integrity Status</th>
                  <th className="text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {pageEvents.map((ev) => {
                  const isRev = reviewed.has(ev.id);
                  const isLoss = ev.kind === 'loss';
                  const isDef = ev.kind === 'def';
                  const isFill = ev.kind === 'fill';

                  return (
                    <tr
                      key={ev.id}
                      className="fi-row-click"
                      onClick={() => onOpenEvent && onOpenEvent(ev)}
                    >
                      <td>
                        <div className="hsrp-plate">
                          <span className="hsrp-ind">
                            <span className="hsrp-chakra" />
                            IND
                          </span>
                          <span className="hsrp-num">{ev.vehicle || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {isFill && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <TrendingUp size={12} /> Refuel Fill
                          </span>
                        )}
                        {isLoss && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-semibold">
                            <TrendingDown size={12} /> Siphon Loss
                          </span>
                        )}
                        {isDef && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            <Droplets size={12} /> DEF Anomaly
                          </span>
                        )}
                      </td>
                      <td className="text-slate-500 font-mono text-xs" title={formatIST(ev.at)}>
                        {formatRelativeIST(ev.at) || '—'}
                      </td>
                      <td
                        className="num text-right font-bold text-sm"
                        style={{
                          color: isLoss
                            ? 'var(--critical, #dc2626)'
                            : isFill
                              ? 'var(--ok, #10b981)'
                              : '#d97706',
                        }}
                      >
                        {isDef
                          ? ev.defPct != null
                            ? `${ev.defPct}%`
                            : '—'
                          : `${isLoss ? '−' : '+'}${formatLitres(Math.abs(ev.litres ?? 0))}`}
                      </td>
                      <td className="num text-right text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        {ev.inr != null ? formatINR(ev.inr) : '—'}
                      </td>
                      <td>
                        {ev.lat != null && ev.lng != null ? (
                          <a
                            href={mapsLink(ev.lat, ev.lng)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <MapPin size={11} /> Map
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {isRev ? (
                          <StatusPill tone="ok">Reviewed</StatusPill>
                        ) : isFill ? (
                          ev.billFlag ? (
                            <StatusPill tone="caution">Mismatch</StatusPill>
                          ) : ev.confirmationStatus === 'CONFIRMED' ? (
                            <StatusPill tone="ok">Confirmed</StatusPill>
                          ) : (
                            <StatusPill tone="caution">Estimated</StatusPill>
                          )
                        ) : isLoss ? (
                          <StatusPill tone="critical">Suspected</StatusPill>
                        ) : (
                          <StatusPill tone="caution">DEF flag</StatusPill>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-700 font-semibold">
                          View <ChevronRight size={13} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pt-3">
              <TablePager page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
