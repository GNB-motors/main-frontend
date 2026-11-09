import { useCallback, useMemo, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import AutoTripService from '../../services/AutoTripService';
import RoadService from '../../services/RoadService';
import { getWhereNext } from '../../services/fleetViewService.js';
import { getUserRole } from '../../utils/session.js';
import RouteSapCard from '../Sap/RouteSapCard';
import RouteHubService from '../../services/RouteHubService';
import TripDeviationsCard from './TripDeviationsCard';
import { detourSegments, deviationWindow } from './tripDeviations';
import AutoTripReplay from './AutoTripReplay';
import TripLegBar from './TripLegBar';
import TripStopList from './TripStopList';
import AutoTripTimeline from './AutoTripTimeline';
import TripStatus from './TripStatus';
import InfoTip from '../../components/redesign/InfoTip';
import { formatINR } from '../../utils/formatters';
import { destinationOf, minutesOnRoad, titleCasePlace } from './tripListModel';
import TripBackButton from './TripBackButton';
import { FLAG_LABEL, answerPlaceHref, inWindow } from './autoTripPlaces';
import { LONG_PLANT_MIN, timelinePlan } from './timelineModel';
import { legBarSegments } from './tripLegModel.js';
import { tollClassText, tollSummary, tollLedgerText, withTollPasses } from './tripTolls';
import {
  fmtDayTime,
  fmtDuration,
  fmtKm,
  notReachedYet,
  stopsOnWayText,
  fmtDateRange,
} from './autoTripFormat';
import './AutoTrips.css';
import './TripsWorkspace.css';
import './TripsRedesign.css';

/** Confirm, dismiss and drop fixes are owner/manager actions on the server. */
const CAN_EDIT = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];
/** Flags the route line already says in words ("drop not found", "guessed"). */
const DROP_FLAGS = ['DROP_UNKNOWN', 'DROP_INFERRED'];

function Field({ label, children, warn = false }) {
  return (
    <div className="atx-field">
      <span className="atx-field-label">{label}</span>
      <span className={`atx-field-value${warn ? ' is-warn' : ''}`}>{children}</span>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="atx-page atx-page--detail">
      <div className="atx-wrap">
        <TripBackButton />
        {children}
      </div>
    </div>
  );
}

