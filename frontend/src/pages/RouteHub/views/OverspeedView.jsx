import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useApi from '../../../hooks/useApi';
import { LiveTrackingService } from '../../LiveTracking/LiveTrackingService';
import { modelLabel } from '../../LiveTracking/vehiclePanelModel';
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

export default function OverspeedView({ params, toast, setBadge, go, fromDay, toDay }) {
  const [vehicles, setVehicles] = useState([]);
  const requested = params.get('v') || '';
  const linkedFrom = params.get('from');
  const linkedTo = params.get('to');
  const hasLinkedWindow = Boolean(
    linkedFrom && linkedTo && Date.parse(linkedFrom) < Date.parse(linkedTo),
  );
  const [selected, setSelected] = useState(requested);
  const fixedRange =
    /^\d{4}-\d{2}-\d{2}$/.test(fromDay || '') && /^\d{4}-\d{2}-\d{2}$/.test(toDay || '');
  const selectedVehicle = vehicles.find(
    (v) =>
      v._id === selected ||
      String(v.registrationNumber || '')
        .replace(/\s/g, '')
        .toUpperCase() === selected.replace(/\s/g, '').toUpperCase(),
  );
  const vehicleId = selectedVehicle?._id;

  const [thr, setThr] = useState(60);
  const [dur, setDur] = useState(3);
  // The values the shown results were computed with (thr/dur are the unsubmitted inputs).
  const [appliedThr, setAppliedThr] = useState(60);
  const [appliedDur, setAppliedDur] = useState(3);
  const [win, setWin] = useState(24);

  const [fleet, setFleet] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const request = useRef(null);
  const [error, setError] = useState(null);
  const [vehiclesReady, setVehiclesReady] = useState(false);
  const selectedReady = Boolean(selected && vehiclesReady);

  useEffect(() => {
    const ac = new AbortController();
    RouteHubService.getVehicles(ac.signal)
      .then((rows) => {
        if (!ac.signal.aborted) setVehicles(rows);
      })
      .catch(() => {
        if (!ac.signal.aborted) setError('Could not load vehicles.');
      })
      .finally(() => {
        if (!ac.signal.aborted) setVehiclesReady(true);
      });
    return () => ac.abort();
  }, []);

  const run = useCallback(async () => {
    if (selected && !vehicleId) {
      if (selectedReady) {
        setError('The selected truck is unavailable for this audit.');
        setLoading(false);
      }
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const { signal } = controller;
    const to = fixedRange
      ? new Date(`${toDay}T23:59:59.999+05:30`)
      : hasLinkedWindow
        ? new Date(linkedTo)
        : new Date();
    const from = fixedRange
      ? new Date(`${fromDay}T00:00:00+05:30`)
      : hasLinkedWindow
        ? new Date(linkedFrom)
        : new Date(to.getTime() - win * 3600000);
    setLoading(true);
    setError(null);
    setFleet(null);
    setDetail(null);
    setAppliedThr(thr);
    setAppliedDur(dur);
    try {
      if (!selected) {
        const data = await RouteHubService.getFleetOverspeed(
          {
            from: from.toISOString(),
            to: to.toISOString(),
            speedKmh: thr,
            durationSec: dur * 60,
          },
          signal,
        );
        if (signal.aborted) return;
        setFleet(data);
        setDetail(null);
        setBadge('overspeed', data?.totals?.eventCount ?? 0);
      } else {
        const data = await RouteHubService.getOverspeedEvents(
          {
            vehicleId,
            from: from.toISOString(),
            to: to.toISOString(),
            speedKmh: thr,
            durationSec: dur * 60,
          },
          signal,
        );
        if (signal.aborted) return;
        setDetail(data);
      }
    } catch (e) {
      if (!signal.aborted) setError(e?.message || 'Could not run the audit.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [
    selected,
    vehicleId,
    selectedReady,
    thr,
    dur,
    win,
    setBadge,
    fixedRange,
    fromDay,
    toDay,
    hasLinkedWindow,
    linkedFrom,
    linkedTo,
  ]);

  useEffect(() => {
    run();
    return () => request.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selected,
    vehicleId,
    selectedReady,
    win,
    fixedRange,
    fromDay,
    toDay,
    hasLinkedWindow,
    linkedFrom,
    linkedTo,
  ]);

  const rangeLabel = fixedRange || hasLinkedWindow ? 'selected period' : `last ${win} h`;

  // Stable references: the map redraws (and re-fits) only when these change.
  const events = useMemo(() => detail?.events || [], [detail]);
  const rank = useMemo(() => fleet?.vehicles || [], [fleet]);
  const totals = useMemo(() => fleet?.totals || {}, [fleet]);

  const kpis = useMemo(() => {
    if (detail) {
      const longest = events.reduce((a, e) => Math.max(a, minsOf(e.durationSec)), 0);
      const peak = events.reduce((a, e) => Math.max(a, e.maxSpeedKmh || 0), 0);
      const v = selectedVehicle;
      return [
        {
          accent: 1,
          ic: 'gauge',
          l: 'Sustained events',
          v: events.length,
          s: `over ${appliedThr} km/h for ${appliedDur}+ min · ${rangeLabel}`,
        },
        {
          ic: 'truck',
          l: 'Vehicle',
          v: v?.registrationNumber || detail.registrationNumber || '—',
          s: modelLabel(v?.model) || 'connected fleet vehicle',
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
          s: peak ? `${Math.round(peak - appliedThr)} km/h over the limit` : 'no events in window',
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
        v: totals.eventCount ?? '—',
        s: `over ${appliedThr} km/h for ${appliedDur}+ min · ${rangeLabel}`,
      },
      {
        ic: 'truck',
        l: 'Vehicles flagged',
        v: totals.vehiclesFlagged ?? '—',
        u: `of ${totals.vehicleCount ?? rank.length}`,
        s: 'connected fleet vehicles',
        c: 'var(--nova-rage-600)',
        tint: 'var(--nova-rage-a10)',
      },
      {
        ic: 'clock',
        l: 'Longest event',
        v: totals.longestDurationSec != null ? minsOf(totals.longestDurationSec) : '—',
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
          ? `${Math.round(totals.peakSpeedKmh - appliedThr)} km/h over the limit`
          : 'no events in window',
        c: '#C2323A',
        tint: 'rgba(229,104,107,.14)',
        vc: totals.peakSpeedKmh ? '#C2323A' : undefined,
      },
    ];
  }, [detail, events, totals, rank.length, appliedThr, appliedDur, rangeLabel, selectedVehicle]);

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
  const positions = useApi((signal) => LiveTrackingService.getPositions({}, { signal }), [], {
    enabled: Boolean((fleet || detail) && !located.length),
  });
  const fleetBounds = useMemo(
    () =>
      (positions.data || [])
        .filter(
          (row) =>
            !detail?.registrationNumber || row.registrationNumber === detail.registrationNumber,
        )
        .filter(
          (row) =>
            Number.isFinite(row.latitude) &&
            Number.isFinite(row.longitude) &&
            Math.abs(row.latitude) <= 90 &&
            Math.abs(row.longitude) <= 180,
        )
        .map((row) => [row.latitude, row.longitude]),
    [positions.data, detail?.registrationNumber],
  );
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
      const positionsToFit = located.length
        ? located.map((e) => [e.startLat, e.startLng])
        : fleetBounds;
      if (positionsToFit.length) {
        map.fitBounds(L.latLngBounds(positionsToFit), {
          padding: [48, 48],
          maxZoom: 11,
          animate: false,
        });
      }
    },
    [located, fleetBounds, appliedThr, Boolean(detail)],
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
        appliedThr,
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
        selected={vehicleId || selected}
        setSelected={setSelected}
        vehicles={vehicles}
        thr={thr}
        setThr={setThr}
        dur={dur}
        setDur={setDur}
        fixedRange={fixedRange || hasLinkedWindow}
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
              thr={appliedThr}
              dur={appliedDur}
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
              thr={appliedThr}
              events={events}
            />

            <OverspeedEventsCard
              events={events}
              selected={
                detail.registrationNumber || selectedVehicle?.registrationNumber || selected
              }
              appliedThr={appliedThr}
              dur={appliedDur}
              thr={appliedThr}
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
