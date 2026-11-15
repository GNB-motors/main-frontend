import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup, cityLayer } from '../routeHubMap';
import { KpiRow, RefreshButton, Seg } from '../routeHubShared.jsx';
import { inr, inrK } from '../routeHubFormat';
import { RANGES, OS_THRESHOLD, OS_MIN_MIN, OS_MAX_HOURS } from './overview/overviewConstants.js';
import { distanceCoverage } from './overview/overviewDistance.js';
import ToneBadge from '../../../components/redesign/ToneBadge';
import { PARTIAL_LABEL } from '../../../utils/measured';
import { groupTotals, notMeasuredNote } from './deviation/deviationRules.js';
import NetworkChip from './overview/NetworkChip.jsx';
import DeviationModule from './overview/DeviationModule.jsx';
import OverspeedModule from './overview/OverspeedModule.jsx';
import ProfitabilityModule from './overview/ProfitabilityModule.jsx';
import ReplayModule from './overview/ReplayModule.jsx';

export default function OverviewView({ go, toast, setBadge }) {
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  // Skeletons only on the first load; a refresh keeps the numbers on screen.
  const [ready, setReady] = useState(false);
  const [deviation, setDeviation] = useState([]);
  const [deviationSummary, setDeviationSummary] = useState(null);
  const [overspeed, setOverspeed] = useState(null);
  const [profit, setProfit] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [chip, setChip] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - hours * 3600000);
    const iso = { from: from.toISOString(), to: to.toISOString() };
    const osHours = Math.min(hours, OS_MAX_HOURS);
    const osFrom = new Date(to.getTime() - osHours * 3600000);

    // Each panel degrades on its own — one dead endpoint shouldn't blank the page.
    const [dev, os, pf, util, veh] = await Promise.all([
      RouteHubService.getDeviationEvents({ status: 'OPEN', limit: 100 }).catch(() => null),
      RouteHubService.getFleetOverspeed({
        from: osFrom.toISOString(),
        to: iso.to,
        speedKmh: OS_THRESHOLD,
        durationSec: OS_MIN_MIN * 60,
      }).catch(() => null),
      RouteHubService.getAutoTripRunningCost({ days: 30 }).catch(() => null),
      RouteHubService.getUtilization(iso).catch(() => null),
      RouteHubService.getVehicles().catch(() => []),
    ]);

    setDeviation(dev?.records || []);
    setDeviationSummary(dev?.summary || null);
    setOverspeed(os);
    setProfit(pf);
    setUtilization(util);
    setVehicles(veh || []);
    setBadge(
      'deviation',
      dev?.summary?.open ??
        (dev?.records || []).filter((d) => String(d.status).toUpperCase() === 'OPEN').length,
    );
    setBadge('overspeed', os?.totals?.eventCount ?? 0);
    setLoading(false);
    setReady(true);
  }, [hours, setBadge]);

  useEffect(() => {
    load();
  }, [load]);

  const first = loading && !ready;
  const openDev = deviation.filter((d) => String(d.status || '').toUpperCase() === 'OPEN');
  const osTotals = overspeed?.totals || {};
  // Routes come ranked by running cost from the AutoTrip endpoint; render as-is.
  const routes = useMemo(() => profit?.routes || [], [profit]);

  // /api/owner-value/utilization returns the distance under fleet.totalKm; the
  // older totals/top-level keys are kept as fallbacks only. The new backend
  // sums only the trucks it measured, so the figure says how many it covers.
  const coverage = distanceCoverage(utilization);
  const distanceKm = coverage.distanceKm;
  const activeVehicles = utilization?.vehicles?.length ?? vehicles.length;
  // The cards do not share one timeframe: distance follows the window selector,
  // overspeed is clamped to OS_MAX_HOURS, deviations are the currently-open set,
  // and margin/trips are a 30-day roll-up. Each card states its own period.
  const osHours = Math.min(hours, OS_MAX_HOURS);

  // "No records" is never a zero. A failed endpoint is unknown ("—"), and an
  // unpriced trip has no running cost — detected trips carry no revenue, so there
  // is no margin here, only cost.
  const costTotals = profit?.totals || {};
  const noDetectedTrips = profit == null || (costTotals.tripCount ?? 0) === 0;
  const runningCostInr = costTotals.runningCostInr ?? null;
  // A detour cost nobody estimated is unknown, not ₹0. The figure counts only
  // the detours that were measured, and says how many detours are left out.
  const deviationTotals = groupTotals(openDev);
  const deviationCostInr = deviationSummary?.openCostInr ?? deviationTotals.costInr;
  const deviationCostKnown = deviationSummary?.openCostInr != null || deviationTotals.costKnown > 0;
  const deviationCostNote =
    deviationSummary?.openCostInr != null
      ? null
      : notMeasuredNote(deviationTotals.costUnknown, deviationTotals.total);

  const kpis = [
    {
      accent: 1,
      ic: 'truck',
      l: 'Distance covered',
      v: distanceKm != null ? Math.round(distanceKm).toLocaleString('en-IN') : '—',
      u: distanceKm != null ? 'km' : '',
      s: (
        <>
          {routes.length === 0
            ? `${activeVehicles} vehicles · no detected routes yet · last ${hours}h`
            : `${activeVehicles} vehicles on ${routes.length} routes · last ${hours}h`}
          {coverage.note ? ` · ${coverage.note}` : ''}
          {coverage.partial ? (
            <>
              {' '}
              <ToneBadge tone="watch">{PARTIAL_LABEL}</ToneBadge>
            </>
          ) : null}
        </>
      ),
    },
    {
      ic: 'split',
      l: 'Open deviations',
      v: deviationSummary?.open ?? openDev.length,
      s: deviationCostKnown
        ? `${inr(deviationCostInr)} est. detour cost · currently open${deviationCostNote ? ` · ${deviationCostNote}` : ''}`
        : 'Detour cost not estimated · currently open',
      c: '#C2323A',
      tint: 'rgba(229,104,107,.14)',
      vc: '#C2323A',
    },
    {
      ic: 'gauge',
      l: 'Sustained overspeed',
      v: overspeed == null ? '—' : (osTotals.eventCount ?? 0),
      s: `over ${OS_THRESHOLD} km/h for ${OS_MIN_MIN}+ min · last ${osHours}h`,
      c: '#C56200',
      tint: 'rgba(240,170,72,.16)',
      vc: '#C56200',
    },
    {
      ic: 'trend',
      l: 'Running cost',
      v: runningCostInr != null ? inrK(runningCostInr) : '—',
      u: '',
      s:
        runningCostInr != null
          ? `${costTotals.costPerKmInr != null ? `₹${Math.round(costTotals.costPerKmInr)}/km · ` : ''}last 30 days`
          : noDetectedTrips
            ? 'No detected trips yet'
            : 'Cost not priced yet',
      c: '#C56200',
      tint: 'rgba(240,170,72,.16)',
    },
    {
      ic: 'route',
      l: 'Detected trips',
      v: noDetectedTrips ? '—' : (costTotals.tripCount ?? 0),
      s: noDetectedTrips
        ? 'No detected trips yet'
        : `${costTotals.economicsTripCount ?? 0} priced · last 30 days`,
      c: 'var(--nova-rage-600)',
      tint: 'var(--nova-rage-a10)',
    },
  ];

  const { containerRef, mapRef } = useLeafletMap({ scrollWheelZoom: false });

  useLayerGroup(
    mapRef,
    (group, map) => {
      const withPath = routes.filter((r) => (r.path || []).length > 1);
      const cities = [];
      withPath.forEach((r) => {
        L.polyline(r.path, {
          color: r.health.c,
          weight: 12,
          opacity: 0.12,
          lineCap: 'round',
        }).addTo(group);
        const line = L.polyline(r.path, {
          color: r.health.c,
          weight: 4,
          opacity: 0.9,
          lineCap: 'round',
        }).addTo(group);
        line.on('click', () => setChip(r));
        line.on('mouseover', () => line.setStyle({ weight: 6 }));
        line.on('mouseout', () => line.setStyle({ weight: 4 }));
        if (r.originCity)
          cities.push({ lat: r.path[0][0], lng: r.path[0][1], label: r.originCity });
        if (r.destCity) {
          const last = r.path[r.path.length - 1];
          cities.push({ lat: last[0], lng: last[1], label: r.destCity });
        }
      });
      if (cities.length) cityLayer(map, cities);

      (overspeed?.vehicles || []).forEach((v) =>
        (v.events || [])
          .filter((e) => e.startLat != null && e.startLng != null)
          .forEach((e) =>
            L.circleMarker([e.startLat, e.startLng], {
              radius: 6,
              color: '#fff',
              weight: 2,
              fillColor: '#F0AA48',
              fillOpacity: 1,
            })
              .bindTooltip(`${v.registrationNumber} · ${e.maxSpeedKmh} km/h`, {
                className: 'tag',
                direction: 'top',
              })
              .on('click', () => go('overspeed', { v: v.vehicleId }))
              .addTo(group),
          ),
      );

      // The map frames what is actually plotted. With nothing plotted it sits
      // over India instead of the whole of Asia.
      const routePoints = withPath.flatMap((r) => r.path);
      const speedPoints = (overspeed?.vehicles || []).flatMap((v) =>
        (v.events || [])
          .filter((e) => e.startLat != null && e.startLng != null)
          .map((e) => [e.startLat, e.startLng]),
      );
      const plotted = routePoints.concat(speedPoints);
      if (plotted.length) {
        map.fitBounds(L.latLngBounds(plotted), { padding: [40, 40], maxZoom: 9 });
      } else {
        map.setView([22.5, 82], 5);
      }
    },
    [routes, overspeed, go],
  );

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <p>
            Every corridor, trip and exception across your fleet in the last 24 hours. Open any
            module for full detail.
          </p>
        </div>
        <div className="tools">
          <Seg options={RANGES} value={hours} onChange={setHours} />
          <RefreshButton
            onClick={() => {
              load();
              toast('Data refreshed');
            }}
            busy={loading}
          />
        </div>
      </div>

      <KpiRow items={kpis} n={5} loading={first} />

      <div className="bento">
        <div className="card s8" style={{ minHeight: 560 }}>
          <div className="card-head">
            <h3>Network today</h3>
            <span className="hint">Routes coloured by margin health</span>
            <span className="sp" />
            <div className="legend">
              <span>
                <i style={{ background: '#187A32' }} />
                Optimal
              </span>
              <span>
                <i style={{ background: '#2F58EE' }} />
                Healthy
              </span>
              <span>
                <i style={{ background: '#C56200' }} />
                Monitor
              </span>
              <span>
                <i style={{ background: '#C2323A' }} />
                Low margin
              </span>
              <span>
                <i className="dot" style={{ background: '#F0AA48' }} />
                Overspeed
              </span>
            </div>
          </div>
          <div className="mapbox">
            <div className="lmap" ref={containerRef} />
            <NetworkChip chip={chip} setChip={setChip} go={go} first={first} routes={routes} />
          </div>
        </div>

        <div className="stack s4">
          <DeviationModule go={go} first={first} openDev={openDev} summary={deviationSummary} />

          <OverspeedModule
            go={go}
            first={first}
            hours={hours}
            osTotals={osTotals}
            overspeed={overspeed}
            vehicles={vehicles}
          />
        </div>

        <ProfitabilityModule go={go} first={first} routes={routes} />

        <ReplayModule go={go} first={first} utilization={utilization} vehicles={vehicles} />
      </div>
    </section>
  );
}
