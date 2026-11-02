import { useState } from 'react';
import { Link } from 'react-router-dom';
import Ico from '../../routeHubIcons.jsx';
import { Empty, Seg, Skel } from '../../routeHubShared.jsx';
import { fmtDT } from '../../routeHubFormat';
import {
  clock,
  costBasisLabel,
  deviationGroupSubtitle,
  deviationGroupTitle,
  legLabel,
} from './deviationRules.js';
import { timelineModel } from './deviationMapModel.js';
import { deviationDetailModel } from './deviationDetailModel.js';
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
 *
 * The redesign's rules here: the header says which run it was and where it
 * went; the button says "See on map" and opens Track mode; the cost is an
 * em dash when it is unknown and never a zero; and the stops while the
 * truck was off its usual road are listed as FACTS - where and for how
 * long, with no reason and no judgement.
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
  const model = deviationDetailModel(detail, row);
  const exitAt = model.exitAt;
  const rejoinAt = model.rejoinAt;

  return (
    <div className="card detailmap">
      <div className="card-head dev-head">
        <span className="plate">{row.registrationNumber}</span>
        <div className="dev-head-t">
          <h3>{deviationGroupTitle(row)}</h3>
          <span className="muted">
            {model.header
              ? model.header
              : trip
                ? `${legLabel(trip)} · left the plant ${trip.ladenFrom ? fmtDT(new Date(trip.ladenFrom)) : '—'}`
                : deviationGroupSubtitle(row)}
          </span>
        </div>
        <span className="sp" />
        {model.replay?.to ? (
          <Link className="btn btn--sm" to={model.replay.to}>
            <Ico n="play" s={12} />
            See on map
          </Link>
        ) : tripId ? (
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
            See on map
          </button>
        )}
      </div>

      <div className="mapbox" style={{ minHeight: 420 }}>
        <DeviationMap detail={detail} zoom={zoom} />
        <div className="ov" style={{ top: 12, left: 12 }}>
          <Seg options={ZOOMS} value={zoom} onChange={setZoom} />
        </div>
        {model.noUsualRoadCaption ? (
          <div className="ov chipcard" style={{ top: 12, right: 12 }}>
            {model.noUsualRoadCaption}
          </div>
        ) : null}
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
            <i className="dot" style={{ background: '#9ca3af' }} />
            Usual route
            {detail?.corridor?.sampleCount ? ` (from ${detail.corridor.sampleCount} trips)` : ''}
            {detail?.corridor?.bandTruncated ? ' · band sampled' : ''}
          </span>
          {trip ? (
            <span>
              <i style={{ background: '#828BAE' }} />
              Empty
            </span>
          ) : null}
          <span>
            <i style={{ background: '#2563eb' }} />
            {trip ? 'Loaded' : 'Driven'}
          </span>
          <span>
            <i style={{ background: '#dc2626' }} />
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
        {event.offRouteKm != null ? (
          <Fact k="Driven off usual road" v={km(event.offRouteKm)} />
        ) : (
          <Fact k="Farthest off" v={km(event.maxOffKm)} />
        )}
        <Fact
          k="Extra distance (est.)"
          v={event.extraKmEstimate != null ? `+${km(event.extraKmEstimate)}` : '—'}
        />
        <Fact
          k={`Extra cost (est., ${costBasisLabel(event)})`}
          v={model.cost}
          tone="#C2323A"
        />
      </div>

      {/* Facts only: where it stopped while off the usual road, and for how
          long. No reason, no judgement - the owner decides. */}
      <div className="dev-stops">
        <h4 className="dev-stops__title">Stops while off the usual road</h4>
        {model.stopsDuring.length === 0 ? (
          <p className="dev-stops__empty">Didn&apos;t stop while off the usual road.</p>
        ) : (
          <ul className="dev-stops__list">
            {model.stopsDuring.map((stop) => (
              <li key={stop.key}>
                <span>
                  Stopped {stop.durationMin != null ? `${stop.durationMin} min` : '—'}
                  {stop.placeName ? ` near ${stop.placeName}` : ''}
                </span>
                <span className="dev-stops__time">
                  {stop.startAt ? clock(stop.startAt) : '—'}
                  {stop.endAt ? `–${clock(stop.endAt)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DeviationReview key={event._id} event={event} busy={reviewBusy} onReview={onReview} />
    </div>
  );
}
