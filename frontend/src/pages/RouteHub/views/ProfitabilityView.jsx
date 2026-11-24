import React, { useMemo, useState } from 'react';
import useApi from '../../../hooks/useApi';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { KpiRow, RefreshButton } from '../routeHubShared.jsx';
import { downloadCsv, inrK } from '../routeHubFormat';
import MoneyStrip from './profitability/MoneyStrip.jsx';
import ProfitabilityTable from './profitability/ProfitabilityTable.jsx';
import TripPnlTable from './profitability/TripPnlTable.jsx';

// The window every figure on this page is computed over. One control, so the
// running cost and the money strip can never be read over different spans.
const WINDOWS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const kmFmt = (n) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.round(n).toLocaleString('en-IN') : '—';

export default function ProfitabilityView({ toast }) {
  const [selId, setSelId] = useState(null);
  const [win, setWin] = useState(30);
  const [anchor, setAnchor] = useState(Date.now);
  const range = useMemo(
    () => ({
      from: new Date(anchor - win * 86400000).toISOString(),
      to: new Date(anchor).toISOString(),
    }),
    [win, anchor],
  );
  const scopeKey = `${win}:${anchor}`;
  const { data, loading, error } = useApi(
    (signal) => RouteHubService.getAutoTripRunningCost(range, signal),
    [scopeKey],
    { scopeKey },
  );
  const cash = useApi((signal) => RouteHubService.getMoney(range, signal), [scopeKey], {
    scopeKey,
  });
  const first = loading && !data;
  const load = () => setAnchor(Date.now());

  const routes = useMemo(() => data?.routes || [], [data]);
  const trips = useMemo(() => data?.trips || [], [data]);
  const totals = data?.totals || {};
  const selected = routes.find((r) => r.routeId === selId) || null;
  const windowLabel = (WINDOWS.find((w) => w.value === win) || {}).label || `last ${win} days`;

  const priceNote =
    totals.tripCount > 0
      ? `cost from ${totals.economicsTripCount ?? 0} of ${totals.tripCount} priced trips`
      : 'no detected trips in window';

  const kpis = [
    {
      accent: 1,
      ic: 'route',
      l: 'Detected trips',
      v: totals.tripCount ?? '—',
      s: `${windowLabel.toLowerCase()} · AutoTrip telemetry`,
    },
    {
      ic: 'trend',
      l: 'Distance',
      v: kmFmt(totals.distanceKm),
      u: 'km',
      s: 'driven across detected trips',
      c: 'var(--nova-rage-600)',
      tint: 'var(--nova-rage-a10)',
    },
    {
      ic: 'fuel',
      l: 'Running cost',
      v: totals.runningCostInr != null ? inrK(totals.runningCostInr) : '—',
      s: priceNote,
      c: '#C56200',
      tint: 'rgba(240,170,72,.16)',
    },
    {
      ic: 'ledger',
      l: 'Cost per km',
      v: totals.costPerKmInr != null ? `₹${Math.round(totals.costPerKmInr)}` : '—',
      s: 'fuel + wear, priced trips only',
      c: '#6A43D8',
      tint: 'rgba(106,67,216,.12)',
    },
  ];

  const exportCsv = () => {
    const out = [
      [
        'origin',
        'destination',
        'trips',
        'priced_trips',
        'distance_km',
        'avg_cost_inr',
        'cost_per_km_inr',
      ],
    ].concat(
      routes.map((r) => [
        r.origin || '',
        r.destination || '',
        r.tripCount,
        r.economicsTripCount,
        r.distanceKm,
        r.avgCostPerTripInr ?? '',
        r.costPerKmInr ?? '',
      ]),
    );
    downloadCsv('route-running-cost', out);
    toast(`${out.length - 1} rows exported`);
  };

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <h2>Route running cost</h2>
          <p>
            Running cost per route and per trip, measured from AutoTrip GPS telemetry. Detected
            trips carry no revenue, so this is cost only — no margin is shown.
          </p>
        </div>
        <div className="tools">
          <span className="field">
            <SearchableSelect
              aria-label="Time window"
              value={win}
              onChange={(e) => setWin(Number(e.target.value))}
            >
              {WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </SearchableSelect>
          </span>
          <RefreshButton onClick={load} busy={loading} />
          <button type="button" className="btn" onClick={exportCsv} disabled={!routes.length}>
            <Ico n="download" />
            Export
          </button>
        </div>
      </div>

      <div className="card prof-howto">
        <div className="card-head">
          <span style={{ color: '#2F58EE', display: 'flex' }}>
            <Ico n="eye" />
          </span>
          <h3>How to read this</h3>
          <span className="hint">cost from AutoTrip GPS telemetry</span>
        </div>
        <ul className="prof-howto__list">
          <li>
            <b>Running cost only.</b> Detected trips carry no revenue, so there is no profit or
            margin here — just what each lane and trip cost to run (fuel + wear).
          </li>
          <li>
            <b>Cost shows for priced trips.</b> The economics engine prices some trips; the “priced”
            count is how many. Unpriced rows read “—”, never ₹0.
          </li>
          <li>
            <b>Pick a time window</b> (top-right), read lanes by running cost on the left, and
            scroll the latest trips on the right. Export sends the full lane table to CSV.
          </li>
        </ul>
      </div>

      {error ? (
        <div className="card">
          <div className="empty">
            <span style={{ color: '#C56200' }}>
              <Ico n="alert" s={28} />
            </span>
            <b>Running cost unavailable</b>
            <span>{error.message || 'Try again to load route costs.'}</span>
          </div>
        </div>
      ) : null}

      <KpiRow items={kpis} loading={first} />

      {cash.error && !cash.data ? (
        <p role="status">
          Cost indicators could not load.{' '}
          <button type="button" className="btn" onClick={cash.refetch}>
            Retry cost indicators
          </button>
        </p>
      ) : (
        <MoneyStrip money={cash.data} loading={cash.loading && !cash.data} />
      )}

      <div className="bento">
        <ProfitabilityTable
          className="s6"
          routes={routes}
          selected={selected}
          setSelId={setSelId}
          first={first}
          error={error}
          windowLabel={windowLabel}
        />

        <TripPnlTable className="s6" trips={trips} first={first} error={error} />
      </div>

      {data?.disclaimer ? <p className="hint">{data.disclaimer}</p> : null}
    </section>
  );
}
