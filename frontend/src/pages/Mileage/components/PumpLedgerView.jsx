import React, { useState } from 'react';
import DataTable from '../../../components/ui/DataTable';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import StatusChip from '../../../components/ui/StatusChip';
import apiClient from '../../../utils/axiosConfig';
import { useApi } from '../../../hooks/useApi';
import { parseSafe } from '../../../schemas/validate';
import { toISTDateString } from '../../../utils/dateUtils';
import { formatINR, formatInrCompact, formatLitres, formatNum } from '../../../utils/formatters';
import { PUMP_MIN_FILLS, mapPumpRow, pumpLedgerSummary, rangeToParams } from '../mileageRows';
import InfoTip from './InfoTip';

const fetchPumpLedger = (range, signal) =>
  apiClient
    .get('/api/fuel-integrity/pump-ledger', { params: rangeToParams(range), signal })
    .then((res) =>
      parseSafe(
        'pumpLedgerSchema',
        () => import('../../../schemas/pumpLedger.schema.js'),
        res.data?.data ?? null,
      ),
    );

const barColour = (p) =>
  p.status === 'INSUFFICIENT_DATA'
    ? '#94a3b8'
    : p.shortfallPct > 6
      ? '#ef4444'
      : p.shortfallPct > 1
        ? '#f59e0b'
        : '#10b981';

const explainPump = (p, price) => ({
  title: p.station.displayName,
  text:
    p.status === 'INSUFFICIENT_DATA'
      ? `Only ${p.fills} fill${p.fills === 1 ? '' : 's'} here so far. One fill can be off for many reasons, so a pump is judged after ${PUMP_MIN_FILLS}.`
      : 'Over all matched fills here: the diesel billed against what reached the tanks.',
  lines: [
    ['Billed', formatLitres(p.claimedLitres)],
    ['Reached tanks', formatLitres(p.actualLitres)],
    [
      'Short',
      `${formatLitres(p.shortfallLitres)} (${p.shortfallPct != null ? p.shortfallPct.toFixed(1) : '—'}%)`,
    ],
    [
      'Money lost',
      `${formatINR(p.lossInr)}${price != null ? ` at ${formatINR(price, { decimals: 2 })}/L` : ''}`,
    ],
    ['Honest', '1% or less short'],
    ['Mostly fine', 'up to 3%'],
    ['Watch this pump', 'up to 6%'],
    ['Often short', 'up to 10%'],
    ['Always short', 'over 10%'],
  ],
});

const columns = (price) => [
  {
    key: 'pump',
    label: 'Pump',
    render: (p) => (
      <span title={p.pump || undefined}>
        <strong>{p.station.displayName}</strong>
        {p.station.location ? <span className="mhub-sub">{p.station.location}</span> : null}
      </span>
    ),
  },
  {
    key: 'fills',
    label: 'Fills',
    align: 'right',
    render: (p) => <span className="num">{formatNum(p.fills)}</span>,
  },
  {
    key: 'verdict',
    label: 'Verdict',
    render: (p) => (
      <span className="mhub-cell">
        <StatusChip group="pumpHonesty" value={p.status} />
        <InfoTip explanation={explainPump(p, price)} />
      </span>
    ),
  },
  {
    key: 'short',
    label: 'Short',
    align: 'right',
    render: (p) => (
      <span>
        <span className="mhub-litres">{formatLitres(p.shortfallLitres, { decimals: 0 })}</span>
        <span className="mhub-bar" aria-hidden>
          <span
            style={{
              width: `${Math.min(100, Math.max(4, (p.shortfallPct || 0) * 10))}%`,
              background: barColour(p),
            }}
          />
        </span>
      </span>
    ),
  },
  {
    key: 'lost',
    label: 'Money lost',
    align: 'right',
    render: (p) => (
      <span
        className="num"
        style={{ color: p.lossInr > 0 ? '#ef4444' : undefined, fontWeight: 600 }}
      >
        {formatINR(p.lossInr)}
      </span>
    ),
  },
  {
    key: 'last',
    label: 'Last fill',
    render: (p) => (
      <span className="num">{p.lastFillAt ? toISTDateString(p.lastFillAt) : '—'}</span>
    ),
  },
];

const Tile = ({ label, value, valueClass = '', sub }) => (
  <section className="mhub-kpi" aria-label={label}>
    <div className="mhub-kpi-head">
      <span>{label}</span>
    </div>
    <div className={`mhub-kpi-value ${valueClass}`}>{value}</div>
    <div className="mhub-kpi-foot">
      <span>{sub}</span>
    </div>
  </section>
);

/**
 * Pump honesty — GET /api/fuel-integrity/pump-ledger: per pump, litres billed
 * against what reached the tank over bills matched to a tank rise, with a
 * verdict once the pump has enough fills.
 */
export default function PumpLedgerView({ range, searchQuery = '' }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [queryKey, setQueryKey] = useState(`${searchQuery}|${range.from}|${range.to}`);
  const nextKey = `${searchQuery}|${range.from}|${range.to}`;
  if (queryKey !== nextKey) {
    setQueryKey(nextKey);
    setPage(1);
  }

  const { data, loading, error, refetch } = useApi(
    (signal) => fetchPumpLedger(range, signal),
    [range.from, range.to],
  );

  const rows = (data?.pumps || []).map(mapPumpRow);
  const summary = pumpLedgerSummary(rows);
  const needle = searchQuery.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((r) =>
        [r.pump, r.station.displayName, r.station.location].some((s) =>
          (s || '').toLowerCase().includes(needle),
        ),
      )
    : rows;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const ready = Boolean(data) && !error;
  const dash = loading ? '…' : '—';
  const avoid = rows.filter(
    (r) => r.status === 'UNRELIABLE' || r.status === 'CHRONIC_SHORTAGE',
  ).length;

  return (
    <div className="mhub">
      <div className="mhub-kpis">
        <Tile
          label="Fills checked"
          value={ready ? formatNum(summary.fills) : dash}
          sub={ready ? `${formatNum(summary.pumps)} pumps` : ' '}
        />
        <Tile
          label="Diesel not delivered"
          value={ready ? formatLitres(summary.shortfallLitres, { decimals: 0 }) : dash}
          sub="Billed but never reached the tank"
        />
        <Tile
          label="Money lost (approx.)"
          valueClass="mhub-kpi-value--critical"
          value={ready ? formatInrCompact(summary.lossInr) : dash}
          sub={
            data?.fuelPriceInrPerL != null
              ? `At ${formatINR(data.fuelPriceInrPerL, { decimals: 2 })} a litre`
              : 'At the diesel price'
          }
        />
        <Tile
          label="Pumps to avoid"
          valueClass={avoid > 0 ? 'mhub-kpi-value--critical' : ''}
          value={ready ? formatNum(avoid) : dash}
          sub="Often or always short"
        />
      </div>

      <DataTable
        columns={columns(data?.fuelPriceInrPerL)}
        rows={pageRows}
        rowKey={(p) => p.id}
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        showing={pageRows.length}
        total={filtered.length}
        emptyTitle={rows.length ? 'No pump matches this search' : 'No matched bills in these dates'}
        emptyHint={
          rows.length ? null : 'Pumps show up once their bills are matched to a tank rise.'
        }
        pagination={
          <EnterprisePagination
            page={page}
            totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      />
      {data?.disclaimer && <p className="mhub-footnote">{data.disclaimer}</p>}
    </div>
  );
}
