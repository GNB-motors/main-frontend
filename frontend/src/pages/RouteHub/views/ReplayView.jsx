import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup, pinIcon, truckIcon } from '../routeHubMap';
import { Seg } from '../routeHubShared.jsx';
import { dkey, fmtT, haversineKm, hm } from '../routeHubFormat';

const EVC = { start: '#187A32', stop: '#6A43D8', os: '#F0AA48', dev: '#C2323A', end: '#1E1E20' };
const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7 days' },
];
const SPEEDS = [1, 2, 4, 8];
const PERSPECTIVES = [
  { value: 'flat', label: '2D classic' },
  { value: 'iso', label: '3D isometric' },
  { value: 'follow', label: '3D follow-cam' },
];
/** Wall-clock seconds the whole trip takes to play back at 1×. */
const PLAYBACK_BASE_SEC = 60;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

function windowForRange(range, from, to) {
  const now = new Date();
  if (range === 'today') return { from: startOfDay(now), to: now };
  if (range === 'yesterday') {
    const y = startOfDay(new Date(now.getTime() - 86400000));
    return { from: y, to: new Date(y.getTime() + 86400000 - 1) };
  }
  if (range === '7d') return { from: startOfDay(new Date(now.getTime() - 6 * 86400000)), to: now };
  return { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59`) };
}

/**
 * The replay window for a picked ERP trip.
 *
 * Prefers the warehouse anchors — the yard exit and return are the trip's real
 * boundaries. Falls back to the ERP timestamps, padded by an hour either side, so an
 * un-anchored trip still shows the approach and the park rather than cutting the
 * trail off at a typed timestamp.
 */
function tripWindow(t) {
  const a = t?.warehouseAnchors || {};
  if (a.exitedAt && a.arrivedAt) {
    return { from: new Date(a.exitedAt), to: new Date(a.arrivedAt) };
  }
  const start = a.exitedAt || t?.dispatchedAt || t?.tripDate;
  const end = a.arrivedAt || t?.tripClosedAt || t?.unloadedAt || new Date();
  const PAD_MS = 3600 * 1000;
  return {
    from: new Date(new Date(start).getTime() - PAD_MS),
    to: new Date(new Date(end).getTime() + PAD_MS),
  };
}

/**
 * Turns the trail's irregular fixes into something the player can scrub:
 * a positioned, cumulative-distance-tagged frame list keyed on real elapsed
 * time (the mockup could assume one fix per minute; live data cannot).
 */
function buildTrip(points, overspeedEvents, deviationEvents, anchors = null) {
  const fixes = (points || [])
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      ll: [p.latitude, p.longitude],
      at: new Date(p.eventDateTime),
      speed: p.speed == null ? null : Math.round(p.speed),
      gapType: p.gapType || null,
    }))
    .sort((a, b) => a.at - b.at);

  if (fixes.length < 2) return null;

  let acc = 0;
  fixes.forEach((f, i) => {
    if (i > 0) acc += haversineKm(fixes[i - 1].ll, f.ll);
    f.km = acc;
  });

  const t0 = fixes[0].at.getTime();
  const t1 = fixes[fixes.length - 1].at.getTime();
  const span = Math.max(1, t1 - t0);
  fixes.forEach((f) => {
    f.t = (f.at.getTime() - t0) / span;
  });

  const path = fixes.map((f) => f.ll);
  const speeds = fixes.map((f) => f.speed).filter((s) => s != null);
  const moving = speeds.filter((s) => s > 0);

  const atTime = (ms) => {
    const target = t0 + ms;
    let i = fixes.findIndex((f) => f.at.getTime() >= target);
    if (i < 0) i = fixes.length - 1;
    return Math.max(0, i);
  };

  // Start/end labelling.
  //
  // `fixes[0]` is only the oldest fix in the SELECTED RANGE — it is not a trip start.
  // Pick a different range and the same vehicle gets a different "trip start"; a truck
  // already doing 38 km/h when the window opens still got labelled as starting there.
  // So without anchors we say exactly what we know: first/last fix in range.
  //
  // With `anchors` (an ERP trip's warehouse geofence crossings) we know the real
  // thing: when the vehicle left its yard and when it returned to one.
  const startAnchored = anchors?.exitedAt ? new Date(anchors.exitedAt) : null;
  const endAnchored = anchors?.arrivedAt ? new Date(anchors.arrivedAt) : null;

  const events = [
    startAnchored
      ? {
          type: 'start',
          t: 0,
          at: startAnchored,
          title: 'Trip start',
          sub: `Left ${anchors.startWarehouseName || 'the yard'} at ${fmtT(startAnchored)}`,
        }
      : {
          type: 'start',
          t: 0,
          at: fixes[0].at,
          title: 'First fix in range',
          sub: `Oldest position at ${fmtT(fixes[0].at)} — not a confirmed trip start`,
        },
  ];

  // A run of 'stationary' gap fixes is the trail's own way of saying the vehicle
  // sat still through a reporting silence — that's a halt.
  //
  // Consecutive stationary gaps are MERGED. Emitting one event per gap fix split a
  // single 50-minute park into three 17-minute "halts" whose `until` times chained
  // into each other, which both misreported every stop and inflated the trip-log
  // count. One unbroken stationary run is one halt.
  let runStart = null;
  let runEnd = null;
  const flushHalt = () => {
    if (runStart == null) return;
    const mins = (runEnd.at - runStart.at) / 60000;
    if (mins >= 15) {
      events.push({
        type: 'stop',
        t: runStart.t,
        at: runStart.at,
        title: `Halt · ${hm(mins)}`,
        sub: `Stationary until ${fmtT(runEnd.at)}`,
      });
    }
    runStart = null;
    runEnd = null;
  };

  fixes.forEach((f, i) => {
    if (i === 0) return;
    if (f.gapType === 'stationary') {
      // The halt began at the PREVIOUS fix — that is when the vehicle stopped
      // moving; `f` is only the first report after the silence.
      if (runStart == null) runStart = fixes[i - 1];
      runEnd = f;
      return;
    }
    flushHalt();
  });
  flushHalt();

  (overspeedEvents || []).forEach((e) => {
    const at = new Date(e.startAt);
    const ms = at.getTime() - t0;
    if (ms < 0 || ms > span) return;
    const mins = Math.round((e.durationSec || 0) / 60);
    events.push({
      type: 'os',
      t: ms / span,
      at,
      idx: atTime(ms),
      title: `Overspeed · ${e.maxSpeedKmh} km/h`,
      sub: `${mins || '<1'} min above the limit${e.distanceKm != null ? ` · ${e.distanceKm} km` : ''}`,
    });
  });

  (deviationEvents || []).forEach((d) => {
    const at = new Date(d.detectedAt || d.startedAt);
    const ms = at.getTime() - t0;
    if (Number.isNaN(ms) || ms < 0 || ms > span) return;
    events.push({
      type: 'dev',
      t: ms / span,
      at,
      title: `Deviation · ${Number(d.maxOffKm || 0).toFixed(2)} km off`,
      sub: `+${d.extraKmEstimate ?? '—'} km estimated detour`,
    });
  });

  events.push(
    endAnchored
      ? {
          type: 'end',
          t: 1,
          at: endAnchored,
          title: anchors.warehouseMismatch ? 'Trip end · different yard' : 'Trip end',
          sub: anchors.warehouseMismatch
            ? `Returned to ${anchors.arrivalWarehouseName || 'another yard'}, not ${anchors.endWarehouseName || 'the designated yard'}`
            : `Returned to ${anchors.arrivalWarehouseName || 'the yard'} at ${fmtT(endAnchored)}`,
        }
      : {
          type: 'end',
          t: 1,
          at: fixes[fixes.length - 1].at,
          title: 'Last fix in range',
          sub: `Newest position at ${fmtT(fixes[fixes.length - 1].at)} — not a confirmed trip end`,
        },
  );
  events.sort((a, b) => a.t - b.t);

  return {
    fixes,
    path,
    events,
    km: acc,
    durationMin: span / 60000,
    peak: speeds.length ? Math.max(...speeds) : 0,
    avg: moving.length ? Math.round(moving.reduce((a, b) => a + b, 0) / moving.length) : 0,
    startAt: fixes[0].at,
  };
}

/** Position + speed at scrub fraction t, interpolated between bracketing fixes. */
function sampleAt(trip, t) {
  const { fixes } = trip;
  const clamped = Math.max(0, Math.min(1, t));
  let hi = fixes.findIndex((f) => f.t >= clamped);
  if (hi <= 0) hi = 1;
  const lo = hi - 1;
  const a = fixes[lo];
  const b = fixes[hi];
  const span = b.t - a.t || 1;
  const f = (clamped - a.t) / span;
  return {
    ll: [a.ll[0] + (b.ll[0] - a.ll[0]) * f, a.ll[1] + (b.ll[1] - a.ll[1]) * f],
    speed: b.speed ?? a.speed ?? 0,
    km: a.km + (b.km - a.km) * f,
    at: new Date(a.at.getTime() + (b.at.getTime() - a.at.getTime()) * f),
    upto: hi,
  };
}

export default function ReplayView({ params, toast }) {
  const [vehicles, setVehicles] = useState([]);
  const [reg, setReg] = useState('');
  const [range, setRange] = useState('today');
  const [from, setFrom] = useState(dkey(new Date(Date.now() - 7 * 86400000)));
  const [to, setTo] = useState(dkey(new Date()));
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      .catch(() => {});
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
      const win = tripRow ? tripWindow(tripRow) : windowForRange(nextRange, from, to);
      setLoading(true);
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
            speedKmh: 60,
            durationSec: 180,
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

        const built = buildTrip(trail.points, os, dev, anchors);
        setTrip(built);
        setT(0);
        setPlaying(false);
        if (!built) setError('No position fixes in this window.');
      } catch (e) {
        setTrip(null);
        setError(e?.detail || e?.message || 'Could not load the trail.');
      } finally {
        setLoading(false);
      }
    },
    [reg, range, from, to, vehicles, erpTripId],
  );

  useEffect(() => {
    if (reg && !trip && !loading && !error) load(reg, range);
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

  useLayerGroup(
    mapRef,
    (group, map) => {
      if (!trip) return;
      L.polyline(trip.path, {
        color: '#9A9AA5',
        weight: 4,
        opacity: 0.6,
        dashArray: '2 8',
        lineCap: 'round',
      }).addTo(group);
      runRef.current = L.polyline([trip.path[0]], {
        color: '#2F58EE',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
      }).addTo(group);

      trip.events.forEach((e) => {
        const at = sampleAt(trip, e.t).ll;
        if (e.type === 'start' || e.type === 'end') {
          L.marker(at, { icon: pinIcon(EVC[e.type], e.type === 'start' ? 'truck' : 'pin', 22) })
            .bindTooltip(e.title, { className: 'tag', direction: 'top', offset: [0, -10] })
            .addTo(group);
        } else {
          L.circleMarker(at, {
            radius: 7,
            color: '#fff',
            weight: 2.5,
            fillColor: EVC[e.type],
            fillOpacity: 1,
          })
            .bindTooltip(e.title, { className: 'tag', direction: 'top' })
            .on('click', () => {
              setPlaying(false);
              setT(e.t);
            })
            .addTo(group);
        }
      });

      truckRef.current = L.marker(trip.path[0], { zIndexOffset: 1000, icon: truckIcon() }).addTo(
        group,
      );
      map.fitBounds(L.latLngBounds(trip.path), { padding: [60, 60] });
    },
    [trip],
  );

  const frame = trip ? sampleAt(trip, t) : null;

  // Imperative paint: Leaflet owns these objects, so the animation writes to
  // them directly instead of re-rendering the map on every tick.
  useEffect(() => {
    if (!trip || !frame || !truckRef.current || !runRef.current) return;
    truckRef.current.setLatLng(frame.ll);
    runRef.current.setLatLngs(trip.path.slice(0, frame.upto).concat([frame.ll]));
    const el = truckRef.current.getElement()?.querySelector('.rh-truck');
    if (el) el.classList.toggle('fast', (frame.speed || 0) > 60);
    if (persp === 'follow' && mapRef.current)
      mapRef.current.setView(frame.ll, 12, { animate: false });
  }, [trip, frame, persp, mapRef]);

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
  const stats = useMemo(
    () =>
      trip
        ? [
            ['split', 'Distance', `${trip.km.toFixed(1)} km`, 'var(--nova-rage-600)'],
            ['clock', 'Duration', hm(trip.durationMin), '#187A32'],
            ['gauge', 'Avg speed', `${trip.avg} km/h`, '#C56200'],
            ['zap', 'Peak speed', `${trip.peak} km/h`, '#C2323A'],
          ]
        : [],
    [trip],
  );

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

      <div className="card">
        <div className="rtool">
          <span className="lbl">Vehicle</span>
          <label className="field">
            <select
              value={reg}
              onChange={(e) => {
                setReg(e.target.value);
                setTrip(null);
                // The picked trip belongs to the old vehicle; keeping it would replay
                // one vehicle's window under another's trail.
                setErpTripId('');
                load(e.target.value, range, '', null);
              }}
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v.registrationNumber}>
                  {v.registrationNumber}
                  {v.model ? ` · ${v.model}` : ''}
                </option>
              ))}
            </select>
          </label>

          {/* Only offered when the vehicle actually has booked trips — an org
              without ERP keeps the plain date-range replay. */}
          {erpTrips.length > 0 && (
            <>
              <span className="lbl">Trip</span>
              <label className="field">
                <select
                  aria-label="ERP trip"
                  value={erpTripId}
                  onChange={(e) => pickTrip(e.target.value)}
                >
                  <option value="">Date range (no trip)</option>
                  {erpTrips.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.tripNumber}
                      {t.tripDate ? ` · ${dkey(new Date(t.tripDate))}` : ''}
                      {t.warehouseAnchors?.exitedAt ? ' · anchored' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <Seg
            options={RANGES}
            value={range}
            onChange={(r) => {
              setRange(r);
              // Switching back to a date range drops the trip: the timeline would
              // otherwise still be labelled "left the yard at…" for a window that no
              // longer matches that trip.
              setErpTripId('');
              load(reg, r, '', null);
            }}
          />
          <span className="lbl">From</span>
          <label className="field">
            <input
              type="date"
              aria-label="From date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <span className="lbl">To</span>
          <label className="field">
            <input
              type="date"
              aria-label="To date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn--primary"
            disabled={loading}
            onClick={() => {
              setRange('custom');
              setErpTripId('');
              load(reg, 'custom', '', null).then(() => toast(`Replay loaded · ${reg}`));
            }}
          >
            <Ico n="route" />
            {loading ? 'Loading…' : 'Load replay'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="eyebrow">Replay canvas</span>
          <span className="hint">
            {vehicle ? `${vehicle.registrationNumber}` : ''}
            {trip
              ? ` · ${trip.startAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : ''}
          </span>
          <span className="sp" />
          <div className="stats">
            {stats.map(([i, k, val, c]) => (
              <span className="stat" key={k} style={{ '--c': c }}>
                <Ico n={i} s={14} />
                {k}
                <b>{val}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="card-head" style={{ paddingTop: 0 }}>
          <span className="hint">Replay perspective</span>
          <Seg options={PERSPECTIVES} value={persp} onChange={setPersp} />
          <span className="sp" />
          <div className="legend">
            <span>
              <i className="dot" style={{ background: EVC.stop }} />
              Stop
            </span>
            <span>
              <i className="dot" style={{ background: EVC.os }} />
              Overspeed
            </span>
            <span>
              <i className="dot" style={{ background: EVC.dev }} />
              Deviation
            </span>
          </div>
        </div>

        <div className="rgrid">
          <div>
            <div className={`persp ${persp === 'flat' ? '' : persp}`}>
              <div className="lmap" ref={containerRef} />
              <div className="ov hud">
                <div>
                  <div className="k">Time</div>
                  <div className="v" style={{ fontSize: 'var(--type-s)' }}>
                    {frame ? fmtT(frame.at) : '—'}
                  </div>
                </div>
                <div>
                  <div className="k">Speed</div>
                  <div
                    className="v"
                    style={{ color: (frame?.speed || 0) > 60 ? '#C2323A' : 'inherit' }}
                  >
                    {frame ? frame.speed : '—'}{' '}
                    <span style={{ fontSize: 11, color: 'var(--fg-secondary)', fontWeight: 500 }}>
                      km/h
                    </span>
                  </div>
                </div>
                <div>
                  <div className="k">Covered</div>
                  <div className="v">
                    {frame ? frame.km.toFixed(0) : '—'}{' '}
                    <span style={{ fontSize: 11, color: 'var(--fg-secondary)', fontWeight: 500 }}>
                      km
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="player">
              <button
                type="button"
                className="pbtn"
                aria-label={playing ? 'Pause' : 'Play'}
                disabled={!trip}
                onClick={() => {
                  if (t >= 1) setT(0);
                  setPlaying((p) => !p);
                }}
              >
                <Ico n={playing ? 'pause' : 'play'} s={16} />
              </button>
              <span className="ptime">
                {frame ? `${fmtT(frame.at)} · ${Math.round(t * 100)}%` : '—'}
              </span>
              <div
                className="scrub"
                ref={scrubRef}
                role="slider"
                tabIndex={0}
                aria-label="Replay position"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(t * 100)}
                onPointerDown={(e) => {
                  if (!trip) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setPlaying(false);
                  scrubTo(e);
                }}
                onPointerMove={(e) => {
                  if (e.currentTarget.hasPointerCapture?.(e.pointerId)) scrubTo(e);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') setT((x) => Math.min(1, x + 0.01));
                  else if (e.key === 'ArrowLeft') setT((x) => Math.max(0, x - 0.01));
                  else if (e.key === ' ') {
                    e.preventDefault();
                    setPlaying((p) => !p);
                  }
                }}
              >
                <div className="tr">
                  <div className="fl" style={{ width: `${t * 100}%` }} />
                </div>
                <div>
                  {(trip?.events || [])
                    .filter((e) => e.type !== 'start' && e.type !== 'end')
                    .map((e, i) => (
                      <span
                        key={`${e.type}-${i}`}
                        className="mk"
                        title={e.title}
                        style={{ left: `${e.t * 100}%`, background: EVC[e.type] }}
                      />
                    ))}
                </div>
                <div className="kn" style={{ left: `${t * 100}%` }} />
              </div>
              <Seg
                options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))}
                value={speed}
                onChange={setSpeed}
              />
            </div>
          </div>

          <aside className="log">
            <div className="lh">
              <span className="eyebrow" style={{ flex: 1 }}>
                Trip log
              </span>
              <span className="count-pill">{trip?.events.length || 0}</span>
            </div>
            <div className="lb">
              {error ? (
                <div className="empty">
                  <b>No replay</b>
                  <span>{error}</span>
                </div>
              ) : (
                (trip?.events || []).map((e, i) => (
                  <button
                    type="button"
                    className="lev"
                    key={`${e.type}-${i}`}
                    onClick={() => {
                      setPlaying(false);
                      setT(e.t);
                    }}
                  >
                    <span className="d" style={{ background: EVC[e.type] }} />
                    <span>
                      <div className="tt">{e.title}</div>
                      <div className="ss">{e.sub}</div>
                    </span>
                    <span className="tm">{fmtT(e.at)}</span>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