export default function AutoTripDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPlay = searchParams.get('play') === '1';
  const focusDeviation = searchParams.get('deviation');
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

  // While the truck is still on the road, ask where it is most likely
  // heading; failure just leaves the line out.
  const tripIsOpen = Boolean(trip) && notReachedYet(trip);
  const { data: whereNext } = useApi(
    (signal) => getWhereNext(trip?.registrationNumber, { signal }),
    [tripIsOpen ? trip?.registrationNumber : null],
    { enabled: tripIsOpen && Boolean(trip?.registrationNumber) },
  );

  // Route deviations are an owner/manager feed behind fleetIntelligence; any
  // failure (flag off, no access) just leaves the card out.
  const devWindow = deviationWindow(trip);
  const { data: deviationData, loading: deviationsLoading } = useApi(
    (signal) =>
      RouteHubService.getDeviationEvents({ autoTripId: id, ...devWindow, limit: 100 }, signal),
    [id, devWindow?.from, devWindow?.to],
    { enabled: canEdit && Boolean(devWindow) },
  );
  const deviations = deviationData?.records || null;
  // Toll plazas the truck drove through. Optional: the page works the same without them.
  const { data: tolls } = useApi((signal) => AutoTripService.tolls(id, { signal }), [id]);

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
        const raw = `${e?.message || ''} ${e?.code || ''}`;
        toast.error(
          /NO_STOP_IN_TRIP/i.test(raw)
            ? 'That place has no stop inside this trip — pick a stop in the timeline instead.'
            : e?.message || 'Action failed',
        );
      }
    },
    [refetch, refetchTrack],
  );

  const plan = useMemo(() => withTollPasses(timelinePlan(trip), tolls?.passes), [trip, tolls]);

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
  // "Heading to <place> · ~<km> km · ETA <time>" — parts the prediction lacks
  // are omitted; nothing renders without a candidate place.
  const nextDest = open ? (whereNext?.destinations?.[0] ?? null) : null;
  const nextLine = nextDest?.place?.name
    ? [
        `Heading to ${nextDest.place.name}`,
        nextDest?.route?.km != null ? `~${Math.round(Number(nextDest.route.km))} km` : null,
        // An ETA already in the past is a prediction from stale data, not a time to show.
        nextDest?.eta?.at && new Date(nextDest.eta.at).getTime() > Date.now()
          ? `ETA ${fmtDayTime(nextDest.eta.at)}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;
  const answerHref = answerPlaceHref(trip);
  const plantMin = trip.durations?.plantMin;
  // A summary group is only worth a divider when at least one of its rows has
  // a real value — never render an empty row.
  const runKm = trip.km?.ladenOdo ?? trip.km?.laden;
  const runTime = trip.durations?.ladenMin ?? trip.durations?.transitMin;
  const hasRunGroup =
    runKm != null ||
    trip.km?.approach != null ||
    trip.km?.return != null ||
    trip.km?.fuelDetour != null ||
    runTime != null ||
    (trip.extraDrops?.length && trip.durations?.transitMin != null) ||
    trip.durations?.approachMin != null ||
    plantMin != null;
  const hasTrack = (track?.points?.length || 0) > 1;
  const playable = (at) => hasTrack && inWindow(at, track);
  const playFrom = (at) => replayRef.current?.playFrom(at);
  const tollText =
    tollSummary(tolls) ||
    (tolls?.status === 'OK'
      ? 'No toll plazas on this run'
      : tolls?.status === 'FALLBACK'
        ? 'None found yet — road not matched'
        : null);

  const setDrop = (stop, markPlaceAsDrop) =>
    act(
      dropM.mutate,
      { id, stopId: stop._id, ...(markPlaceAsDrop ? { markPlaceAsDrop: true } : {}) },
      markPlaceAsDrop ? 'Drop set and the place saved as a drop place' : 'Drop updated',
    );

  const dest = destinationOf(trip);
  // The route line already says "drop not found" / "guessed"; only other checks get a chip.
  const dropFlag = (trip.flags || []).some((f) => DROP_FLAGS.includes(f));
  const checkFlags = (trip.flags || []).filter(
    (f) => !DROP_FLAGS.includes(f) && !(dropFlag && f === 'PICKUP_TO_PICKUP'),
  );
  const lastDrop = trip.extraDrops?.length
    ? trip.extraDrops[trip.extraDrops.length - 1]
    : trip.drop;
  const onRoadMin = minutesOnRoad(trip);
  const economics = Object.values(trip.roleEconomics || {}).filter(
    (leg) => leg && typeof leg === 'object',
  );
  const hasCost = Number.isFinite(trip.totalCostInr);
  const costReason = hasCost
    ? 'Estimated running cost; breakdown unavailable.'
    : trip.economicsAvailability?.reason ||
      (trip.status === 'OPEN'
        ? 'Cost calculation pending while the trip is running.'
        : ['COMPLETE', 'CONFIRMED'].includes(trip.status)
          ? 'Cost calculation unavailable for this completed trip.'
          : 'Cost calculation unavailable until the drop is resolved.');
  const fuelInr = economics.reduce((a, leg) => a + (Number(leg?.fuelInr) || 0), 0);
  const wearInr = economics.reduce((a, leg) => a + (Number(leg?.wearInr) || 0), 0);
  const hasBreakdown = economics.some(
    (leg) => Number.isFinite(leg.fuelInr) || Number.isFinite(leg.wearInr),
  );
  const driverName = trip.driver?.name || trip.driver?.mobileNumber;

  return (
    <div className="atx-page atx-page--detail">
      <div className="atx-wrap">
        <div className="atx-head">
          <div className="atx-detail-heading">
            <TripBackButton />
            <div className="atx-head-main">
              <div className="atx-plate-row">
                <h1 className="atx-plate-title">{trip.registrationNumber || 'Trip'}</h1>
                <TripStatus status={trip.status} />
                {frozen && trip.status !== 'CONFIRMED' && trip.status !== 'DISMISSED' ? (
                  <span className="atx-chip">Locked</span>
                ) : null}
                {checkFlags.map((f) => (
                  <span key={f} className="atx-chip atx-chip--watch">
                    {FLAG_LABEL[f] || f}
                  </span>
                ))}
              </div>
              <p className="atx-route-sub">
                <span title={trip.pickup?.name || undefined}>
                  {trip.pickup?.name ? titleCasePlace(trip.pickup.name) : 'Pickup not recorded'}
                </span>
                <span className="atx-sep" aria-hidden="true">
                  →
                </span>
                <span className={`atx-route-to--${dest.state}`} title={dest.title || undefined}>
                  {dest.text}
                </span>
                <span className="atx-sep" aria-hidden="true">
                  ·
                </span>
                <span>
                  {fmtDateRange(
                    trip.pickup?.arrivedAt || trip.pickup?.departedAt,
                    open ? null : lastDrop?.arrivedAt,
                  ) || 'Date not recorded'}
                </span>
                {answerHref && !frozen ? (
                  <>
                    <span className="atx-sep" aria-hidden="true">
                      ·
                    </span>
                    <Link to={answerHref} className="atx-answer">
                      Is this place a drop? Answer it on Places
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
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

        <dl className="atx-facts" aria-label="Trip at a glance">
          <div className="atx-fact">
            <dt>Left plant</dt>
            <dd className={trip.pickup?.departedAt ? '' : 'is-quiet'}>
              {trip.pickup?.departedAt ? fmtDayTime(trip.pickup.departedAt) : '—'}
            </dd>
            <small>
              {plantMin != null || trip.pickup?.dwellMin != null
                ? `${fmtDuration(plantMin ?? trip.pickup.dwellMin)} at the plant`
                : 'time at plant not recorded'}
            </small>
          </div>
          <div className="atx-fact">
            <dt>{trip.extraDrops?.length ? 'Last drop' : 'Arrived at drop'}</dt>
            <dd className={lastDrop?.arrivedAt && !open ? '' : 'is-quiet'}>
              {lastDrop?.arrivedAt && !open ? fmtDayTime(lastDrop.arrivedAt) : '—'}
            </dd>
            <small>
              {open
                ? nextLine || 'still on the way'
                : lastDrop?.arrivedAt
                  ? trip.extraDrops?.length
                    ? `${trip.extraDrops.length + 1} drops`
                    : dest.text
                  : dest.text}
            </small>
          </div>
          <div className="atx-fact">
            <dt>Loaded run</dt>
            <dd className={runKm != null ? '' : 'is-quiet'}>
              {runKm != null ? fmtKm(runKm) : '—'}
            </dd>
            <small>
              {runKm == null
                ? 'needs a known drop'
                : trip.km?.ladenOdo != null
                  ? 'from the odometer'
                  : 'from the GPS path'}
            </small>
          </div>
          <div className="atx-fact">
            <dt>Running time</dt>
            <dd className={runTime != null ? '' : 'is-quiet'}>
              {runTime != null
                ? fmtDuration(runTime)
                : onRoadMin != null
                  ? fmtDuration(onRoadMin)
                  : '—'}
            </dd>
            <small>
              {runTime != null
                ? 'plant to last drop'
                : onRoadMin != null
                  ? 'since it left, so far'
                  : 'needs a known drop'}
            </small>
          </div>
          <div className="atx-fact">
            <dt>Driver</dt>
            <dd className={driverName ? '' : 'is-quiet'} title={driverName || undefined}>
              {driverName ? titleCasePlace(driverName) : 'No driver'}
            </dd>
            <small>
              {driverName ? (
                trip.driver?.mobileNumber || 'assigned when it left'
              ) : trip.driverResolution?.status === 'UNAVAILABLE' ? (
                <>
                  driver lookup did not answer{' '}
                  <button type="button" className="atx-inline-link" onClick={refetch}>
                    Retry
                  </button>
                </>
              ) : (
                'no driver is linked to this trip'
              )}
            </small>
          </div>
          <div className="atx-fact">
            <dt>
              Running cost
              <InfoTip
                text="Fuel and wear for each leg of this trip: the empty run to the plant, the loaded run and the return. An estimate, not a bill."
                label="How running cost is estimated"
              />
            </dt>
            <dd className={hasCost ? '' : 'is-quiet'}>
              {hasCost ? formatINR(trip.totalCostInr) : '—'}
            </dd>
            <small>
              {hasCost && hasBreakdown
                ? `fuel ${formatINR(fuelInr)} · wear ${formatINR(wearInr)}`
                : costReason}
            </small>
          </div>
        </dl>

        <div className="atx-detail-main">
          <div className="atx-detail-map">
            <div className="atx-card atx-card--clip">
              <AutoTripReplay
                ref={replayRef}
                trip={trip}
                track={track}
                roadTrail={roadTrail}
                detours={detourSegments(track?.points, deviations)}
                tolls={tolls}
                loading={trackLoading}
                error={trackError}
                autoPlay={autoPlay}
              />
            </div>
          </div>
          <div className="atx-detail-tl">
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

        <div className="atx-detail-more">
          <div className="atx-card atx-summary">
            <h2 className="atx-card-title">Trip details</h2>
            <div className="atx-fields">
              <Field label="Loaded at">
                {trip.pickup?.name ? titleCasePlace(trip.pickup.name) : 'Not recorded'}
              </Field>
              <Field label="Unloaded at">
                {dest.state === 'reached'
                  ? dest.text
                  : open
                    ? 'Not reached yet'
                    : `${dest.text.charAt(0).toUpperCase()}${dest.text.slice(1)}`}
              </Field>
              {trip.material ? <Field label="Material">{trip.material}</Field> : null}
              {trip.tonnage != null ? <Field label="Tonnage">{`${trip.tonnage} t`}</Field> : null}
              {trip.extraDrops?.length && trip.drop?.arrivedAt ? (
                <Field label="First drop at">{fmtDayTime(trip.drop.arrivedAt)}</Field>
              ) : null}
            </div>
            {legBarSegments(trip).length ? (
              <>
                <div className="atx-rule" />
                <div className="atx-fields">
                  {/* The legs, as a bar in the leg colours (F8.5). */}
                  <div className="atx-field">
                    <div className="atx-field-label">Distance by leg</div>
                    <TripLegBar trip={trip} />
                  </div>
                </div>
              </>
            ) : null}
            {hasRunGroup ? (
              <>
                <div className="atx-rule" />
                <div className="atx-fields">
                  {runTime != null ? (
                    <Field label="Loaded running time">{fmtDuration(runTime)}</Field>
                  ) : null}
                  {trip.km?.approach != null ? (
                    <Field label="Empty run to plant">{fmtKm(trip.km.approach)}</Field>
                  ) : null}
                  {trip.km?.return != null ? (
                    <Field label="Return to plant">{fmtKm(trip.km.return)}</Field>
                  ) : null}
                  {trip.km?.fuelDetour != null ? (
                    <Field label="Extra km for fuel">{fmtKm(trip.km.fuelDetour)}</Field>
                  ) : null}
                  {/* The loaded run covers every drop, so its time must too (audit TR-01):
                      transitMin stops at the FIRST drop. */}
                  {trip.extraDrops?.length && trip.durations?.transitMin != null ? (
                    <Field label="To first drop">{fmtDuration(trip.durations.transitMin)}</Field>
                  ) : null}
                  {trip.durations?.approachMin != null ? (
                    <Field label="Empty before loading">
                      {fmtDuration(trip.durations.approachMin)}
                    </Field>
                  ) : null}
                  {plantMin != null ? (
                    <Field warn={plantMin > LONG_PLANT_MIN} label="Time at plant">
                      {`${fmtDuration(plantMin)}${plantMin > LONG_PLANT_MIN ? ' · long wait' : ''}`}
                    </Field>
                  ) : null}
                </div>
              </>
            ) : null}
            <div className="atx-rule" />
            <div className="atx-fields">
              {trip.stopsSummary ? (
                <Field label="Stops on the way">{stopsOnWayText(trip.stopsSummary)}</Field>
              ) : null}
              {tollText ? <Field label="Tolls on the way">{tollText}</Field> : null}
              {tollSummary(tolls, 'RETURN') ? (
                <Field label="Tolls on the way back">{tollSummary(tolls, 'RETURN')}</Field>
              ) : null}
              {tollLedgerText(tolls) ? (
                <Field label="Toll ledger (after bill reconciliation)">
                  {tollLedgerText(tolls)}
                </Field>
              ) : null}
              {tollClassText(tolls) ? (
                <Field label="Toll class">{tollClassText(tolls)}</Field>
              ) : null}
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
            {/* The plant visit, with the reason for each stop (F8.5). Clicking a row
                opens Track at that stop. */}
            {trip.stops?.length ? (
              <div className="atx-field">
                <div className="atx-field-label">Stops at the plant</div>
                <TripStopList stops={trip.stops} registrationNumber={trip.registrationNumber} />
              </div>
            ) : null}
          </div>
          <div className="atx-detail-side">
            <RouteSapCard key={id} trip={trip} />
            {canEdit ? (
              <TripDeviationsCard
                deviations={deviations}
                loading={deviationsLoading}
                playable={playable}
                onPlay={playFrom}
                focusId={focusDeviation}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
