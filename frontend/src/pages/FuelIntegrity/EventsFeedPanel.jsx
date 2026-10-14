import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Droplets, Eye, X } from 'lucide-react';
import { formatIST, formatRelativeIST } from './fiDates.js';
import EventsFeedTable from './eventsFeed/EventsFeedTable';
import InspectorMeter from './eventsFeed/InspectorMeter';
import InspectorTelematicsGrid from './eventsFeed/InspectorTelematicsGrid';
import InspectorActions from './eventsFeed/InspectorActions';

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
        <EventsFeedTable
          activeEvent={activeEvent}
          handleRowClick={handleRowClick}
          isInspectorOpen={isInspectorOpen}
          onPageChange={onPageChange}
          page={page}
          pageEvents={pageEvents}
          reviewed={reviewed}
          totalPages={totalPages}
        />

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
                <InspectorMeter
                  activeEvent={activeEvent}
                  isDef={isDef}
                  isFill={isFill}
                  isLoss={isLoss}
                />

                {/* Telematics Metrics Grid */}
                <InspectorTelematicsGrid
                  activeCtx={activeCtx}
                  activeEvent={activeEvent}
                  isDef={isDef}
                  isFill={isFill}
                  isLoss={isLoss}
                />

                {/* Geolocation & Incident Coordinates */}
                <InspectorActions
                  activeEvent={activeEvent}
                  isFill={isFill}
                  onMarkReviewed={onMarkReviewed}
                  onOpenEvent={onOpenEvent}
                  reviewed={reviewed}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
