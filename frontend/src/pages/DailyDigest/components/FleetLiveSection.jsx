import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Search, Truck } from 'lucide-react';
import { formatAgo } from '../../../utils/redesign/format';
import { trackLink, tripLink } from '../../../utils/redesign/links';

const FleetOverviewMap = lazy(() => import('./FleetOverviewMap'));
const regKey = (reg) => (reg || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
const STATUS = { moving: 'Moving', stopped: 'Stopped', idling: 'Idling', offline: 'Offline' };

export default function FleetLiveSection({ fleet, live, trips }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const tripByReg = useMemo(() => {
    const index = new Map();
    // Newest routes arrive first; keep the first open route for each truck.
    for (const trip of trips.data?.items || []) {
      const key = regKey(trip.registrationNumber);
      if (!index.has(key)) index.set(key, trip);
    }
    return index;
  }, [trips.data]);
  const visible = fleet.vehicles.filter(
    (v) =>
      (filter === 'all' || v.status === filter) &&
      `${v.plate} ${v.area || ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  const mapVehicles = visible.filter(
    (v) =>
      v.hasFix &&
      Number.isFinite(v.lat) &&
      Number.isFinite(v.lng) &&
      Math.abs(v.lat) <= 90 &&
      Math.abs(v.lng) <= 180,
  );
  const selected = visible.find((v) => v.id === selectedId);
  const selectedTrip = selected ? tripByReg.get(regKey(selected.plate)) : null;

  return (
    <section className="fo-panel fo-live" aria-labelledby="fo-live-title">
      <div className="fo-section-head">
        <div>
          <div className="fo-eyebrow">
            <span className={`fo-signal ${live.error ? 'fo-signal--muted' : ''}`} />
            Live operations
          </div>
          <h2 id="fo-live-title">Your fleet, in view</h2>
          <p>Current positions and open trips · independent of the report date</p>
        </div>
        <Link className="fo-text-link" to="/live-tracking">
          Open live tracking <ArrowUpRight size={16} />
        </Link>
      </div>
      {live.error ? (
        <div className="fo-inline-warning" role="status">
          Live positions could not refresh.
          {fleet.vehicles.length ? ' Showing the last received positions.' : ''}{' '}
          <button type="button" onClick={live.refresh}>
            Retry
          </button>
        </div>
      ) : null}
      <div className="fo-live-layout">
        <div className="fo-map" aria-label="Fleet map">
          {live.isLoading && !fleet.vehicles.length ? (
            <div className="fo-map-state" role="status">
              Loading vehicle positions…
            </div>
          ) : !mapVehicles.length ? (
            <div className="fo-map-state">
              <MapPin size={28} />
              <strong>No positions to display</strong>
              <span>
                {query || filter !== 'all'
                  ? 'Try another vehicle or status filter.'
                  : 'Vehicles appear when GPS positions are available.'}
              </span>
            </div>
          ) : (
            <Suspense fallback={<div className="fo-map-state">Loading fleet map…</div>}>
              <FleetOverviewMap
                vehicles={mapVehicles}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </Suspense>
          )}
          <div className="fo-map-legend">
            <span>{mapVehicles.length} on map</span>
            <span>
              <i className="fo-dot fo-dot--moving" />
              Moving
            </span>
            <span>
              <i className="fo-dot fo-dot--stopped" />
              Stopped
            </span>
            <span>
              <i className="fo-dot fo-dot--offline" />
              Last known
            </span>
          </div>
        </div>
        <div className="fo-fleet-list">
          <div className="fo-fleet-tools">
            <div className="fo-list-heading">
              <h3>Vehicles</h3>
              <span>{visible.length}</span>
            </div>
            <label className="fo-search">
              <Search size={16} />
              <input
                aria-label="Search fleet vehicles"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vehicle or location"
              />
            </label>
            <div className="fo-filters" role="group" aria-label="Vehicle status">
              {['all', 'moving', 'idling', 'stopped', 'offline'].map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={filter === status}
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'All' : STATUS[status]}
                </button>
              ))}
            </div>
          </div>
          <div className="fo-vehicle-scroll">
            {!visible.length ? (
              <div className="fo-empty">
                <Truck size={24} />
                <p>{live.isLoading ? 'Loading vehicles…' : 'No vehicles match this view.'}</p>
              </div>
            ) : (
              visible.map((vehicle) => {
                const trip = tripByReg.get(regKey(vehicle.plate));
                return (
                  <button
                    className="fo-vehicle"
                    type="button"
                    key={vehicle.id}
                    aria-pressed={selectedId === vehicle.id}
                    onClick={() => setSelectedId(vehicle.id)}
                  >
                    <span className="fo-vehicle-top">
                      <strong>{vehicle.plate}</strong>
                      <span className={`fo-status fo-status--${vehicle.status}`}>
                        <i className={`fo-dot fo-dot--${vehicle.status}`} />
                        {STATUS[vehicle.status] || 'Unknown'}
                      </span>
                    </span>
                    <span className="fo-vehicle-location">
                      <MapPin size={13} />
                      {vehicle.area ||
                        (vehicle.hasFix
                          ? `${vehicle.lat.toFixed(3)}, ${vehicle.lng.toFixed(3)}`
                          : 'Location unavailable')}
                    </span>
                    <span className="fo-vehicle-route">
                      {trip
                        ? `${trip.pickup?.name || 'Pickup unknown'} → ${trip.drop?.name || 'Destination not confirmed'}`
                        : trips.error
                          ? 'Trip information unavailable'
                          : trips.loading
                            ? 'Loading route…'
                            : 'No route in loaded open trips'}
                    </span>
                    <span className="fo-vehicle-meta">
                      {vehicle.lastFixAt
                        ? `Updated ${formatAgo(vehicle.lastFixAt)}`
                        : 'No GPS update'}
                      {vehicle.speed != null ? ` · ${vehicle.speed} km/h` : ''}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="fo-fleet-footer">
            {selected ? (
              <>
                <strong>{selected.plate}</strong>
                <Link
                  className="fo-text-link"
                  to={
                    selectedTrip ? tripLink(selectedTrip._id) : trackLink({ reg: selected.plate })
                  }
                >
                  {selectedTrip ? 'Open trip' : 'Track vehicle'} <ArrowUpRight size={14} />
                </Link>
              </>
            ) : (
              <span>Select a vehicle to locate it on the map.</span>
            )}
          </div>
          {trips.data?.total > (trips.data?.items?.length || 0) ? (
            <p className="fo-list-note">
              Routes from the latest {trips.data.items.length} open trips.{' '}
              <Link to="/auto-trips?status=OPEN">View all {trips.data.total}</Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
