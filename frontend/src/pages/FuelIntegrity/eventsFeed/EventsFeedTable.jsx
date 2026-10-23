import { TrendingUp, TrendingDown, Droplets, MapPin, Eye } from 'lucide-react';
import { formatINR, formatLitres } from '../../../utils/formatters';
import { StatusPill } from '../../../components/overview.primitives.jsx';
import TablePager from '../TablePager.jsx';
import { formatIST, formatRelativeIST, mapsLink } from '../fiDates.js';

/** The events table with its pager; clicking a row opens it in the inspector. */
const EventsFeedTable = ({
  activeEvent,
  handleRowClick,
  isInspectorOpen,
  onPageChange,
  page,
  pageEvents,
  reviewed,
  totalPages,
}) => (
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
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a table cell, not a control; the rule reads <td> as a gridcell and stops before the text inside */}
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
);

export default EventsFeedTable;
