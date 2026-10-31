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
import sampleAt from './replay/sampleAt.js';
import tripStats from './replay/tripStats.js';
import useReplayLayers from './replay/useReplayLayers.js';
import ReplayToolbar from './replay/ReplayToolbar.jsx';
import ReplayStatsHead from './replay/ReplayStatsHead.jsx';
import ReplayPerspectiveBar from './replay/ReplayPerspectiveBar.jsx';
import ReplayHud from './replay/ReplayHud.jsx';
import ReplayPlayer from './replay/ReplayPlayer.jsx';
import TripLog from './replay/TripLog.jsx';
import useNavigationHistory from '../navigation/useNavigationHistory';
import NavigationHistoryPanel from '../navigation/NavigationHistoryPanel';

export default function ReplayView({ params, toast }) {
  // Opened from the overspeed audit (?from&to&at&limit&dur): that window, at that event.
  const linked = useMemo(() => replayWindow(params), [params]);
  const limitKmh = linked?.limitKmh || DEFAULT_LIMIT_KMH;
  const durMin = linked?.durMin || DEFAULT_DUR_MIN;
  const [vehicles, setVehicles] = useState([]);
  const [reg, setReg] = useState('');
  const [range, setRange] = useState(linked ? 'custom' : 'today');
  const [from, setFrom] = useState(dkey(new Date(Date.now() - 7 * 86400000)));
  const [to, setTo] = useState(dkey(new Date()));
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [navigationContext, setNavigationContext] = useState(null);
  const navigation = useNavigationHistory(navigationContext || {});

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

  const load = useCallback(
    async (nextReg = reg, nextRange = range, nextTripId = erpTripId, tripRow = null) => {
      if (!nextReg) return;
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
      setLoading(true);
      setNavigationContext({
        vehicleId: vehicle?._id,
        from: win.from.toISOString(),
        to: win.to.toISOString(),
      });
      setError(null);
      try {
        const trail = await RouteHubService.getTrail(nextReg, {
          from: win.from.toISOString(),
          to: win.to.toISOString(),
          limit: 5000,
        });
        // Overspeed is a separate recompute; a failure there shouldn't cost
        // the whole replay, so it degrades to "no markers".
        let os = [];
        if (vehicle?._id) {
          os = await RouteHubService.getOverspeedEvents({
            vehicleId: vehicle._id,
            from: win.from.toISOString(),
            to: win.to.toISOString(),
            speedKmh: limitKmh,
            durationSec: durMin * 60,
          })
            .then((r) => r.events || [])
            .catch(() => []);
        }
        const dev = await RouteHubService.getDeviationEvents({
          vehicle: nextReg,
          from: win.from.toISOString(),
          to: win.to.toISOString(),
          limit: 50,
        })
          .then((r) => r.records || [])
          .catch(() => []);

        // When the replay is opened from an ERP trip (?trip=<id>), its warehouse
        // anchors give the real start/end. Without one the labels stay honest about
        // being window edges rather than a trip.
        const anchors = await RouteHubService.getTripAnchors(nextTripId);

        const road = await RoadService.getRoadTrailIfEnabled(nextReg, {
          from: win.from.toISOString(),
          to: win.to.toISOString(),
        });
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
        if (!built) setError('No position fixes in this window.');
      } catch (e) {
        setTrip(null);
        setError(e?.message || 'Could not load the trail.');
      } finally {
        setLoading(false);
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
    load(reg, 'custom', id, row).then(() => toast(`Replaying ${row?.tripNumber || 'trip'}`));
  };

  useReplayLayers({ mapRef, trip, limitKmh, runRef, truckRef, setPlaying, setT });

  useEffect(() => {
    if (!mapRef.current || navigation.path.length < 2) return undefined;
    const layer = L.polyline(
      navigation.path.map((point) => [point.lat, point.lng]),
      {
        color: '#7C3AED',
        weight: 4,
        opacity: 0.8,
        dashArray: '8 5',
      },
    ).addTo(mapRef.current);
    return () => layer.remove();
  }, [mapRef, navigation.path]);

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
        (l) => l.kind !== 'RAW',
      );
      runRef.current.setLatLngs(
        travelled.length ? travelled.map((l) => toLatLngPairs(l.path)) : [frame.ll],
      );
    } else {
      runRef.current.setLatLngs(trip.path.slice(0, frame.upto).concat([frame.ll]));
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
      <NavigationHistoryPanel history={navigation} />
    </section>
  );
}
