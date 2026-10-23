import { Link } from 'react-router-dom';
import { MapPin, ExternalLink, CheckCircle2, Gauge, Truck, ReceiptText } from 'lucide-react';
import { mapsLink } from '../fiDates.js';

/** Incident location, quick links and the review controls at the foot of the inspector. */
const InspectorActions = ({ activeEvent, isFill, onMarkReviewed, onOpenEvent, reviewed }) => (
  <>
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
          reviewed.has(activeEvent.id) ? 'Click to unmark reviewed' : 'Mark incident as reviewed'
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
        <span>{reviewed.has(activeEvent.id) ? 'Reviewed (Marked)' : 'Mark Reviewed'}</span>
      </button>
    </div>
  </>
);

export default InspectorActions;
