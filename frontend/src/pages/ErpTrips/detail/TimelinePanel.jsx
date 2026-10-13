import { stamp } from './tripFormat';

// Pillar 1 — human labels for the append-only stage event log (ErpTripEvent).
const EVENT_LABELS = {
  'trip.placed': 'Placed',
  'advance.created': 'Advance created',
  'advance.approved': 'Advance approved',
  'advance.paid': 'Advance paid',
  'cn.saved': 'CN saved → Dispatched',
  'trip.closed': 'Trip closed',
  'pod.recorded': 'POD received',
  'unloading.saved': 'Unloaded',
  'saleBill.approved': 'Billed',
  'saleBill.cancelled': 'Bill cancelled',
  'placement.deleted': 'Cancelled',
};

/** Pillar 1 — the precise, ordered stage history with real timestamps. */
const TimelinePanel = ({ events }) => {
  if (!Array.isArray(events) || events.length === 0) return null;
  return (
    <section className="trip360-panel trip360-activity">
      <div className="trip360-panel-head">Activity</div>
      <div className="trip360-panel-body">
        <ol className="trip360-timeline">
          {events.map((e) => (
            <li key={e.seq ?? `${e.jobName}-${e.at}`} className="trip360-timeline-item">
              <span className="trip360-timeline-label">
                {EVENT_LABELS[e.jobName] || e.toState || e.jobName}
              </span>
              <span className="trip360-timeline-time">{stamp(e.at)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default TimelinePanel;
