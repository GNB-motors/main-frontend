import { useCallback, useMemo, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import AutoTripService from '../../services/AutoTripService';
import RoadService from '../../services/RoadService';
import { getUserRole } from '../../utils/session.js';
import { dropLabel } from '../PlaceHub/intelligence/facilityText';
import AutoTripReplay from './AutoTripReplay';
import AutoTripTimeline from './AutoTripTimeline';
import {
  FLAG_LABEL,
  LONG_PLANT_MIN,
  STATUS_CLASS,
  STATUS_LABEL,
  answerPlaceHref,
  fmtDayTime,
  fmtDuration,
  fmtKm,
  inWindow,
  notReachedYet,
  stopsOnWayText,
  timelinePlan,
  tripDateRange,
} from './autoTripModel';
import './AutoTrips.css';

/** Confirm, dismiss and drop fixes are owner/manager actions on the server. */
const CAN_EDIT = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];

function Field({ label, children, mono = false, warn = false }) {
  return (
    <div className="atx-field">
      <span className="atx-field-label">{label}</span>
      <span className={`atx-field-value${mono ? ' is-mono' : ''}${warn ? ' is-warn' : ''}`}>
        {children}
      </span>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="atx-page atx-page--detail">
      <div className="atx-wrap">
        <Link to="/auto-trips" className="atx-back">
          ← All trips
        </Link>
        {children}
      </div>
    </div>
  );
}

