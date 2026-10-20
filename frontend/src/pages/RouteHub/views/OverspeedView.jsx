import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup } from '../routeHubMap';
import { KpiRow, RefreshButton } from '../routeHubShared.jsx';
import { downloadCsv, fmtDT } from '../routeHubFormat';
import { minsOf, SEVERE_OVER_KMH, hasCoords, esc } from './overspeed/overspeedHelpers.js';
import MapLegend from './overspeed/MapLegend.jsx';
import OverspeedControls from './overspeed/OverspeedControls.jsx';
import FleetRankingCard from './overspeed/FleetRankingCard.jsx';
import SpeedTraceCard from './overspeed/SpeedTraceCard.jsx';
import OverspeedEventsCard from './overspeed/OverspeedEventsCard.jsx';

export default function OverspeedView({ params, toast, setBadge, go }) {
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(params.get('v') || '');
  const [thr, setThr] = useState(60);
  // The limit the shown results were computed with (thr is the unsubmitted input).
  const [appliedThr, setAppliedThr] = useState(60);
  const [dur, setDur] = useState(3);
  const [win, setWin] = useState(24);

  const [fleet, setFleet] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const windowRef = useRef({ from: null, to: null });

  useEffect(() => {
    const ac = new AbortController();
    RouteHubService.getVehicles(ac.signal)
      .then(setVehicles)
      .catch(() => {
        if (!ac.signal.aborted) setError('Could not load vehicles.');
      });
    return () => ac.abort();
  }, []);

  const run = useCallback(async () => {
    const to = new Date();
    const from = new Date(to.getTime() - win * 3600000);
    windowRef.current = { from, to };
    setLoading(true);
    setError(null);
    setAppliedThr(thr);
    try {
      if (!selected) {
        const data = await RouteHubService.getFleetOverspeed({
          from: from.toISOString(),
          to: to.toISOString(),
          speedKmh: thr,
          durationSec: dur * 60,
        });
        setFleet(data);
        setDetail(null);
        setBadge('overspeed', data?.totals?.eventCount ?? 0);
      } else {
        const data = await RouteHubService.getOverspeedEvents({
          vehicleId: selected,
          from: from.toISOString(),
          to: to.toISOString(),
          speedKmh: thr,
          durationSec: dur * 60,
        });
        const trail = await RouteHubService.getTrail(
          data.registrationNumber ||
            vehicles.find((v) => v._id === selected)?.registrationNumber ||
            '',
          { from: from.toISOString(), to: to.toISOString(), limit: 5000 },
        ).catch(() => ({ points: [] }));
        setDetail({
          ...data,
          fixes: (trail.points || [])
            .filter((p) => p.speed != null)
            .map((p) => ({ at: new Date(p.eventDateTime).getTime(), speed: p.speed })),
        });
      }
    } catch (e) {
      setError(e?.message || 'Could not run the audit.');
    } finally {
      setLoading(false);
    }
  }, [selected, thr, dur, win, vehicles, setBadge]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, win]);

  // Stable references: the map redraws (and re-fits) only when these change.
  const events = useMemo(() => detail?.events || [], [detail]);
  const rank = useMemo(() => fleet?.vehicles || [], [fleet]);
  const totals = useMemo(() => fleet?.totals || {}, [fleet]);

  const kpis = useMemo(() => {
    if (detail) {
      const longest = events.reduce((a, e) => Math.max(a, minsOf(e.durationSec)), 0);
      const peak = events.reduce((a, e) => Math.max(a, e.maxSpeedKmh || 0), 0);
      const v = vehicles.find((x) => x._id === selected);
      return [
        {
          accent: 1,
          ic: 'gauge',
          l: 'Sustained events',
          v: events.length,
          s: `over ${thr} km/h for ${dur}+ min · last ${win} h`,
        },
        {
          ic: 'truck',
          l: 'Vehicle',
          v: v?.registrationNumber || detail.registrationNumber || '—',
          s: v?.model || 'connected fleet vehicle',
          c: 'var(--nova-rage-600)',
          tint: 'var(--nova-rage-a10)',
        },
        {
          ic: 'clock',
          l: 'Longest event',
          v: longest,
          u: 'min',
          s: 'continuous time over the limit',
          c: '#6A43D8',
          tint: 'rgba(106,67,216,.12)',
        },
        {
          ic: 'zap',
          l: 'Peak speed',
          v: peak || '—',
          u: peak ? 'km/h' : '',
          s: peak ? `${Math.round(peak - thr)} km/h over the limit` : 'no events in window',
          c: '#C2323A',
          tint: 'rgba(229,104,107,.14)',
          vc: peak ? '#C2323A' : undefined,
        },
      ];
    }
    return [
      {
        accent: 1,
        ic: 'gauge',
        l: 'Sustained events',
        v: totals.eventCount ?? 0,
        s: `over ${thr} km/h for ${dur}+ min · last ${win} h`,
      },
      {
        ic: 'truck',
        l: 'Vehicles flagged',
        v: totals.vehiclesFlagged ?? 0,
        u: `of ${totals.vehicleCount ?? rank.length}`,
        s: 'connected fleet vehicles',
        c: 'var(--nova-rage-600)',
        tint: 'var(--nova-rage-a10)',
      },
      {
        ic: 'clock',
        l: 'Longest event',
        v: minsOf(totals.longestDurationSec),
        u: 'min',
        s: 'continuous time over the limit',
        c: '#6A43D8',
        tint: 'rgba(106,67,216,.12)',
      },
      {
        ic: 'zap',
        l: 'Peak speed',
        v: totals.peakSpeedKmh || '—',
        u: totals.peakSpeedKmh ? 'km/h' : '',
        s: totals.peakSpeedKmh
          ? `${Math.round(totals.peakSpeedKmh - thr)} km/h over the limit`
          : 'no events in window',
        c: '#C2323A',
        tint: 'rgba(229,104,107,.14)',
        vc: totals.peakSpeedKmh ? '#C2323A' : undefined,
      },
    ];
  }, [detail, events, totals, rank.length, thr, dur, win, vehicles, selected]);

  const { containerRef, mapRef } = useLeafletMap({ scrollWheelZoom: false }, [Boolean(detail)]);

  const mapEvents = useMemo(
    () =>
      detail
        ? events.map((e) => ({ ...e, plate: detail.registrationNumber, vehicleId: selected }))
        : rank.flatMap((r) =>
            (r.events || []).map((e) => ({
              ...e,
              plate: r.registrationNumber,
              vehicleId: r.vehicleId,
            })),
          ),
    [detail, events, rank, selected],
  );
  const located = useMemo(() => mapEvents.filter(hasCoords), [mapEvents]);
  const unlocated = mapEvents.length - located.length;
  const vehiclesOnMap = useMemo(() => new Set(located.map((e) => e.plate)).size, [located]);

  const openVehicle = useCallback((vehicleId) => {
    setSelected(vehicleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Redraws only when the located events change. The fit is not animated: an
  // animated fitBounds interrupted by the next render leaves tiles half-scaled
  // (white seams, grey holes) and the markers drawn against a stale view.
  useLayerGroup(
    mapRef,
    (group, map) => {
      const biggestFirst = [...located].sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0));
      biggestFirst.forEach((e) => {
        const mins = minsOf(e.durationSec);
        L.circleMarker([e.startLat, e.startLng], {
          radius: 5 + Math.min(7, Math.round(mins / 3)),
          color: '#fff',
          weight: 2,
          fillColor: e.maxSpeedKmh > appliedThr + SEVERE_OVER_KMH ? '#C2323A' : '#F0AA48',
          fillOpacity: 0.92,
        })
          .bindTooltip(
            `<b>${esc(e.plate)}</b> · ${esc(e.maxSpeedKmh)} km/h peak · ${mins} min<br>${esc(
              fmtDT(new Date(e.startAt)),
            )}${detail ? '' : '<br>Click to audit this vehicle'}`,
            { className: 'tag', direction: 'top', offset: [0, -6] },
          )
          .on('click', () => {
            if (!detail && e.vehicleId) openVehicle(e.vehicleId);
          })
          .addTo(group);
      });
      map.invalidateSize({ animate: false });
      if (located.length) {
        map.fitBounds(L.latLngBounds(located.map((e) => [e.startLat, e.startLng])), {
          padding: [48, 48],
          maxZoom: 11,
          animate: false,
        });
      }
    },
    [located, appliedThr, Boolean(detail)],
  );

  let mapNotice = null;
  if (!located.length) {
    if (loading) mapNotice = 'Running audit…';
    else if (unlocated) mapNotice = 'These events have no GPS position to plot';
    else mapNotice = `No sustained overspeed in the last ${win} h`;
  }
  const mapHint = [
    `${located.length} event${located.length === 1 ? '' : 's'}`,
    detail ? null : `${vehiclesOnMap} vehicle${vehiclesOnMap === 1 ? '' : 's'}`,
    unlocated ? `${unlocated} without a location` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const exportCsv = () => {
    const rows = [
      ['vehicle', 'started', 'duration_min', 'peak_kmh', 'avg_kmh', 'distance_km', 'threshold_kmh'],
    ].concat(
      mapEvents.map((e) => [
        e.plate,
        fmtDT(new Date(e.startAt)),
        minsOf(e.durationSec),
        e.maxSpeedKmh,
        e.avgSpeedKmh,
        e.distanceKm ?? '',
        thr,
      ]),
    );
    downloadCsv('overspeed-audit', rows);
    toast(`${rows.length - 1} rows exported`);
  };

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <h2>Overspeed audit</h2>
          <p>
            Sustained overspeed recomputed from minute-level position history, so one-off spikes
            don&apos;t count as events.
          </p>
        </div>
        <div className="tools">
          <RefreshButton onClick={run} busy={loading} />
          <button type="button" className="btn" onClick={exportCsv}>
            <Ico n="download" />
            Export
          </button>
        </div>
      </div>

      <OverspeedControls
        selected={selected}
        setSelected={setSelected}
        vehicles={vehicles}
        thr={thr}
        setThr={setThr}
        dur={dur}
        setDur={setDur}
        win={win}
        setWin={setWin}
        run={run}
        loading={loading}
      />

      <KpiRow items={kpis} loading={loading && !fleet && !detail} />

      {error ? (
        <div className="card">
          <div className="empty">
            <span style={{ color: '#C56200' }}>
              <Ico n="alert" s={28} />
            </span>
            <b>Audit unavailable</b>
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      <div className="bento">
        {!detail ? (
          <>
            <FleetRankingCard
              rank={rank}
              openVehicle={openVehicle}
              loading={loading}
              thr={thr}
              dur={dur}
            />
            <div className="card s5 ovs-pane">
              <div className="card-head">
                <h3>Where it happened</h3>
                <span className="hint">{mapHint}</span>
                {located.length ? (
                  <>
                    <span className="sp" />
                    <span className="hint">Click a dot to audit that vehicle</span>
                  </>
                ) : null}
              </div>
              <div className="mapbox">
                <div className="lmap" ref={containerRef} />
                {located.length ? <MapLegend limit={appliedThr} /> : null}
                {mapNotice ? <div className="ov ovs-notice">{mapNotice}</div> : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <SpeedTraceCard
              detail={detail}
              setSelected={setSelected}
              win={win}
              thr={thr}
              events={events}
              windowRef={windowRef}
            />

            <OverspeedEventsCard
              events={events}
              selected={selected}
              appliedThr={appliedThr}
              dur={dur}
              thr={thr}
              go={go}
            />

            <div className="card s5 ovs-pane">
              <div className="card-head">
                <h3>Event locations</h3>
                <span className="hint">{mapHint}</span>
              </div>
              <div className="mapbox">
                <div className="lmap" ref={containerRef} />
                {located.length ? <MapLegend limit={appliedThr} /> : null}
                {mapNotice ? <div className="ov ovs-notice">{mapNotice}</div> : null}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
