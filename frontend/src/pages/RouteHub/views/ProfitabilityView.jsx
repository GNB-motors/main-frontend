import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup, cityLayer } from '../routeHubMap';
import { KpiRow, RefreshButton, TableEmpty } from '../routeHubShared.jsx';
import { HEALTH, downloadCsv, inr, inrK } from '../routeHubFormat';

/** Cost-slice colours, in the design's order. */
const SLICE = {
  diesel: { label: 'Diesel', color: '#2F58EE' },
  tolls: { label: 'Fastag tolls', color: '#6A43D8' },
  driver: { label: 'Driver allowance', color: '#C56200' },
  adblue: { label: 'AdBlue', color: '#1C9AA8' },
  wear: { label: 'Wear & tyres', color: '#9A9AA5' },
};
/** The bars and the margin meter are drawn against a fixed 35% ceiling. */
const SCALE_PCT = 35;

export default function ProfitabilityView({ params, toast, go }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selId, setSelId] = useState(params.get('c') || null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await RouteHubService.getRouteProfitability({ days: 30 }));
    } catch (e) {
      setError(e?.detail || e?.message || 'Could not load profitability.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const target = data?.targetMarginPct ?? 22.5;
  const routes = useMemo(
    () =>
      (data?.routes || [])
        .map((r) => ({ ...r, health: HEALTH(r.marginPct ?? 0) }))
        .sort((a, b) => (b.marginPct ?? 0) - (a.marginPct ?? 0)),
    [data],
  );

  const selected = routes.find((r) => r.routeId === selId) || routes[routes.length - 1] || null;
  const totals = data?.totals || {};
  const below = routes.filter((r) => (r.marginPct ?? 0) < target);

  const { containerRef, mapRef } = useLeafletMap({ scrollWheelZoom: false });

  useLayerGroup(
    mapRef,
    (group, map) => {
      const withPath = routes.filter((r) => (r.path || []).length > 1);
      if (!withPath.length) return;
      const cities = [];
      withPath.forEach((r) => {
        const on = selected && r.routeId === selected.routeId;
        if (on) L.polyline(r.path, { color: r.health.c, weight: 14, opacity: 0.16 }).addTo(group);
        L.polyline(r.path, {
          color: r.health.c,
          weight: on ? 5 : 3,
          opacity: on ? 1 : 0.3,
          lineCap: 'round',
        })
          .on('click', () => setSelId(r.routeId))
          .addTo(group);
        if (r.originCity)
          cities.push({ lat: r.path[0][0], lng: r.path[0][1], label: r.originCity });
        if (r.destCity) {
          const last = r.path[r.path.length - 1];
          cities.push({ lat: last[0], lng: last[1], label: r.destCity });
        }
      });
      cityLayer(map, cities);
      const focus = selected?.path?.length ? selected.path : withPath.flatMap((r) => r.path);
      if (focus.length) {
        map.flyToBounds(L.latLngBounds(focus), { padding: [60, 60], duration: 0.6, maxZoom: 8 });
      }
    },
    [routes, selected],
  );

  const kpis = [
    {
      accent: 1,
      ic: 'trend',
      l: 'Fleet net margin',
      v: totals.marginPct != null ? Number(totals.marginPct).toFixed(1) : '—',
      u: totals.marginPct != null ? '%' : '',
      s:
        totals.marginPct != null
          ? `${(totals.marginPct - target).toFixed(1)} pts vs ${target}% target`
          : 'no billed trips in window',
    },
    {
      ic: 'ledger',
      l: 'Invoiced revenue',
      v: totals.revenueInr != null ? inrK(totals.revenueInr) : '—',
      s: `${totals.tripCount ?? 0} trips · ERP billing`,
      c: 'var(--nova-rage-600)',
      tint: 'var(--nova-rage-a10)',
    },
    {
      ic: 'fuel',
      l: 'Running cost',
      v: totals.costInr != null ? inrK(totals.costInr) : '—',
      s: 'fuel, AdBlue, Fastag and allowances',
      c: '#C56200',
      tint: 'rgba(240,170,72,.16)',
    },
    {
      ic: 'target',
      l: 'Below target',
      v: below.length,
      u: `of ${routes.length}`,
      s: below.length
        ? `lowest: ${[...below].sort((a, b) => a.marginPct - b.marginPct)[0].name}`
        : 'all routes on target',
      c: '#C2323A',
      tint: 'rgba(229,104,107,.14)',
      vc: below.length ? '#C2323A' : undefined,
    },
  ];

  const exportCsv = () => {
    const out = [
      ['route', 'km', 'trips', 'avg_rev_inr', 'avg_cost_inr', 'margin_inr', 'margin_pct', 'health'],
    ].concat(
      routes.map((r) => [
        r.name,
        r.distanceKm,
        r.tripCount,
        r.avgRevenueInr,
        r.avgCostInr,
        r.avgMarginInr,
        r.marginPct,
        r.health.l,
      ]),
    );
    downloadCsv('route-profitability', out);
    toast(`${out.length - 1} rows exported`);
  };

  const slices = selected?.costBreakdown || [];
  const costTotal = slices.reduce((a, s) => a + (s.amountInr || 0), 0) || 1;

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <a
            className="crumb"
            href="?tab=overview"
            onClick={(e) => {
              e.preventDefault();
              go('overview');
            }}
          >
            <Ico n="arrowL" s={14} />
            Route hub
          </a>
          <h2>Route profitability</h2>
          <p>
            ERP revenue joined with GPS-measured running cost, so each route shows its real margin
            per trip.
          </p>
        </div>
        <div className="tools">
          <RefreshButton onClick={load} busy={loading} />
          <button type="button" className="btn" onClick={exportCsv}>
            <Ico n="download" />
            Export
          </button>
        </div>
      </div>

      <KpiRow items={kpis} />

      <div className="card">
        <div className="card-head">
          <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
            <Ico n="layers" />
          </span>
          <h3>How margin is calculated</h3>
          <span className="hint">Last 30 days · all routes</span>
        </div>
        <div className="equation">
          <div className="eqbox" style={{ '--c': 'var(--nova-rage-600)' }}>
            <div className="h">
              <Ico n="ledger" s={16} />
              Commercial revenue (ERP)
            </div>
            <div className="v">{totals.revenueInr != null ? inrK(totals.revenueInr) : '—'}</div>
            <div className="d">
              Contracted freight rates, billed invoices, detention charges and loading manifests.
            </div>
          </div>
          <span className="op">−</span>
          <div className="eqbox" style={{ '--c': '#C56200' }}>
            <div className="h">
              <Ico n="fuel" s={16} />
              Telematics &amp; direct cost
            </div>
            <div className="v">{totals.costInr != null ? inrK(totals.costInr) : '—'}</div>
            <div className="d">
              GPS odometer km, diesel refuels, AdBlue top-ups, Fastag toll debits and trip
              allowances.
            </div>
          </div>
          <span className="op">=</span>
          <div className="eqbox res" style={{ '--c': '#187A32' }}>
            <div className="h">
              <Ico n="trend" s={16} />
              Net margin per route
            </div>
            <div className="v" style={{ color: '#187A32' }}>
              {totals.marginInr != null ? inrK(totals.marginInr) : '—'}
              {totals.marginPct != null ? (
                <span style={{ fontSize: 'var(--type-s)' }}>
                  {' '}
                  · {Number(totals.marginPct).toFixed(1)}%
                </span>
              ) : null}
            </div>
            <div className="d">
              Routes ranked by earnings, with unbilled km, diesel siphoning and rate undercutting
              flagged.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
            <Ico n="split" />
          </span>
          <h3>Route profitability benchmark</h3>
          <span className="hint">Per trip averages · select a route for its cost breakdown</span>
        </div>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Route</th>
                <th className="num">Distance</th>
                <th className="num">Trips</th>
                <th className="num">Avg invoiced rev</th>
                <th className="num">Avg running cost</th>
                <th className="num">Est. margin</th>
                <th>Margin %</th>
                <th>Health</th>
              </tr>
            </thead>
            {routes.length ? (
              <tbody>
                {routes.map((r, i) => (
                  <tr
                    key={r.routeId}
                    className={`click ${selected && r.routeId === selected.routeId ? 'sel' : ''}`}
                    onClick={() => setSelId(r.routeId)}
                  >
                    <td>
                      <span className="plate">#{i + 1}</span>
                    </td>
                    <td className="strong">
                      {r.originCity || '—'} <span style={{ color: 'var(--fg-tertiary)' }}>→</span>{' '}
                      {r.destCity || '—'}
                    </td>
                    <td className="num mono">{r.distanceKm ?? '—'} km</td>
                    <td className="num mono">{r.tripCount ?? 0}</td>
                    <td className="num mono strong">{inr(r.avgRevenueInr || 0)}</td>
                    <td className="num mono">{inr(r.avgCostInr || 0)}</td>
                    <td
                      className="num mono strong"
                      style={{ color: (r.avgMarginInr || 0) >= 0 ? '#187A32' : '#C2323A' }}
                    >
                      {(r.avgMarginInr || 0) >= 0 ? '+' : ''}
                      {inr(r.avgMarginInr || 0)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="mono strong" style={{ color: r.health.c, width: 42 }}>
                          {Number(r.marginPct ?? 0).toFixed(1)}%
                        </span>
                        <span className="mbar" style={{ '--c': r.health.c }}>
                          <span
                            className="f"
                            style={{
                              width: `${Math.max(0, Math.min(100, ((r.marginPct ?? 0) / SCALE_PCT) * 100))}%`,
                            }}
                          />
                          <span
                            className="tick"
                            style={{ left: `${(target / SCALE_PCT) * 100}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{ '--c': r.health.c, '--tint': r.health.tint }}>
                        {r.health.l}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <TableEmpty
                colSpan={9}
                title={
                  loading
                    ? 'Loading…'
                    : error
                      ? 'Profitability unavailable'
                      : 'No billed routes yet'
                }
                sub={
                  error ||
                  (loading
                    ? 'Joining ERP billing with measured running cost.'
                    : 'No ERP trips with billing in the last 30 days.')
                }
                tone={error ? '#C56200' : '#187A32'}
                icon={error ? 'alert' : 'check'}
              />
            )}
          </table>
        </div>
      </div>

      <div className="bento">
        <div className="card s7" style={{ minHeight: 420 }}>
          <div className="card-head">
            {selected ? (
              <>
                <h3>{selected.name}</h3>
                <span
                  className="pill"
                  style={{ '--c': selected.health.c, '--tint': selected.health.tint }}
                >
                  {selected.health.l}
                </span>
                <span className="sp" />
                <span className="hint">
                  {selected.distanceKm ?? '—'} km · {selected.tripCount ?? 0} trips this month
                </span>
              </>
            ) : (
              <h3>No route selected</h3>
            )}
          </div>
          <div className="mapbox">
            <div className="lmap" ref={containerRef} />
          </div>
        </div>

        <div className="card s5">
          {selected ? (
            <>
              <div className="card-head">
                <h3>Cost per trip</h3>
                <span className="sp" />
                <span className="mono strong">{inr(selected.avgCostInr || 0)}</span>
              </div>
              <div className="stackbar">
                {slices.map((s) => (
                  <span
                    key={s.key}
                    title={SLICE[s.key]?.label || s.key}
                    style={{
                      width: `${((s.amountInr || 0) / costTotal) * 100}%`,
                      background: SLICE[s.key]?.color || '#9A9AA5',
                    }}
                  />
                ))}
              </div>
              <div className="costlist">
                {slices.map((s) => (
                  <div className="r" key={s.key}>
                    <i style={{ background: SLICE[s.key]?.color || '#9A9AA5' }} />
                    <span>
                      {SLICE[s.key]?.label || s.key}
                      {s.assumed ? (
                        <span
                          className="hint"
                          style={{ marginLeft: 6, fontSize: 10 }}
                          title="Not measured — derived from a configured per-trip assumption"
                        >
                          assumed
                        </span>
                      ) : null}
                    </span>
                    <span className="sp" />
                    <b>{inr(s.amountInr || 0)}</b>
                    <span className="pc">
                      {(((s.amountInr || 0) / costTotal) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="perkm">
                <div>
                  <div className="k">Revenue / km</div>
                  <div className="v">₹{Math.round(selected.revenuePerKm ?? 0)}</div>
                </div>
                <div>
                  <div className="k">Cost / km</div>
                  <div className="v">₹{Math.round(selected.costPerKm ?? 0)}</div>
                </div>
                <div>
                  <div className="k">Margin / km</div>
                  <div className="v" style={{ color: selected.health.c }}>
                    ₹{Math.round((selected.revenuePerKm ?? 0) - (selected.costPerKm ?? 0))}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  fontSize: 'var(--type-2xs)',
                  color: 'var(--fg-secondary)',
                  lineHeight: '19px',
                }}
              >
                {(selected.marginPct ?? 0) >= target ? (
                  <>
                    Beating the {target}% target by{' '}
                    <b style={{ color: 'var(--fg-primary)' }}>
                      {((selected.marginPct ?? 0) - target).toFixed(1)} pts
                    </b>
                    . Running cost could rise to{' '}
                    {inr((selected.avgRevenueInr || 0) * (1 - target / 100))} per trip before it
                    misses target.
                  </>
                ) : (
                  <>
                    To reach {target}%, cut running cost by{' '}
                    <b style={{ color: '#C2323A' }}>
                      {inr(
                        (selected.avgCostInr || 0) -
                          (selected.avgRevenueInr || 0) * (1 - target / 100),
                      )}
                    </b>{' '}
                    per trip or raise the rate to{' '}
                    <b style={{ color: 'var(--fg-primary)' }}>
                      {inr((selected.avgCostInr || 0) / (1 - target / 100))}
                    </b>
                    .
                  </>
                )}
              </div>
              {data?.disclaimer ? (
                <div
                  style={{
                    padding: '0 16px 14px',
                    fontSize: 11,
                    color: 'var(--fg-tertiary)',
                    lineHeight: '17px',
                  }}
                >
                  {data.disclaimer}
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty">
              <b>No route selected</b>
              <span>Pick a route from the benchmark table.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