export default function AutoTripDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPlay = searchParams.get('play') === '1';
  const replayRef = useRef(null);
  const canEdit = CAN_EDIT.includes(getUserRole());

  const {
    data: trip,
    loading,
    error,
    refetch,
  } = useApi((signal) => AutoTripService.get(id, { signal }), [id]);
  const {
    data: track,
    loading: trackLoading,
    error: trackError,
    refetch: refetchTrack,
  } = useApi((signal) => AutoTripService.track(id, { signal }), [id]);
  // The road our engine matched for the same window: the replay draws the road, never a GPS jump.
  const { data: roadTrail } = useApi(
    (signal) =>
      RoadService.getRoadTrailIfEnabled(
        track.registrationNumber,
        { from: track.from, to: track.to },
        signal,
      ),
    [track?.registrationNumber, track?.from, track?.to],
    { enabled: Boolean(track?.registrationNumber && track?.from && track?.to) },
  );

  const confirmM = useMutation(AutoTripService.confirm);
  const dropM = useMutation(AutoTripService.drop);
  const dismissM = useMutation(AutoTripService.dismiss);
  const busy = confirmM.loading || dropM.loading || dismissM.loading;

  const act = useCallback(
    async (fn, payload, okMsg) => {
      try {
        const res = await fn(payload);
        toast.success(okMsg);
        // The structure-changing actions queue a background recompute (contract §1).
        if (res?.recompute?.queued) toast.info('Recalculating the affected trucks…');
        refetch();
        refetchTrack();
      } catch (e) {
        const raw = `${e?.message || e?.detail || ''} ${e?.code || ''}`;
        toast.error(
          /NO_STOP_IN_TRIP/i.test(raw)
            ? 'That place has no stop inside this trip — pick a stop in the timeline instead.'
            : e?.message || e?.detail || 'Action failed',
        );
      }
    },
    [refetch, refetchTrack],
  );

  const plan = useMemo(() => timelinePlan(trip), [trip]);

  if (loading && !trip) {
    return (
      <Shell>
        <div className="atx-state">Loading the trip…</div>
      </Shell>
    );
  }
  if (error || !trip) {
    return (
      <Shell>
        <div className="atx-state">
          <span>Could not load this trip.</span>
          <button type="button" className="atx-btn atx-btn--sm" onClick={refetch}>
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  const frozen = Boolean(trip.frozenAt);
  const open = notReachedYet(trip);
  const answerHref = answerPlaceHref(trip);
  const plantMin = trip.durations?.plantMin;
  const hasTrack = (track?.points?.length || 0) > 1;
  const playable = (at) => hasTrack && inWindow(at, track);
  const playFrom = (at) => replayRef.current?.playFrom(at);

  const setDrop = (stop, markPlaceAsDrop) =>
    act(
      dropM.mutate,
      { id, stopId: stop._id, ...(markPlaceAsDrop ? { markPlaceAsDrop: true } : {}) },
      markPlaceAsDrop ? 'Drop set and the place saved as a drop place' : 'Drop updated',
    );

  return (
    <div className="atx-page atx-page--detail">
      <div className="atx-wrap">
        <div className="atx-head">
          <div className="atx-head-main">
            <Link to="/auto-trips" className="atx-back">
              ← All trips
            </Link>
            <div className="atx-plate-row">
              <h1 className="atx-plate-title">{trip.registrationNumber || 'Trip'}</h1>
              <span
                className={`atx-status atx-status--strong ${STATUS_CLASS[trip.status] || 'atx-status--open'}`}
              >
                {STATUS_LABEL[trip.status] || trip.status}
              </span>
              {frozen && trip.status !== 'CONFIRMED' && trip.status !== 'DISMISSED' ? (
                <span className="atx-chip">Locked</span>
              ) : null}
              {(trip.flags || []).map((f) => (
                <span key={f} className="atx-chip">
                  {FLAG_LABEL[f] || f}
                </span>
              ))}
            </div>
            <p className="atx-route-sub">
              {trip.pickup?.name || 'Pickup'} → {open ? 'not reached yet' : dropLabel(trip.drop)} ·{' '}
              {tripDateRange(trip)}
            </p>
            {answerHref && !frozen ? (
              <Link to={answerHref} className="atx-answer">
                Is this place a drop? Answer it on the Places page →
              </Link>
            ) : null}
          </div>

          {canEdit && !frozen ? (
            <div className="atx-actions">
              {trip.status !== 'DISMISSED' ? (
                <button
                  type="button"
                  className="atx-btn atx-btn--danger"
                  disabled={busy}
                  onClick={() => act(dismissM.mutate, { id }, 'Marked as not a real trip')}
                >
                  Not a real trip
                </button>
              ) : null}
              {trip.status !== 'CONFIRMED' ? (
                <button
                  type="button"
                  className="atx-btn atx-btn--primary"
                  disabled={busy}
                  onClick={() => act(confirmM.mutate, { id }, 'Trip confirmed')}
                >
                  <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                  Confirm trip
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="atx-grid">
          <div className="atx-card atx-card--clip atx-span-2">
            <AutoTripReplay
              ref={replayRef}
              trip={trip}
              track={track}
              roadTrail={roadTrail}
              loading={trackLoading}
              error={trackError}
              autoPlay={autoPlay}
            />
          </div>

          <div className="atx-card atx-summary">
            <h2 className="atx-card-title">Trip summary</h2>
            <div className="atx-fields">
              <Field label="Loaded at">{trip.pickup?.name || '—'}</Field>
              <Field label="Unloaded at">{open ? 'Not reached yet' : dropLabel(trip.drop)}</Field>
              <Field label="Left plant">{fmtDayTime(trip.pickup?.departedAt)}</Field>
              <Field label="Reached drop">{open ? '—' : fmtDayTime(trip.drop?.arrivedAt)}</Field>
            </div>
            <div className="atx-rule" />
            <div className="atx-fields">
              <Field mono label="Loaded run">
                {fmtKm(trip.km?.laden)}
              </Field>
              <Field mono label="Empty run to plant">
                {fmtKm(trip.km?.approach)}
              </Field>
              <Field mono label="Extra km for fuel">
                {fmtKm(trip.km?.fuelDetour)}
              </Field>
              <Field mono label="Driving time">
                {fmtDuration(trip.durations?.transitMin)}
              </Field>
              <Field mono label="Empty before loading">
                {fmtDuration(trip.durations?.approachMin)}
              </Field>
              <Field mono warn={(plantMin ?? 0) > LONG_PLANT_MIN} label="Time at plant">
                {fmtDuration(plantMin)}
              </Field>
            </div>
            <div className="atx-rule" />
            <Field label="Stops on the way">{stopsOnWayText(trip.stopsSummary)}</Field>
            {trip.extraDrops?.length || trip.erpTripId ? (
              <div className="atx-fields">
                {trip.extraDrops?.length ? (
                  <Field label="Further drops">{trip.extraDrops.length}</Field>
                ) : null}
                {trip.erpTripId ? (
                  <Field label="ERP trip">
                    <Link to={`/erp/trips/${trip.erpTripId}`} className="atx-answer">
                      {String(trip.erpTripId).slice(-6)}
                    </Link>
                  </Field>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <AutoTripTimeline
          plan={plan}
          canEdit={canEdit && !frozen}
          busy={busy}
          playable={playable}
          onPlay={playFrom}
          onSetDrop={setDrop}
        />
      </div>
    </div>
  );
}
