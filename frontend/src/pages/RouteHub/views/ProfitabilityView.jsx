import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup, cityLayer } from '../routeHubMap';
import { KpiRow, RefreshButton, Skel } from '../routeHubShared.jsx';
import { HEALTH, downloadCsv, inrK } from '../routeHubFormat';
import MarginEquation from './profitability/MarginEquation.jsx';
import ProfitabilityTable from './profitability/ProfitabilityTable.jsx';
import RouteCostCard from './profitability/RouteCostCard.jsx';

export default function ProfitabilityView({ params, toast, go }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selId, setSelId] = useState(params.get('c') || null);
  const first = loading && !data;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await RouteHubService.getRouteProfitability({ days: 30 }));
    } catch (e) {
      setError(e?.message || 'Could not load profitability.');
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

      <KpiRow items={kpis} loading={first} />

      <MarginEquation first={first} totals={totals} />

      <ProfitabilityTable
        routes={routes}
        selected={selected}
        setSelId={setSelId}
        target={target}
        first={first}
        error={error}
      />

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
            ) : first ? (
              <Skel w={200} h={16} />
            ) : (
              <h3>No route selected</h3>
            )}
          </div>
          <div className="mapbox">
            <div className="lmap" ref={containerRef} />
          </div>
        </div>

        <RouteCostCard
          selected={selected}
          slices={slices}
          costTotal={costTotal}
          target={target}
          data={data}
          first={first}
        />
      </div>
    </section>
  );
}
