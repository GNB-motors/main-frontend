import { REPOSITION_INFO } from './tripLegModel';
import { formatEtaClock, matchKnownEta } from '../../lib/knownEta';
import {
  destinationOf,
  loadedMin,
  minutesOnRoad,
  shortDuration,
  titleCasePlace,
} from './tripListModel';

/** The trip list's cells that need more than one line of JSX. */

const DRIVER_REASONS = {
  UNASSIGNED: 'No driver was assigned to this truck when it left',
  AMBIGUOUS: 'Two drivers were assigned to this truck when it left',
  UNAVAILABLE: 'The driver lookup did not answer',
  DRIVER_NOT_FOUND: 'The assigned driver has no record',
  MISSING_VEHICLE: 'The truck is not linked to a vehicle record',
  MISSING_TIME: 'The trip has no departure time',
};

/** The driver's name, or a quiet dash whose tooltip says why there is none. */
export function DriverCell({ trip, onRetry }) {
  const driver = trip.driver;
  const name = driver?.name || driver?.mobileNumber;
  if (name) {
    return (
      <span className="atx-cell-text" title={driver.mobileNumber || name}>
        {titleCasePlace(name)}
      </span>
    );
  }
  const status = trip.driverResolution?.status;
  const why =
    DRIVER_REASONS[status] ||
    (driver ? 'The driver has no name on record' : 'No driver is linked to this trip');
  return (
    <span className="atx-cell-quiet">
      <span title={why}>No driver</span>
      {status === 'UNAVAILABLE' && onRetry ? (
        <button
          type="button"
          className="atx-inline-link"
          onClick={(event) => {
            event.stopPropagation();
            onRetry();
          }}
        >
          Retry
        </button>
      ) : null}
    </span>
  );
}

/** "Ambuja Dhulagor → Nimpura" on one line; the destination's state is muted. */
export function RouteCell({ trip, knownEtas }) {
  const from = trip.pickup?.name;
  const dest = destinationOf(trip);
  const eta = dest.state === 'moving' ? matchKnownEta(knownEtas, trip.registrationNumber) : null;
  const etaClock = eta?.destination?.label ? formatEtaClock(eta.p50) : null;
  const destText =
    eta?.destination?.label
      ? `to ${titleCasePlace(eta.destination.label)}${etaClock ? ` · ETA ${etaClock}` : ''}`
      : dest.text;
  const title = `${from || 'Pickup not recorded'} → ${dest.title || destText}`;
  return (
    <span className="atx-route" title={title}>
      <span className={`atx-route-from${from ? '' : ' atx-route-to--missing'}`}>
        {from ? titleCasePlace(from) : 'Pickup not recorded'}
      </span>
      <span className="atx-route-arrow" aria-hidden="true">
        →
      </span>
      <span className="atx-sr">to</span>
      <span className={`atx-route-to atx-route-to--${dest.state}`}>{destText}</span>
      {/* A plant-to-plant run is normal: plants work like warehouses. Badged, never flagged. */}
      {trip.leg === 'REPOSITION' ? (
        <span className="atx-route-tag" title={REPOSITION_INFO}>
          Plant to plant
        </span>
      ) : null}
    </span>
  );
}

/** Trip time: the loaded run once it ended, or how long the truck has been out. */
export function TimeCell({ trip, now }) {
  const run = loadedMin(trip);
  if (run != null) return <span className="atx-num">{shortDuration(run)}</span>;
  const out = minutesOnRoad(trip, now);
  if (out != null)
    return (
      <span className="atx-num atx-cell-quiet" title="Time since the truck left the plant">
        {shortDuration(out)} so far
      </span>
    );
  return <span className="atx-cell-quiet">—</span>;
}

