import { Link } from 'react-router-dom';
import { erpPlanTracking } from '../../AutoTrips/erpPlanTracking';
import { PLAN_STATUS_LABEL, PLAN_FLAG_LABEL } from '../../AutoTrips/tripForms';
import { STATUS_LABEL } from '../../AutoTrips/autoTripFormat';
import Facts from './Facts';
import { stamp } from './tripFormat';

export default function GpsTripPanel({ plan, autoTrip, error }) {
  if (!plan && !error) return null;
  return (
    <section className="trip360-panel">
      <div className="trip360-panel-head">GPS trip</div>
      <div className="trip360-panel-body">
        {error ? (
          <p>GPS association could not be refreshed. Reload to try again.</p>
        ) : (
          <>
            <p>{erpPlanTracking(plan)}</p>
            <Facts
              items={[
                { label: 'Plan status', value: PLAN_STATUS_LABEL[plan.status] || plan.status },
                { label: 'ERP start reference', value: stamp(plan.plannedStartAt) },
                autoTrip
                  ? { label: 'GPS status', value: STATUS_LABEL[autoTrip.status] || autoTrip.status }
                  : null,
                plan.expectedFreeAt
                  ? { label: 'Expected vehicle availability', value: stamp(plan.expectedFreeAt) }
                  : null,
                autoTrip
                  ? {
                      label: 'GPS trip',
                      value: <Link to={`/auto-trips/${autoTrip._id}`}>View GPS trip</Link>,
                    }
                  : null,
                autoTrip
                  ? { label: 'Pickup departure', value: stamp(autoTrip.pickup?.departedAt) }
                  : null,
                autoTrip ? { label: 'Drop arrival', value: stamp(autoTrip.drop?.arrivedAt) } : null,
                autoTrip?.km?.laden != null
                  ? { label: 'Laden distance', value: `${autoTrip.km.laden} km` }
                  : null,
                plan.flags?.length
                  ? {
                      label: 'Exceptions',
                      value: plan.flags.map((f) => PLAN_FLAG_LABEL[f] || f).join(' · '),
                    }
                  : null,
                plan.reconciledAt
                  ? { label: 'Last reconciled', value: stamp(plan.reconciledAt) }
                  : null,
              ]}
            />
            <Link to="/auto-trips/plans">Review trip associations</Link>
            <p>
              GPS evidence does not advance the ERP trip. Detection may arrive after live site
              visits.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
