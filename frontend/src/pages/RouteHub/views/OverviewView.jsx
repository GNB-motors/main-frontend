import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup, cityLayer } from '../routeHubMap';
import { KpiRow, RefreshButton, Seg } from '../routeHubShared.jsx';
import { HEALTH, inr, inrK } from '../routeHubFormat';

const RANGES = [
  { value: 24, label: '24 h' },
  { value: 168, label: '7 days' },
  { value: 720, label: '30 days' },
];
const SCALE_PCT = 35;
const OS_THRESHOLD = 60;
const OS_MIN_MIN = 3;
/** /api/overspeed/fleet refuses windows longer than this, so the 7d/30d
 *  ranges narrow just the overspeed panel rather than failing the request. */
const OS_MAX_HOURS = 48;

/** The design's 36-segment speed arc, lit up to the fleet's peak speed. */
function Gauge({ peak, eventCount, flagged, vehicleCount }) {
  const segs = 36;
  const lit = Math.max(0, Math.min(segs, Math.round((peak / 120) * segs)));
  const segA = (i) => -220 + i * (260 / (segs - 1));
  const line = (i, col, animate) => {
    const a = (segA(i) * Math.PI) / 180;
    const r1 = 44;
    const r2 = 54;
    return (
      <line
        key={`${col}-${i}`}
        className={animate ? 'gseg' : undefined}
        style={animate ? { animationDelay: `${120 + i * 28}ms` } : undefined}
        x1={60 + r1 * Math.cos(a)}
        y1={60 + r1 * Math.sin(a)}
        x2={60 + r2 * Math.cos(a)}
        y2={60 + r2 * Math.sin(a)}
        stroke={col}
        strokeWidth="4"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className="gauge">
      <svg width="120" height="108" viewBox="0 0 120 108">
        {Array.from({ length: segs }, (_, i) => line(i, 'var(--morning-fog-700)', false))}
        {Array.from({ length: lit }, (_, i) =>
          line(i, (i / segs) * 120 > OS_THRESHOLD ? '#C2323A' : '#F0AA48', true),
        )}
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fontSize="26"
          fontWeight="600"
          fill="currentColor"
          fontFamily="Inter"
        >
          {peak || 0}
        </text>
        <text
          x="60"
          y="80"
          textAnchor="middle"
          fontSize="10"
          fill="var(--fg-secondary)"
          fontFamily="Inter"
        >
          peak km/h
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 'var(--type-2xl)', fontWeight: 600, lineHeight: '30px' }}>
            {eventCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>sustained events</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--type-m)', fontWeight: 600 }}>
            {flagged} of {vehicleCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>vehicles flagged</div>
        </div>
      </div>
    </div>
  );
}

