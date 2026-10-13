import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import Empty from './Empty';

/** Trips are not in this payload — say so rather than render an empty table. */
export default function TripsPanel() {
  return (
    <PanelErrorBoundary name="vehicle-trips">
      <div className="v360-panel v360-panel--single">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Trips</p>
            <Link to="/trip-management" className="v360-link">
              Trip management →
            </Link>
          </div>
          <Empty
            title="Trip history is not wired into this page yet"
            hint="The trips API is vehicle-scoped and ready; this tab needs to be pointed at it. Until then, open trip management for the fleet-wide list."
          />
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
