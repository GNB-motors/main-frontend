import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import { L, useLeafletMap } from '../routeHubMap';
import { dkey } from '../routeHubFormat';
import RoadService from '../../../services/RoadService';
import { clipLayersAt, positionAt as roadPositionAt, toLatLngPairs } from '../../../lib/roadTrail';
import { replayWindow } from '../overspeedReplay';
import { DEFAULT_LIMIT_KMH, DEFAULT_DUR_MIN, PLAYBACK_BASE_SEC } from './replay/replayConstants.js';
import { windowForRange, tripWindow } from './replay/replayWindows.js';
import buildTrip from './replay/buildTrip.js';
import { travelledPieces } from './replay/replayPath.js';
import sampleAt from './replay/sampleAt.js';
import tripStats from './replay/tripStats.js';
import useReplayLayers from './replay/useReplayLayers.js';
import ReplayToolbar from './replay/ReplayToolbar.jsx';
import ReplayStatsHead from './replay/ReplayStatsHead.jsx';
import ReplayPerspectiveBar from './replay/ReplayPerspectiveBar.jsx';
import ReplayHud from './replay/ReplayHud.jsx';
import ReplayPlayer from './replay/ReplayPlayer.jsx';
import TripLog from './replay/TripLog.jsx';

export default function ReplayView({ params, toast }) {
  // Opened from the overspeed audit (?from&to&at&limit&dur): that window, at that event.
  const linked = useMemo(() => replayWindow(params), [params]);
  const limitKmh = linked?.limitKmh || DEFAULT_LIMIT_KMH;
  const durMin = linked?.durMin || DEFAULT_DUR_MIN;
  const [vehicles, setVehicles] = useState([]);
  const [reg, setReg] = useState('');
  const [range, setRange] = useState(linked ? 'custom' : 'today');
  const [from, setFrom] = useState(dkey(linked?.from || new Date()));
  const [to, setTo] = useState(dkey(linked?.to || new Date()));
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Set when the server capped the window (returned only the newest points), so
  // the replay can say the trail is partial instead of silently showing a slice.
  const [trailMeta, setTrailMeta] = useState(null);

  // ERP trips for the selected vehicle. Picking one switches the replay from
  // "whatever fell inside these dates" to the real trip: its window comes from the
  // GPS-proven yard exit/return, so the timeline's start and end mean something.
  const [erpTrips, setErpTrips] = useState([]);
  const [erpTripId, setErpTripId] = useState(params.get('trip') || '');

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [persp, setPersp] = useState('flat');

  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const tRef = useRef(0);
  tRef.current = t;

  const { containerRef, mapRef } = useLeafletMap({});
  const runRef = useRef(null);
  const truckRef = useRef(null);

  useEffect(() => {
    const ac = new AbortController();
    RouteHubService.getVehicles(ac.signal)
      .then((list) => {
        setVehicles(list);
        const wanted = params.get('v');
        const match = list.find((v) => v._id === wanted || v.registrationNumber === wanted);
        setReg((r) => r || match?.registrationNumber || list[0]?.registrationNumber || '');
      })
      .catch(() => {
        if (!ac.signal.aborted) setError('Could not load vehicles.');
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliedVehicleRef = useRef(null);
  // Search selections can change the replay URL while this tab stays mounted.
  useEffect(() => {
    const wanted = params.get('v');
    if (!wanted || appliedVehicleRef.current === wanted) return;
    const match = vehicles.find(
      (item) => item._id === wanted || item.registrationNumber === wanted,
    );
    if (!match) return;
    appliedVehicleRef.current = wanted;
    if (match.registrationNumber !== reg) {
      setTrip(null);
      setErpTripId('');
      setError(null);
      setReg(match.registrationNumber);
    }
  }, [params, vehicles, reg]);

  const requestRef = useRef(0);
  useEffect(
    () => () => {
      requestRef.current += 1;
    },
    [],
  );

  const load = useCallback(
    async (nextReg = reg, nextRange = range, nextTripId = erpTripId, tripRow = null) => {
      if (!nextReg) {
        setError('Select a vehicle to load its replay.');
        return false;
      }
      const vehicle = vehicles.find((v) => v.registrationNumber === nextReg);
      // A picked trip defines its own window. Anchors first (GPS-proven), falling
      // back to the ERP timestamps when the trip has not been anchored yet — those
      // are operator-typed and can be hours off, which is exactly why the labels
      // stay honest about which source they came from.
      const win = tripRow
        ? tripWindow(tripRow)
        : nextRange === 'linked' && linked
          ? { from: linked.from, to: linked.to }
          : windowForRange(nextRange, from, to);
      if (
        !Number.isFinite(win.from.getTime()) ||
        !Number.isFinite(win.to.getTime()) ||
        win.from > win.to
      ) {
        setError('Choose valid dates with From on or before To.');
        return false;
      }
      if (nextRange !== 'custom') {
        setFrom(dkey(win.from));
        setTo(dkey(win.to));
      }
      const requestId = ++requestRef.current;
      setLoading(true);
      setError(null);
      setTrailMeta(null);
      try {
        const window = { from: win.from.toISOString(), to: win.to.toISOString() };
        const [trail, os, dev, anchors, road] = await Promise.all([
          RouteHubService.getTrail(nextReg, { ...window, limit: 5000 }),
          vehicle?._id
            ? RouteHubService.getOverspeedEvents({
                vehicleId: vehicle._id,
                ...window,
                speedKmh: limitKmh,
                durationSec: durMin * 60,
              })
                .then((result) => result.events || [])
                .catch(() => [])
            : Promise.resolve([]),
          RouteHubService.getDeviationEvents({ vehicle: nextReg, ...window, limit: 50 })
            .then((result) => result.records || [])
            .catch(() => []),
          RouteHubService.getTripAnchors(nextTripId),
          RoadService.getRoadTrailIfEnabled(nextReg, window),
        ]);
        if (requestId !== requestRef.current) return false;
        setTrailMeta(
          trail?.truncated
            ? {
                truncated: true,
                totalCount: trail.totalCount ?? null,
                shown: (trail.points || []).length,
                actualFrom: trail.actualFrom || null,
                actualTo: trail.actualTo || null,
              }
            : null,
        );
        const built = buildTrip(trail.points, os, dev, anchors, road);
        setTrip(built);
        const startT =
          built && nextRange === 'linked' && linked?.at
            ? Math.max(
                0,
                Math.min(1, (linked.at - built.startAt) / (built.durationMin * 60000 || 1)),
              )
            : 0;
        setT(startT);
        setPlaying(false);
        if (!built)
          setError('No position fixes in this window. Try another vehicle or date range.');
        return Boolean(built);
      } catch (e) {
        if (requestId !== requestRef.current) return false;
        setTrip(null);
        setError(e?.message || 'Could not load the trail.');
        return false;
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [reg, range, from, to, vehicles, erpTripId, linked, limitKmh, durMin],
  );

  useEffect(() => {
    if (reg && !trip && !loading && !error) load(reg, linked ? 'linked' : range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reg]);

  // ERP trips follow the vehicle selection. Empty list is normal — an org without
  // the ERP module, or a vehicle that has never run a booked trip.
  useEffect(() => {
    const vehicle = vehicles.find((v) => v.registrationNumber === reg);
    if (!vehicle?._id) {
      setErpTrips([]);
      return undefined;
    }
    const ac = new AbortController();
    RouteHubService.getTripsForVehicle(vehicle._id, ac.signal).then(setErpTrips);
    return () => ac.abort();
  }, [reg, vehicles]);

  // Deep link (?trip=<id>) — once the trip row is in hand, replay it directly so the
  // link lands on the trip, not on a date range that happens to contain it.
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || !erpTripId || !erpTrips.length) return;
    const row = erpTrips.find((t) => String(t._id) === String(erpTripId));
    if (!row) return;
    deepLinked.current = true;
    setRange('custom');
    load(reg, 'custom', erpTripId, row);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erpTripId, erpTrips]);

  const pickTrip = (id) => {
    setErpTripId(id);
    setTrip(null);
    if (!id) {
      load(reg, range, '', null);
      return;
    }
    const row = erpTrips.find((t) => String(t._id) === String(id));
    setRange('custom');
    load(reg, 'custom', id, row).then((loaded) => {
      if (loaded) toast(`Replaying ${row?.tripNumber || 'trip'}`);
    });
  };

  useReplayLayers({ mapRef, trip, limitKmh, runRef, truckRef, setPlaying, setT });

  const frame = trip ? sampleAt(trip, t) : null;

  // Imperative paint: Leaflet owns these objects, so the animation writes to
  // them directly instead of re-rendering the map on every tick.
  useEffect(() => {
    if (!trip || !frame || !truckRef.current || !runRef.current) return;
    const onRoad = trip.roadLayers.length
      ? roadPositionAt(trip.roadLayers, frame.at.getTime())
      : null;
    truckRef.current.setLatLng(onRoad ? [onRoad.lat, onRoad.lng] : frame.ll);
    if (trip.roadLayers.length) {
      const travelled = clipLayersAt(trip.roadLayers, frame.at.getTime()).filter(
        (l) => l.kind !== 'RAW' && l.kind !== 'INFERRED',
      );
      runRef.current.setLatLngs(
        travelled.length ? travelled.map((l) => toLatLngPairs(l.path)) : [frame.ll],
      );
    } else {
      const driven = travelledPieces(trip.pieces, frame.upto, frame.ll);
      runRef.current.setLatLngs(driven.length ? driven : [frame.ll]);
    }
    const el = truckRef.current.getElement()?.querySelector('.rh-truck');
    if (el) el.classList.toggle('fast', (frame.speed || 0) > limitKmh);
    if (persp === 'follow' && mapRef.current)
      mapRef.current.setView(frame.ll, 12, { animate: false });
  }, [trip, frame, persp, mapRef, limitKmh]);

  useEffect(() => {
    if (!playing || !trip) return undefined;
    lastRef.current = performance.now();
    const tick = (ts) => {
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      const next = Math.min(1, tRef.current + dt / (PLAYBACK_BASE_SEC / speed));
      setT(next);
      if (next >= 1) {
        setPlaying(false);
        toast('Replay complete');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, trip, toast]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (persp === 'flat') {
      map.dragging.enable();
      if (trip) map.fitBounds(L.latLngBounds(trip.path), { padding: [60, 60] });
    } else {
      map.dragging.disable();
    }
    const id = setTimeout(() => map.invalidateSize(), 340);
    return () => clearTimeout(id);
  }, [persp, trip, mapRef]);

  const scrubRef = useRef(null);
  const scrubTo = (ev) => {
    const r = scrubRef.current.getBoundingClientRect();
    setT(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)));
  };

  const vehicle = vehicles.find((v) => v.registrationNumber === reg);
  const stats = useMemo(() => tripStats(trip), [trip]);

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <h2>Route replay</h2>
          <p>
            Play back any trip from position history. Overspeed, deviation and stop events are
            pinned to the timeline.
          </p>
        </div>
      </div>

      <ReplayToolbar
        reg={reg}
        setReg={setReg}
        setTrip={setTrip}
        erpTripId={erpTripId}
        setErpTripId={setErpTripId}
        erpTrips={erpTrips}
        pickTrip={pickTrip}
        load={load}
        range={range}
        setRange={setRange}
        vehicles={vehicles}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        loading={loading}
        toast={toast}
      />

      {error ? (
        <div className="rtool-load-error" role="alert">
          {error}
        </div>
      ) : null}
      {trailMeta?.truncated ? (
        <div
          role="status"
          style={{
            margin: '0 0 10px',
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#92400e',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          ⚠️ Showing {trailMeta.shown.toLocaleString('en-IN')}
          {trailMeta.totalCount ? ` of ${trailMeta.totalCount.toLocaleString('en-IN')}` : ''}{' '}
          position fixes — sampled evenly across the whole window to stay within the server cap. The
          full time span is shown at reduced detail; narrow the date range to see every fix.
        </div>
      ) : null}

      <div className="card">
        <ReplayStatsHead vehicle={vehicle} trip={trip} loading={loading} stats={stats} />
        <ReplayPerspectiveBar persp={persp} setPersp={setPersp} />

        <div className="rgrid">
          <div>
            <div className={`persp ${persp === 'flat' ? '' : persp}`}>
              <div className="lmap" ref={containerRef} />
              {loading ? <div className="ov ovs-notice">Loading replay…</div> : null}
              <ReplayHud frame={frame} limitKmh={limitKmh} erpTripId={erpTripId} />
            </div>

            <ReplayPlayer
              playing={playing}
              setPlaying={setPlaying}
              trip={trip}
              t={t}
              setT={setT}
              frame={frame}
              scrubRef={scrubRef}
              scrubTo={scrubTo}
              speed={speed}
              setSpeed={setSpeed}
            />
          </div>

          <TripLog
            trip={trip}
            error={error}
            loading={loading}
            setPlaying={setPlaying}
            setT={setT}
          />
        </div>
      </div>
    </section>
  );
}
