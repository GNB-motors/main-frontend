import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Eye,
  X,
  Truck,
  ReceiptText,
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
  onMarkReviewed,
  fills = [],
}) {
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

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

  const handleRowClick = (ev) => {
    if (onSelectEvent) onSelectEvent(ev.id);
    setIsInspectorOpen(true);
  };

  const isFill = activeEvent?.kind === 'fill';
  const isLoss = activeEvent?.kind === 'loss';
  const isDef = activeEvent?.kind === 'def';

  return (
    <div>
      {/* Table Sub-Header Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-xs">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          Showing{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {pageEvents.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredCount}</span>{' '}
          events · Click an incident row or View button to inspect telematics
        </span>
        {!isInspectorOpen && activeEvent && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
            onClick={() => setIsInspectorOpen(true)}
            title="Open forensic telemetry inspector beside table"
          >
            <Eye size={12} />
            <span>Show Inspector Panel</span>
          </button>
        )}
      </div>

      {/* Main Container: Split or Full Width Table */}
      <div className={isInspectorOpen && activeEvent ? 'fi-split-layout' : 'fi-full-table-layout'}>
        {/* Left Column: Dense Interactive Table Grid */}
        <div className="fi-feed-col">
          <div className="fi-table-scroll border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-x-auto bg-white dark:bg-slate-900 shadow-sm">
            <table className="ov-table w-full">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-3 px-2.5 text-left whitespace-nowrap">Vehicle</th>
                  <th className="py-3 px-2 text-left whitespace-nowrap">Event Nature</th>
                  <th className="py-3 px-2 text-left whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap">Volume / Ratio</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap">Est. Value</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Location</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Integrity Status</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap w-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {pageEvents.map((ev) => {
                  const isSelected = isInspectorOpen && activeEvent?.id === ev.id;
                  const isRev = reviewed.has(ev.id);
                  const isRowLoss = ev.kind === 'loss';
                  const isRowDef = ev.kind === 'def';
                  const isRowFill = ev.kind === 'fill';

                  return (
                    <tr
                      key={ev.id}
                      className={`fi-row-click cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? 'is-active bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600 dark:border-indigo-400 font-medium'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                      onClick={() => handleRowClick(ev)}
                    >
                      <td className="py-3.5 px-2.5 whitespace-nowrap">
                        <div className="hsrp-plate">
                          <span className="hsrp-ind">
                            <span className="hsrp-chakra" />
                            IND
                          </span>
                          <span className="hsrp-num">{ev.vehicle || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 whitespace-nowrap">
                        {isRowFill && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <TrendingUp size={12} /> Refuel Fill
                          </span>
                        )}
                        {isRowLoss && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-semibold">
                            <TrendingDown size={12} /> Siphon Loss
                          </span>
                        )}
                        {isRowDef && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            <Droplets size={12} /> DEF Anomaly
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-2 text-slate-500 font-mono text-xs whitespace-nowrap"
                        title={formatIST(ev.at)}
                      >
                        {formatRelativeIST(ev.at) || '—'}
                      </td>
                      <td
                        className="py-3.5 px-2 num text-right font-bold text-xs whitespace-nowrap"
                        style={{
                          color: isRowLoss
                            ? 'var(--critical, #dc2626)'
                            : isRowFill
                              ? 'var(--ok, #10b981)'
                              : '#d97706',
                        }}
                      >
                        {isRowDef
                          ? ev.defPct != null
                            ? `${ev.defPct}%`
                            : '—'
                          : `${isRowLoss ? '−' : '+'}${formatLitres(Math.abs(ev.litres ?? 0))}`}
                      </td>
                      <td className="py-3.5 px-2 num text-right text-slate-600 dark:text-slate-400 font-semibold text-xs whitespace-nowrap">
                        {ev.inr != null ? formatINR(ev.inr) : '—'}
                      </td>
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        {ev.lat != null && ev.lng != null ? (
                          <a
                            href={mapsLink(ev.lat, ev.lng)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            title="Open in Google Maps"
                          >
                            <MapPin size={11} /> Map
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        {isRev ? (
                          <StatusPill tone="ok">Reviewed</StatusPill>
                        ) : isRowFill ? (
                          ev.billFlag ? (
                            <StatusPill tone="caution">Mismatch</StatusPill>
                          ) : ev.confirmationStatus === 'CONFIRMED' ? (
                            <StatusPill tone="ok">Confirmed</StatusPill>
                          ) : (
                            <StatusPill tone="caution">Estimated</StatusPill>
                          )
                        ) : isRowLoss ? (
                          <StatusPill tone="critical">Suspected</StatusPill>
                        ) : (
                          <StatusPill tone="caution">DEF flag</StatusPill>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(ev);
                          }}
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700'
                          }`}
                          title={isSelected ? 'Currently inspecting' : 'Inspect telematics'}
                          aria-label="Inspect telematics"
                        >
                          <Eye size={14} className={isSelected ? 'text-white' : ''} />
                        </button>
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

        {/* Right Column: Sticky Forensic Telemetry Inspector */}
        {isInspectorOpen && activeEvent && (
          <div className="fi-inspector-col">
            <div className="fi-inspector-sticky">
              <div className="fi-inspector-panel">
                {/* Inspector Header */}
                <div className="fi-inspector-header flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                      {isFill && <TrendingUp size={13} className="text-emerald-500" />}
                      {isLoss && <TrendingDown size={13} className="text-red-500" />}
                      {isDef && <Droplets size={13} className="text-amber-500" />}
                      <span>
                        {isFill
                          ? 'Refuel Inflow Telematics'
                          : isLoss
                            ? 'Siphon Loss Telematics'
                            : 'DEF Dosing Telematics'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="hsrp-plate">
                        <span className="hsrp-ind">
                          <span className="hsrp-chakra" />
                          IND
                        </span>
                        <span className="hsrp-num">{activeEvent.vehicle}</span>
                      </div>
                      <span
                        className="text-xs font-mono text-slate-500 dark:text-slate-400"
                        title={formatIST(activeEvent.at)}
                      >
                        {formatRelativeIST(activeEvent.at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <button
                      type="button"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setIsInspectorOpen(false)}
                      title="Close Inspector"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Event-Specific Meter & Gauge */}
                {isDef && (
                  <div className="fi-reconciliation-meter bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        DEF to Fuel Dosing Ratio
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {activeEvent.defFlag || 'Dosing Anomaly'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-500/40"
                        style={{ left: '26.6%', width: '20%' }}
                        title="Healthy BS-VI corridor: 4.0% - 7.0%"
                      />
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(10, ((activeEvent.defPct ?? 0) / 15) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>
                        Measured: {activeEvent.defPct != null ? `${activeEvent.defPct}%` : '—'}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        BS-VI Standard: 4.0% – 7.0%
                      </span>
                    </div>
                  </div>
                )}

                {isLoss && (
                  <div className="fi-reconciliation-meter bg-red-50/60 dark:bg-red-950/20 border-red-200/80 dark:border-red-800/60">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        Unaccounted Siphon Loss
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {activeEvent.confidence || 'HIGH'} Confidence
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(15, (Math.abs(activeEvent.litres ?? 0) / 50) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Lost: −{formatLitres(Math.abs(activeEvent.litres ?? 0))}</span>
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        {activeEvent.inr != null ? formatINR(activeEvent.inr) : '—'}
                      </span>
                    </div>
                  </div>
                )}

                {isFill && (
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
                )}

                {/* Telematics Metrics Grid */}
                <div className="fi-telematics-grid">
                  {isDef && (
                    <>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Event Nature</span>
                        <span className="fi-tele-val text-amber-600 dark:text-amber-400">
                          DEF Anomaly
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Flag Status</span>
                        <span className="fi-tele-val text-xs truncate">
                          {activeEvent.defFlag || 'Dosing Anomaly'}
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">DEF Dosing Ratio</span>
                        <span className="fi-tele-val">
                          {activeEvent.defPct != null ? `${activeEvent.defPct}%` : '—'}
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">BS-VI Range</span>
                        <span className="fi-tele-val text-emerald-600 dark:text-emerald-400 text-xs">
                          4.0% – 7.0%
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Window Fuel Burn</span>
                        <span className="fi-tele-val">
                          {activeEvent.window?.engineBurnL != null
                            ? formatLitres(activeEvent.window.engineBurnL)
                            : '—'}
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Tank Level Δ</span>
                        <span className="fi-tele-val">
                          {activeEvent.window?.tankDeltaL != null
                            ? `${activeEvent.window.tankDeltaL >= 0 ? '+' : ''}${formatLitres(activeEvent.window.tankDeltaL)}`
                            : '—'}
                        </span>
                      </div>
                    </>
                  )}

                  {isLoss && (
                    <>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Event Nature</span>
                        <span className="fi-tele-val text-red-600 dark:text-red-400">
                          Siphon Loss
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Est. Financial Loss</span>
                        <span className="fi-tele-val text-red-600 dark:text-red-400">
                          {activeEvent.inr != null ? formatINR(activeEvent.inr) : '—'}
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Lost Volume</span>
                        <span className="fi-tele-val text-red-600 dark:text-red-400">
                          −{formatLitres(Math.abs(activeEvent.litres ?? 0))}
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Siphon Confidence</span>
                        <span className="fi-tele-val capitalize">
                          {activeEvent.confidence || 'HIGH'}
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Engine Burn (CAN)</span>
                        <span className="fi-tele-val">
                          {activeEvent.window?.engineBurnL != null
                            ? formatLitres(activeEvent.window.engineBurnL)
                            : '—'}
                        </span>
                      </div>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Physical Tank Δ</span>
                        <span className="fi-tele-val">
                          {activeEvent.window?.tankDeltaL != null
                            ? `${activeEvent.window.tankDeltaL >= 0 ? '+' : ''}${formatLitres(activeEvent.window.tankDeltaL)}`
                            : '—'}
                        </span>
                      </div>
                    </>
                  )}

                  {isFill && (
                    <>
                      <div className="fi-tele-item">
                        <span className="fi-tele-label">Event Nature</span>
                        <span className="fi-tele-val text-emerald-600 dark:text-emerald-400">
                          Refuel Fill
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
                          {activeCtx?.averageFill != null
                            ? formatLitres(activeCtx.averageFill)
                            : '—'}
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
                    </>
                  )}
                </div>

                {/* Geolocation & Incident Coordinates */}
                <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-blue-500 shrink-0" />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Incident Coordinates
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
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800"
                      title="Open coordinates in Google Maps"
                    >
                      <ExternalLink size={11} />
                      <span>Google Maps</span>
                    </a>
                  )}
                </div>

                {/* Quick Investigation Navigation */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to={`/vehicles/${encodeURIComponent(activeEvent.vehicle)}`}
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200/70 dark:border-slate-700 shadow-xs"
                    title={`View profile for ${activeEvent.vehicle}`}
                  >
                    <Truck size={13} className="text-slate-500 dark:text-slate-400" />
                    <span>View Vehicle</span>
                  </Link>

                  {isFill ? (
                    <Link
                      to="/fuel-comparison"
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200/70 dark:border-slate-700 shadow-xs"
                      title="View fuel comparison and invoice bill"
                    >
                      <ReceiptText size={13} className="text-slate-500 dark:text-slate-400" />
                      <span>View Bill</span>
                    </Link>
                  ) : activeEvent.lat != null && activeEvent.lng != null ? (
                    <a
                      href={mapsLink(activeEvent.lat, activeEvent.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 transition-colors border border-blue-200/70 dark:border-blue-800 shadow-xs"
                      title="Open in Google Maps"
                    >
                      <MapPin size={13} className="text-blue-500" />
                      <span>View on Map</span>
                    </a>
                  ) : (
                    <div className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800 cursor-not-allowed">
                      <MapPin size={13} />
                      <span>No GPS Map</span>
                    </div>
                  )}
                </div>

                {/* Primary Audit & Review Controls */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-sm transition-all"
                    onClick={() => onOpenEvent && onOpenEvent(activeEvent)}
                    title="Open deep physics waveform and telemetry charts"
                  >
                    <Gauge size={14} />
                    <span>Deep Physics Audit</span>
                  </button>

                  <button
                    type="button"
                    className={`w-full inline-flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border ${
                      reviewed.has(activeEvent.id)
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                    onClick={() => onMarkReviewed && onMarkReviewed(activeEvent.id)}
                    title={
                      reviewed.has(activeEvent.id)
                        ? 'Click to unmark reviewed'
                        : 'Mark incident as reviewed'
                    }
                  >
                    <CheckCircle2
                      size={14}
                      className={
                        reviewed.has(activeEvent.id)
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }
                    />
                    <span>
                      {reviewed.has(activeEvent.id) ? 'Reviewed (Marked)' : 'Mark Reviewed'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
