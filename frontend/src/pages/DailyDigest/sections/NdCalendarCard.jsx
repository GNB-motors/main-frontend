import { useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Check, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateIST } from '../../../utils/dateUtils';
import { DAY_MS, dayOffset } from './digestDates';
import NdGantt from './NdGantt.jsx';
import NdMonth from './NdMonth.jsx';

// Flattens getFleetCalendar()'s per-vehicle events into the {start, len}
// day-offset shape the Gantt/month grid render, same model the mockup uses.
function useCalendarEvents(vehicles) {
  return useMemo(() => {
    return (vehicles || []).map((v) => ({
      ...v,
      events: (v.events || []).map((e) => ({
        ...e,
        start: dayOffset(e.date),
        len: e.len || 1,
      })),
    }));
  }, [vehicles]);
}

export default function NdCalendarCard({ vehicles, days = 14, onOpenVehicle, selectedVehicleId }) {
  const [view, setView] = useState('gantt');
  const veh = useCalendarEvents(vehicles);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(today.getTime() + (days - 1) * DAY_MS);
  const rangeLabel = `${formatDateIST(today)} – ${formatDateIST(rangeEnd)}`;

  // Summary counts for badges and legend
  const totalEvents = veh.reduce((acc, v) => acc + (v.events?.length || 0), 0);
  const tripCount = veh.reduce(
    (acc, v) => acc + (v.events?.filter((e) => e.type === 'trip')?.length || 0),
    0,
  );
  const serviceCount = veh.reduce(
    (acc, v) => acc + (v.events?.filter((e) => e.type === 'service')?.length || 0),
    0,
  );
  const docCount = veh.reduce(
    (acc, v) => acc + (v.events?.filter((e) => e.type === 'doc')?.length || 0),
    0,
  );

  return (
    <section className="nd-card" id="nd-calendar">
      <div className="nd-card-head nd-cal-head">
        <div className="nd-cal-title-block">
          <div className="nd-cal-title-row">
            <span className="nd-cal-title-ico">
              <CalendarIcon size={16} />
            </span>
            <h2>Fleet calendar</h2>
            <span className="nd-cal-count-pill">{veh.length} vehicles</span>
            <span className="nd-cal-count-pill nd-cal-count-pill--events">
              {totalEvents} events
            </span>
          </div>
          <span className="nd-cal-range-pill">
            <Clock size={12} />
            {rangeLabel} · planned trips
          </span>
        </div>
        <span className="nd-sp" />
        <div className="nd-ios-tabs" role="tablist" aria-label="Fleet calendar view mode">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'gantt'}
            className={`nd-ios-tab ${view === 'gantt' ? 'nd-ios-tab--active' : ''}`}
            onClick={() => setView('gantt')}
          >
            {view === 'gantt' && (
              <Motion.span
                layoutId="ndCalViewIndicator"
                className="nd-ios-tab-indicator"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="nd-ios-tab-text">{days} days</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'month'}
            className={`nd-ios-tab ${view === 'month' ? 'nd-ios-tab--active' : ''}`}
            onClick={() => setView('month')}
          >
            {view === 'month' && (
              <Motion.span
                layoutId="ndCalViewIndicator"
                className="nd-ios-tab-indicator"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="nd-ios-tab-text">Month</span>
          </button>
        </div>
      </div>

      <div className="nd-legend nd-cal-legend">
        <span className="nd-legend-chip">
          <i style={{ background: '#3b82f6' }} />
          <span>Planned trip</span>
          {tripCount > 0 && <b>{tripCount}</b>}
        </span>
        <span className="nd-legend-chip">
          <i style={{ background: '#2563eb' }} />
          <span>Service due/overdue</span>
          {serviceCount > 0 && <b>{serviceCount}</b>}
        </span>
        <span className="nd-legend-chip">
          <i style={{ background: '#ef4444' }} />
          <span>Document expiry</span>
          {docCount > 0 && <b>{docCount}</b>}
        </span>
        <span className="nd-legend-chip nd-legend-chip--muted">
          <i
            style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-default)' }}
          />
          <span>Weekend</span>
        </span>
        <span className="nd-legend-hint">Click any vehicle or event for full detail</span>
      </div>

      {veh.length === 0 ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <Check size={22} />
          </span>
          <b>Nothing scheduled</b>
          <span>Trips, service and document due-dates appear here as they&apos;re planned.</span>
        </div>
      ) : view === 'gantt' ? (
        <NdGantt
          vehicles={veh}
          days={days}
          onOpenVehicle={onOpenVehicle}
          selectedVehicleId={selectedVehicleId}
        />
      ) : (
        <NdMonth vehicles={veh} onOpenVehicle={onOpenVehicle} />
      )}
    </section>
  );
}
