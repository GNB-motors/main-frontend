import { useEffect, useState } from 'react';
import TripDashboardService from '../TripDashboardService';
import { TollsService } from '../../../services/TollsService';
import {
  NO_LANE_HISTORY,
  NO_LANE_KNOWN,
  NO_TOUR,
  NO_TRUCK,
  TOLL_UNAVAILABLE,
  formatStopTime,
  laneTimeLabel,
  pickTourForTrip,
  tollQuoteLabel,
  tourStops,
} from './laneFactsModel';

/** A site is either an id or the populated site (name + centroid). */
const idOf = (site) => (typeof site === 'string' ? site : site?._id || null);

const centroidOf = (site) => {
  const lat = Number(site?.centroidLat);
  const lng = Number(site?.centroidLng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

/**
 * Lane, toll and tour for one trip.
 *
 * Three best-effort reads, each answering a question a dispatcher actually
 * asks: how long does this lane normally take, what will the toll cost, and
 * which cycle is this trip part of. Every one of them can be unknown, and
 * each says so in words — never ₹0, never "0 h".
 */
export default function LaneFactsPanel({ data }) {
  const originSiteId = idOf(data?.pickupSiteId);
  const destinationSiteId = idOf(data?.dropSiteId);
  const from = centroidOf(data?.pickupSiteId);
  const to = centroidOf(data?.dropSiteId);
  const vehicleId = data?.vehicleId || null;

  const [lane, setLane] = useState({ state: 'loading', label: null });
  const [toll, setToll] = useState({ state: 'loading', label: null });
  const [tour, setTour] = useState({ state: 'loading', tour: null });

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    // Lane: how long this pair of sites normally takes.
    if (originSiteId && destinationSiteId) {
      TripDashboardService.getCorridorStats({
        originSiteId,
        destinationSiteId,
        signal: controller.signal,
      })
        .then((payload) => {
          if (alive) setLane({ state: 'ready', label: laneTimeLabel(payload) });
        })
        .catch(() => {
          if (alive) setLane({ state: 'ready', label: null });
        });
    } else {
      setLane({ state: 'ready', label: null });
    }

    // Toll: a quote for the two ends of the trip.
    if (from && to) {
      TollsService.quote(
        {
          fromLat: from.lat,
          fromLng: from.lng,
          toLat: to.lat,
          toLng: to.lng,
        },
        controller.signal,
      )
        .then((payload) => {
          if (alive) setToll({ state: 'ready', label: tollQuoteLabel(payload) });
        })
        .catch(() => {
          // The road engine may be down. That is "unavailable", not ₹0.
          if (alive) setToll({ state: 'ready', label: null });
        });
    } else {
      setToll({ state: 'ready', label: null });
    }

    // Tour: the cycle this trip belongs to.
    if (vehicleId) {
      TripDashboardService.getVehicleTours({ vehicleId, signal: controller.signal })
        .then((payload) => {
          if (alive) setTour({ state: 'ready', tour: pickTourForTrip(payload, data?._id) });
        })
        .catch(() => {
          if (alive) setTour({ state: 'ready', tour: null });
        });
    } else {
      setTour({ state: 'ready', tour: null });
    }

    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originSiteId, destinationSiteId, from?.lat, from?.lng, to?.lat, to?.lng, vehicleId]);

  const laneText =
    lane.state === 'loading'
      ? '—'
      : !originSiteId || !destinationSiteId
        ? NO_LANE_KNOWN
        : lane.label || NO_LANE_HISTORY;
  const tollText = toll.state === 'loading' ? '—' : toll.label || TOLL_UNAVAILABLE;
  const stops = tourStops(tour.tour);

  return (
    <section className="trip360-panel">
      <div className="trip360-panel-head">Lane, toll &amp; tour</div>
      <div className="trip360-panel-body">
        <dl className="trip360-kv">
          <dt>Lane</dt>
          <dd>{laneText}</dd>
          <dt>Toll</dt>
          <dd>{tollText}</dd>
        </dl>
        <dl className="trip360-kv">
          <dt>Tour</dt>
          <dd>
            {tour.state === 'loading' ? (
              '—'
            ) : !vehicleId ? (
              NO_TRUCK
            ) : stops.length === 0 ? (
              NO_TOUR
            ) : (
              <ol style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {stops.map((stop, index) => (
                  <li key={`${stop.from}-${stop.departedAt}-${index}`}>
                    <strong>{stop.from}</strong> → {stop.to}
                    <br />
                    {formatStopTime(stop.departedAt) || '—'} –{' '}
                    {formatStopTime(stop.arrivedAt) || '—'}
                    {stop.km != null ? ` · ${stop.km} km` : ''}
                  </li>
                ))}
              </ol>
            )}
          </dd>
        </dl>
      </div>
    </section>
  );
}
