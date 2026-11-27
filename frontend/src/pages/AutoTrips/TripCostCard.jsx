import { tripCostView } from './tripCost';

/**
 * The cost of this trip: what it cost to run, what the tolls came to, and the
 * total when both are known.
 */
export default function TripCostCard({ trip, tolls = null, role = null }) {
  const view = tripCostView(trip, tolls, role);
  return (
    <div className="atx-card atx-dev-card">
      <h2 className="atx-card-title">Trip cost</h2>
      <div className="atx-fields">
        <div className="atx-field">
          <span className="atx-field-label">Running cost (fuel + wear)</span>
          <span className="atx-field-value">{view.runningText}</span>
          {view.runningNote ? <small className="atx-cost-note">{view.runningNote}</small> : null}
        </div>
        {view.fares ? (
          <div className="atx-field">
            <span className="atx-field-label">Tolls (crossings on this trip)</span>
            <span className="atx-field-value">{view.tollText}</span>
            {view.tollNote ? <small className="atx-cost-note">{view.tollNote}</small> : null}
          </div>
        ) : null}
        <div className="atx-field">
          <span className="atx-field-label">
            {view.fares ? 'Total' : 'Total (without tolls)'}
          </span>
          <span className="atx-field-value">{view.totalText}</span>
          {view.totalNote ? <small className="atx-cost-note">{view.totalNote}</small> : null}
        </div>
      </div>
    </div>
  );
}
