import { useState } from 'react';
import { Link } from 'react-router-dom';
import Ico from '../../routeHubIcons.jsx';
import { Empty, Seg, Skel } from '../../routeHubShared.jsx';
import { fmtDT, inr } from '../../routeHubFormat';
import { clock, costBasisLabel, legLabel, tripLabel } from './deviationRules.js';
import { timelineModel } from './deviationMapModel.js';
import DeviationMap from './DeviationMap.jsx';
import DeviationTimeline from './DeviationTimeline.jsx';
import DeviationReview from './DeviationReview.jsx';

const ZOOMS = [
  { value: 'detour', label: 'Detour' },
  { value: 'trip', label: 'Whole trip' },
];

const km = (n, digits = 1) => (n == null ? '—' : `${Number(n).toFixed(digits)} km`);

function Fact({ k, v, tone }) {
  return (
    <div>
      <div className="k">{k}</div>
      <div className="v" style={tone ? { color: tone } : undefined}>
        {v}
      </div>
    </div>
  );
}

/**
 * The selected deviation: which trip it was on, the map of the trip with the
 * detour highlighted, a timeline of the trip, the facts, and the review action.
 * `row` is the feed row (shown at once); `detail` arrives from the detail call.
 */
export default function DeviationDetail({
  row,
  detail,
  loading,
  error,
  siblings,
  onSelect,
  onReview,
  reviewBusy,
  go,
}) {
  const [zoom, setZoom] = useState('detour');

  if (!row) {
    return (
      <div className="card detailmap">
        <Empty title="No deviation selected" sub="Pick one from the list to see it on the map." />
      </div>
    );
  }

  const trip = row.trip;
  const tripId = trip?.autoTripId ? String(trip.autoTripId) : null;
  const event = detail?.event || row;
  const exitAt = detail?.detour?.exitPoint?.at || event.startedAt;
  const rejoinAt = detail?.detour?.rejoinPoint?.at || event.endedAt;

  return (
    <div className="card detailmap">
      <div className="card-head dev-head">
        <span className="plate">{row.registrationNumber}</span>
        <div className="dev-head-t">
          <h3>{trip ? tripLabel(trip) : 'Outside any trip'}</h3>
          <span className="muted">
            {trip
              ? `${legLabel(trip)} · trip started ${trip.tripStartAt ? fmtDT(new Date(trip.tripStartAt)) : '—'}`
              : row.corridorLabel || 'No trip was running when this happened'}
          </span>
        </div>
        <span className="sp" />
        {tripId ? (
          <>
            <Link className="btn btn--sm" to={`/auto-trips/${tripId}?deviation=${row._id}`}>
              <Ico n="route" s={12} />
              Open trip
            </Link>
            <Link className="btn btn--sm" to={`/auto-trips/${tripId}?play=1`}>
              <Ico n="play" s={12} />
              Replay
            </Link>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => go('replay', { v: row.registrationNumber })}
          >
            <Ico n="play" s={12} />
            Replay vehicle
          </button>
        )}
      </div>

      <div className="mapbox" style={{ minHeight: 420 }}>
        <DeviationMap detail={detail} zoom={zoom} />
        <div className="ov" style={{ top: 12, left: 12 }}>
          <Seg options={ZOOMS} value={zoom} onChange={setZoom} />
        </div>
        {loading && !detail ? (
          <div className="ov chipcard" style={{ top: 12, right: 12 }}>
            Loading the trip…
          </div>
        ) : null}
        {error ? (
          <div className="ov chipcard" style={{ top: 12, right: 12, color: '#C56200' }}>
            Could not load the map for this deviation.
          </div>
        ) : null}
        <div className="ov chipcard legend" style={{ bottom: 14, left: 14 }}>
          <span>
            <i className="dot" style={{ background: '#8B8B8C' }} />
            Usual route
            {detail?.corridor?.sampleCount ? ` (from ${detail.corridor.sampleCount} trips)` : ''}
          </span>
          {trip ? (
            <span>
              <i style={{ background: '#828BAE' }} />
              Empty
            </span>
          ) : null}
          <span>
            <i style={{ background: '#2F58EE' }} />
            {trip ? 'Loaded' : 'Driven'}
          </span>
          <span>
            <i style={{ background: '#C2323A' }} />
            Off usual route
          </span>
        </div>
      </div>

      {detail ? (
        <DeviationTimeline model={timelineModel(detail, siblings)} onSelect={onSelect} />
      ) : (
        <div className="dev-tl">
          <Skel h={10} />
        </div>
      )}

      <div className="perkm dev-facts">
        <Fact k="Left usual route" v={exitAt ? clock(exitAt) : '—'} />
        <Fact k="Back on usual route" v={rejoinAt ? clock(rejoinAt) : 'Not seen'} />
        <Fact k="Off route for" v={event.durationMin != null ? `${event.durationMin} min` : '—'} />
        <Fact k="Farthest off" v={km(event.maxOffKm)} />
        <Fact
          k="Extra distance (est.)"
          v={event.extraKmEstimate != null ? `+${km(event.extraKmEstimate)}` : '—'}
        />
        <Fact
          k={`Extra cost (est., ${costBasisLabel(event)})`}
          v={event.estimatedExtraCostInr != null ? inr(event.estimatedExtraCostInr) : '—'}
          tone="#C2323A"
        />
      </div>

      <DeviationReview key={event._id} event={event} busy={reviewBusy} onReview={onReview} />
    </div>
  );
}