export default function OverviewView({ go, toast, setBadge }) {
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [deviation, setDeviation] = useState([]);
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
      RouteHubService.getDeviationEvents({ limit: 200 }).catch(() => null),
      RouteHubService.getFleetOverspeed({
        from: osFrom.toISOString(),
        to: iso.to,
        speedKmh: OS_THRESHOLD,
        durationSec: OS_MIN_MIN * 60,
      }).catch(() => null),
      RouteHubService.getRouteProfitability({ days: 30 }).catch(() => null),
      RouteHubService.getUtilization(iso).catch(() => null),
      RouteHubService.getVehicles().catch(() => []),
    ]);

    setDeviation(dev?.records || []);
    setOverspeed(os);
    setProfit(pf);
    setUtilization(util);
    setVehicles(veh || []);
    setBadge(
      'deviation',
      (dev?.records || []).filter((d) => String(d.status).toUpperCase() === 'OPEN').length,
    );
    setBadge('overspeed', os?.totals?.eventCount ?? 0);
    setLoading(false);
  }, [hours, setBadge]);

  useEffect(() => {
    load();
  }, [load]);

  const openDev = deviation.filter((d) => String(d.status || '').toUpperCase() === 'OPEN');
  const osTotals = overspeed?.totals || {};
  const target = profit?.targetMarginPct ?? 22.5;
  const routes = useMemo(
    () =>
      (profit?.routes || [])
        .map((r) => ({ ...r, health: HEALTH(r.marginPct ?? 0) }))
        .sort((a, b) => (b.marginPct ?? 0) - (a.marginPct ?? 0)),
    [profit],
  );

  const distanceKm = utilization?.totals?.totalKm ?? utilization?.totalKm ?? null;
  const activeVehicles = utilization?.vehicles?.length ?? vehicles.length;

  const kpis = [
    {
      accent: 1,
      ic: 'truck',
      l: 'Distance covered',
      v: distanceKm != null ? Math.round(distanceKm).toLocaleString('en-IN') : '—',
      u: 'km',
      s: `${activeVehicles} vehicles on ${routes.length} routes`,
    },
    {
      ic: 'split',
      l: 'Open deviations',
      v: openDev.length,
      s: `${inr(openDev.reduce((a, d) => a + (d.estimatedExtraCostInr || 0), 0))} est. detour cost`,
      c: '#C2323A',
      tint: 'rgba(229,104,107,.14)',
      vc: '#C2323A',
    },
    {
      ic: 'gauge',
      l: 'Sustained overspeed',
      v: osTotals.eventCount ?? 0,
      s: `events over ${OS_THRESHOLD} km/h for ${OS_MIN_MIN}+ min`,
      c: '#C56200',
      tint: 'rgba(240,170,72,.16)',
      vc: '#C56200',
    },
    {
      ic: 'trend',
      l: 'Fleet net margin',
      v: profit?.totals?.marginPct != null ? Number(profit.totals.marginPct).toFixed(1) : '—',
      u: '%',
      s: `target ${target}% · last 30 days`,
      c: '#187A32',
      tint: 'rgba(37,186,76,.12)',
    },
    {
      ic: 'route',
      l: 'Trips this month',
      v: profit?.totals?.tripCount ?? 0,
      s:
        profit?.totals?.revenueInr != null
          ? `${inrK(profit.totals.revenueInr)} invoiced`
          : 'no billing yet',
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

      if (withPath.length) {
        map.fitBounds(L.latLngBounds(withPath.flatMap((r) => r.path)), { padding: [40, 40] });
      }
    },
    [routes, overspeed, go],
  );

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <h2>Route hub</h2>
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

      <KpiRow items={kpis} n={5} />

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
            <div className="ov chipcard" style={{ top: 14, left: 14, maxWidth: 280 }}>
              {chip ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="eyebrow" style={{ flex: 1 }}>
                      Route
                    </span>
                    <button
                      type="button"
                      className="btn btn--sm btn--icon"
                      aria-label="Clear"
                      onClick={() => setChip(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ fontSize: 'var(--type-s)', fontWeight: 600, marginTop: 2 }}>
                    {chip.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      marginTop: 8,
                      fontSize: 11,
                      color: 'var(--fg-secondary)',
                    }}
                  >
                    <span>
                      <b style={{ color: 'var(--fg-primary)', fontSize: 'var(--type-xs)' }}>
                        {chip.distanceKm ?? '—'}
                      </b>{' '}
                      km
                    </span>
                    <span>
                      <b style={{ color: chip.health.c, fontSize: 'var(--type-xs)' }}>
                        {Number(chip.marginPct ?? 0).toFixed(1)}%
                      </b>{' '}
                      margin
                    </span>
                    <span>
                      <b style={{ color: 'var(--fg-primary)', fontSize: 'var(--type-xs)' }}>
                        {chip.tripCount ?? 0}
                      </b>{' '}
                      trips
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('profitability', { c: chip.routeId })}
                    style={{
                      display: 'inline-flex',
                      gap: 4,
                      alignItems: 'center',
                      marginTop: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--fg-brand)',
                    }}
                  >
                    Open in profitability <Ico n="arrowR" s={12} />
                  </button>
                </>
              ) : (
                <>
                  <div className="eyebrow">Network</div>
                  <div style={{ fontSize: 'var(--type-m)', fontWeight: 600, marginTop: 4 }}>
                    {routes.length} routes ·{' '}
                    {routes.reduce((a, r) => a + (r.distanceKm || 0), 0).toLocaleString('en-IN')} km
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 2 }}>
                    {routes.length ? 'Click a route for its numbers' : 'No billed routes yet'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="stack s4">
          <div className="card">
            <div className="mhead" style={{ '--c': '#C2323A', '--tint': 'rgba(229,104,107,.14)' }}>
              <span className="mic">
                <Ico n="split" s={18} />
              </span>
              <div className="mt">
                <h3>Route deviation</h3>
                <div className="ms">Trips that left their corridor</div>
              </div>
              <button
                type="button"
                className="go"
                aria-label="Open route deviation"
                onClick={() => go('deviation')}
              >
                <Ico n="arrowUR" s={15} />
              </button>
            </div>
            <div className="ministat">
              <div>
                <div className="v" style={{ color: '#C2323A' }}>
                  {openDev.length}
                </div>
                <div className="k">pending review</div>
              </div>
              <div>
                <div className="v">
                  {inr(openDev.reduce((a, d) => a + (d.estimatedExtraCostInr || 0), 0))}
                </div>
                <div className="k">est. detour cost</div>
              </div>
              <div>
                <div className="v">
                  +{openDev.reduce((a, d) => a + (d.extraKmEstimate || 0), 0).toFixed(1)}
                </div>
                <div className="k">extra km</div>
              </div>
            </div>
            <div className="rows">
              {openDev.slice(0, 3).map((d) => (
                <div className="row" key={d._id}>
                  <span className="plate">{d.registrationNumber}</span>
                  <span className="sp" />
                  <b style={{ fontVariantNumeric: 'tabular-nums' }}>+{d.extraKmEstimate ?? 0} km</b>
                  <b style={{ color: '#C2323A', width: 44, textAlign: 'right' }}>
                    {inr(d.estimatedExtraCostInr || 0)}
                  </b>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="mhead" style={{ '--c': '#C56200', '--tint': 'rgba(240,170,72,.16)' }}>
              <span className="mic">
                <Ico n="gauge" s={18} />
              </span>
              <div className="mt">
                <h3>Overspeed audit</h3>
                <div className="ms">
                  Sustained over {OS_THRESHOLD} km/h · last {Math.min(hours, OS_MAX_HOURS)} h
                </div>
              </div>
              <button
                type="button"
                className="go"
                aria-label="Open overspeed audit"
                onClick={() => go('overspeed')}
              >
                <Ico n="arrowUR" s={15} />
              </button>
            </div>
            <Gauge
              peak={osTotals.peakSpeedKmh || 0}
              eventCount={osTotals.eventCount || 0}
              flagged={osTotals.vehiclesFlagged || 0}
              vehicleCount={osTotals.vehicleCount || vehicles.length}
            />
            <div className="rows">
              {(overspeed?.vehicles || [])
                .filter((v) => v.eventCount)
                .slice(0, 3)
                .map((v) => (
                  <div className="row" key={v.vehicleId}>
                    <span className="plate">{v.registrationNumber}</span>
                    <span className="muted">
                      {v.eventCount} event{v.eventCount > 1 ? 's' : ''}
                    </span>
                    <span className="sp" />
                    <b style={{ color: '#C56200' }}>{v.peakSpeedKmh} km/h</b>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="card s7">
          <div className="mhead" style={{ '--c': '#187A32', '--tint': 'rgba(37,186,76,.12)' }}>
            <span className="mic">
              <Ico n="trend" s={18} />
            </span>
            <div className="mt">
              <h3>Route profitability</h3>
              <div className="ms">Net margin per trip · target {target}%</div>
            </div>
            <button
              type="button"
              className="go"
              aria-label="Open profitability"
              onClick={() => go('profitability')}
            >
              <Ico n="arrowUR" s={15} />
            </button>
          </div>
          <div className="bars">
            {routes.map((r) => (
              <div className="bar" key={r.routeId} style={{ '--c': r.health.c }}>
                <span className="n">
                  {r.name}{' '}
                  <span style={{ color: 'var(--fg-tertiary)', fontWeight: 400 }}>
                    · {r.distanceKm ?? '—'} km
                  </span>
                </span>
                <span className="a" style={{ color: r.health.c }}>
                  {Number(r.marginPct ?? 0).toFixed(1)}%
                </span>
                <span className="pill" style={{ '--c': r.health.c, '--tint': r.health.tint }}>
                  {r.health.l}
                </span>
                <span className="track">
                  <span
                    className="f"
                    style={{
                      width: `${Math.max(0, Math.min(100, ((r.marginPct ?? 0) / SCALE_PCT) * 100))}%`,
                    }}
                  />
                  <span
                    className="tick"
                    title={`Target ${target}%`}
                    style={{ left: `${(target / SCALE_PCT) * 100}%` }}
                  />
                </span>
              </div>
            ))}
            {routes.length ? (
              <div className="legend" style={{ marginTop: 2 }}>
                <span>
                  <i
                    style={{
                      width: 2,
                      height: 12,
                      background: 'var(--midnight-black-800)',
                      opacity: 0.55,
                    }}
                  />
                  Target {target}%
                </span>
              </div>
            ) : (
              <div className="empty">
                <b>No billed routes yet</b>
                <span>Route margin needs ERP trips with billing in the last 30 days.</span>
              </div>
            )}
          </div>
        </div>

        <div className="card s5">
          <div
            className="mhead"
            style={{ '--c': 'var(--nova-rage-600)', '--tint': 'var(--nova-rage-a10)' }}
          >
            <span className="mic">
              <Ico n="route" s={18} />
            </span>
            <div className="mt">
              <h3>Route replay</h3>
              <div className="ms">Today&apos;s vehicles · play any to replay</div>
            </div>
            <button
              type="button"
              className="go"
              aria-label="Open route replay"
              onClick={() => go('replay')}
            >
              <Ico n="arrowUR" s={15} />
            </button>
          </div>
          <div className="rows" style={{ paddingBottom: 'var(--space-4)' }}>
            {(utilization?.vehicles || vehicles.slice(0, 5)).slice(0, 5).map((v) => {
              const reg = v.registrationNumber;
              const km = v.totalKm != null ? Math.round(v.totalKm) : null;
              return (
                <div className="trip" key={reg || v._id}>
                  <button
                    type="button"
                    className="playbtn"
                    aria-label={`Replay ${reg}`}
                    onClick={() => go('replay', { v: reg })}
                  >
                    <Ico n="play" s={14} />
                  </button>
                  <div className="route">
                    <span className="plate" style={{ marginRight: 8 }}>
                      {reg}
                    </span>
                    {v.model || ''}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--fg-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {km != null ? `${km} km` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
