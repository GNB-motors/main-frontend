import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import ExportButton from '../../components/ui/ExportButton';
import { formatINR, formatInrCompact, formatNum, formatLitres } from '../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../utils/dateUtils';

const WINDOWS = [
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: '90d', days: 90 },
  { key: 'all', days: null },
];

const PAGE_SIZE = 20;
const PRICE_SWING_THRESHOLD = 2;

// Refuel columns for export. Numbers stay numbers so the sheet totals them;
// the refuel time is a real date, not a pre-formatted string.
const RECORD_COLUMNS = [
  { key: 'refuelTime', label: 'Refuel time', type: 'date' },
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'fuelType', label: 'Fuel type' },
  { key: 'fillingType', label: 'Filling type' },
  { key: 'litres', label: 'Litres', type: 'number' },
  { key: 'rate', label: 'Rate (INR/L)', type: 'currency' },
  { key: 'totalAmount', label: 'Amount (INR)', type: 'currency' },
  { key: 'location', label: 'Location' },
  { key: 'mileageKmPerL', label: 'Mileage (km/L)', type: 'number' },
];

const rateOf = (v) =>
  v == null || Number.isNaN(Number(v)) ? '—' : `₹${formatNum(v, { decimals: 2 })}`;
const dayTick = (d) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

function StatTile({ label, value, tone }) {
  return (
    <div className="cluster-inset flex flex-col gap-1 p-4">
      <span className="cluster-eyebrow">{label}</span>
      <span className="num text-xl font-bold" style={{ color: tone }}>
        {value}
      </span>
    </div>
  );
}

function DailyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="cluster-inset flex flex-col gap-1 px-3 py-2 text-xs">
      <span className="num font-semibold">{formatDateIST(d.date)}</span>
      <span className="num" style={{ color: 'var(--gnb-400)' }}>
        {formatINR(d.amountInr)}
      </span>
      <span className="num" style={{ color: 'var(--caution)' }}>
        {formatLitres(d.litres)}
      </span>
      <span className="text-dim">{formatNum(d.logCount)} fill-ups</span>
    </div>
  );
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="cluster-inset h-10 animate-pulse" />
      ))}
    </div>
  );
}

const HEAD_CELL = 'px-4 py-3 font-semibold';
const HEAD_NUM = `num ${HEAD_CELL} text-right`;

export default function FuelSpendPage() {
  const [preset, setPreset] = useState('30d');
  const [page, setPage] = useState(1);

  const windowParams = useMemo(() => {
    const w = WINDOWS.find((x) => x.key === preset);
    if (!w?.days) return {};
    const to = new Date();
    const from = new Date(to.getTime() - w.days * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [preset]);

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useApi((signal) => FleetDataService.getFuelSpendSummary(windowParams, signal), [preset]);

  const {
    data: recordsData,
    loading: recordsLoading,
    error: recordsError,
  } = useApi(
    (signal) =>
      FleetDataService.getFuelSpendRecords({ ...windowParams, page, limit: PAGE_SIZE }, signal),
    [preset, page],
  );

  const totals = summary?.totals || {};
  const daily = summary?.daily || [];
  const byLocation = summary?.byLocation || [];
  const byVehicle = summary?.byVehicle || [];
  const records = recordsData?.records || [];
  const totalPages = recordsData?.totalPages || 1;

  const selectPreset = (key) => {
    setPreset(key);
    setPage(1);
  };

  // The export carries the window and the page it was taken from, so a file
  // that outlives this screen still says what it is. Only the loaded page is
  // exported — the records endpoint is paginated and there is no fetch-all.
  const exportMeta = {
    filters: [
      {
        label: 'Window',
        value: WINDOWS.find((w) => w.key === preset)?.days
          ? `Last ${WINDOWS.find((w) => w.key === preset).days} days`
          : 'All time',
      },
      { label: 'Rows', value: `Page ${page} of ${totalPages} · ${records.length} refuels` },
    ],
    generatedAt: new Date(),
  };

  const summaryGone = summaryError && !summary;
  const recordsGone = recordsError && !recordsData;

  return (
    <div className="cluster-page">
      <PageShell
        title="Fuel Spend"
        subtitle="What the fleet actually paid for fuel — from uploaded bills and receipts."
        count={totals.logCount ?? null}
        actions={
          <ExportButton
            rows={records}
            columns={RECORD_COLUMNS}
            filename={`fuel-spend-${preset}-page-${page}`}
            meta={exportMeta}
            disabled={!records.length}
          />
        }
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => selectPreset(w.key)}
                aria-pressed={preset === w.key}
                className="cluster-inset num px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                style={
                  preset === w.key
                    ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' }
                    : { color: 'var(--cluster-text-dim)' }
                }
              >
                {w.days ? w.key : 'All'}
              </button>
            ))}
          </div>
        }
      >
        <PanelErrorBoundary name="fuel-spend">
          {summaryLoading && !summary ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="cluster-inset h-[76px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                label="Total spend"
                value={formatInrCompact(totals.amountInr)}
                tone="var(--cluster-text)"
              />
              <StatTile
                label="Litres"
                value={formatLitres(totals.litres)}
                tone="var(--cluster-text)"
              />
              <StatTile
                label="Fill-ups"
                value={formatNum(totals.logCount)}
                tone="var(--cluster-text)"
              />
              <StatTile
                label="Avg rate"
                value={totals.avgRateInrPerL != null ? `${rateOf(totals.avgRateInrPerL)}/L` : '—'}
                tone="var(--cluster-text)"
              />
            </div>
          )}

          <div className="cluster-panel mt-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
              <span className="cluster-eyebrow">Daily fuel spend</span>
              <span
                className="flex items-center gap-3 text-[11px]"
                style={{ color: 'var(--cluster-text-dim)' }}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: 'var(--gnb-400)' }}
                  />{' '}
                  Spend (₹)
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: 'var(--caution)' }}
                  />{' '}
                  Litres
                </span>
              </span>
            </div>
            {summaryLoading && !summary ? (
              <div className="p-4">
                <div className="cluster-inset h-[280px] animate-pulse" />
              </div>
            ) : summaryGone ? (
              <div className="p-4">
                <EmptyState
                  title="Fuel spend unavailable"
                  hint="This rollup reads the fuel bills uploaded for your vehicles. It appears here once bills come in — please try again in a moment if you expected data."
                />
              </div>
            ) : daily.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No fuel spend in this window"
                  hint="Every uploaded fuel bill with litres × rate becomes a data point here."
                />
              </div>
            ) : (
              <div className="h-[280px] w-full p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={daily} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--hairline)"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={dayTick}
                      tick={{ fontSize: 11, fill: 'var(--cluster-text-dim)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(v) => formatInrCompact(v)}
                      tick={{ fontSize: 11, fill: 'var(--cluster-text-dim)' }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => formatNum(v)}
                      tick={{ fontSize: 11, fill: 'var(--cluster-text-dim)' }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      content={<DailyTooltip />}
                      cursor={{ fill: 'var(--hairline)', opacity: 0.3 }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="amountInr"
                      name="Spend"
                      fill="var(--gnb-400)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="litres"
                      name="Litres"
                      stroke="var(--caution)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="cluster-panel overflow-hidden lg:col-span-3">
              <div className="px-4 pt-4">
                <span className="cluster-eyebrow">Rate by pump</span>
              </div>
              {summaryLoading && !summary ? (
                <TableSkeleton />
              ) : summaryGone ? (
                <div className="p-4">
                  <EmptyState
                    title="Pump rates unavailable"
                    hint="Per-pump rates come from the same uploaded bills. They appear here once the rollup loads."
                  />
                </div>
              ) : byLocation.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="No pump data in this window"
                    hint="Each bill carries the pump name or location. Once bills are uploaded, per-pump rates show up here so you can compare."
                  />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto p-4 pt-2">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr
                          className="text-left text-[11px] uppercase tracking-wider"
                          style={{
                            color: 'var(--cluster-text-dim)',
                            borderBottom: '1px solid var(--hairline)',
                          }}
                        >
                          <th className={HEAD_CELL}>Location</th>
                          <th className={HEAD_NUM}>Fill-ups</th>
                          <th className={HEAD_NUM}>Litres</th>
                          <th className={HEAD_NUM}>Avg ₹/L</th>
                          <th className={HEAD_NUM}>Min</th>
                          <th className={HEAD_NUM}>Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byLocation.map((loc, i) => {
                          const spread = (loc.maxRateInrPerL ?? 0) - (loc.minRateInrPerL ?? 0);
                          const swings =
                            loc.maxRateInrPerL != null &&
                            loc.minRateInrPerL != null &&
                            spread > PRICE_SWING_THRESHOLD;
                          return (
                            <tr
                              key={loc.location || i}
                              style={{ borderBottom: '1px solid var(--hairline)' }}
                            >
                              <td className="px-4 py-3">
                                <span>{loc.location || '—'}</span>
                                {swings ? (
                                  <span className="lamp lamp--caution ml-2">price swings</span>
                                ) : null}
                              </td>
                              <td className="num px-4 py-3 text-right">
                                {formatNum(loc.logCount)}
                              </td>
                              <td className="num px-4 py-3 text-right">
                                {formatNum(loc.litres, { decimals: 1 })}
                              </td>
                              <td className="num px-4 py-3 text-right font-semibold">
                                {rateOf(loc.avgRateInrPerL)}
                              </td>
                              <td className="num px-4 py-3 text-right">
                                {rateOf(loc.minRateInrPerL)}
                              </td>
                              <td className="num px-4 py-3 text-right">
                                {rateOf(loc.maxRateInrPerL)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-dim px-4 pb-4 text-[11px]">
                    Same diesel, different price — the spread column shows where you overpay.
                  </p>
                </>
              )}
            </div>

            <div className="cluster-panel overflow-hidden lg:col-span-2">
              <div className="px-4 pt-4">
                <span className="cluster-eyebrow">By vehicle</span>
              </div>
              {summaryLoading && !summary ? (
                <TableSkeleton rows={4} />
              ) : summaryGone ? (
                <div className="p-4">
                  <EmptyState
                    title="Vehicle split unavailable"
                    hint="Per-vehicle fuel spend appears here once the rollup loads."
                  />
                </div>
              ) : byVehicle.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="No vehicle fuel data in this window"
                    hint="Bills uploaded against a vehicle registration are counted here, vehicle by vehicle."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto p-4 pt-2">
                  <table className="w-full min-w-[320px] text-sm">
                    <thead>
                      <tr
                        className="text-left text-[11px] uppercase tracking-wider"
                        style={{
                          color: 'var(--cluster-text-dim)',
                          borderBottom: '1px solid var(--hairline)',
                        }}
                      >
                        <th className={HEAD_CELL}>Vehicle</th>
                        <th className={HEAD_NUM}>Litres</th>
                        <th className={HEAD_NUM}>Spend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byVehicle.map((v) => (
                        <tr
                          key={v.vehicleId || v.registrationNumber}
                          style={{ borderBottom: '1px solid var(--hairline)' }}
                        >
                          <td className="px-4 py-3">
                            <span className="reg-plate">{v.registrationNumber}</span>
                          </td>
                          <td className="num px-4 py-3 text-right">
                            {formatNum(v.litres, { decimals: 1 })}
                          </td>
                          <td className="num px-4 py-3 text-right font-semibold">
                            {formatINR(v.amountInr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="cluster-panel mt-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
              <span className="cluster-eyebrow">Receipts</span>
              <span className="text-dim text-[11px]">Every uploaded bill, one row each.</span>
            </div>
            {recordsLoading && !recordsData ? (
              <TableSkeleton rows={6} />
            ) : recordsGone ? (
              <div className="p-4">
                <EmptyState
                  title="Receipts unavailable"
                  hint="The receipts list could not be loaded just now — please try again in a moment."
                />
              </div>
            ) : records.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No receipts in this window"
                  hint="Fuel bills uploaded from the driver app or bulk upload land here as receipts. Widen the window above if you expected older ones."
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto p-4 pt-2">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr
                        className="text-left text-[11px] uppercase tracking-wider"
                        style={{
                          color: 'var(--cluster-text-dim)',
                          borderBottom: '1px solid var(--hairline)',
                        }}
                      >
                        <th className={HEAD_CELL}>When</th>
                        <th className={HEAD_CELL}>Vehicle</th>
                        <th className={HEAD_CELL}>Fuel</th>
                        <th className={HEAD_CELL}>Fill</th>
                        <th className={HEAD_NUM}>Litres</th>
                        <th className={HEAD_NUM}>Rate</th>
                        <th className={HEAD_NUM}>Amount</th>
                        <th className={HEAD_CELL}>Location</th>
                        <th className={HEAD_NUM}>km/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                          <td className="num px-4 py-3 whitespace-nowrap">
                            {formatDateTimeIST(r.refuelTime)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="reg-plate">{r.registrationNumber}</span>
                          </td>
                          <td className="px-4 py-3">{r.fuelType || '—'}</td>
                          <td className="px-4 py-3">{r.fillingType || '—'}</td>
                          <td className="num px-4 py-3 text-right">
                            {formatNum(r.litres, { decimals: 1 })}
                          </td>
                          <td className="num px-4 py-3 text-right">{rateOf(r.rate)}</td>
                          <td className="num px-4 py-3 text-right font-semibold">
                            {formatINR(r.totalAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="block max-w-[260px] truncate" title={r.location || ''}>
                              {r.location || '—'}
                            </span>
                          </td>
                          <td className="num px-4 py-3 text-right">
                            {r.mileageKmPerL != null
                              ? formatNum(r.mileageKmPerL, { decimals: 1 })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  style={{ borderTop: '1px solid var(--hairline)' }}
                >
                  <span className="num text-dim text-xs">
                    Page {formatNum(page)} of {formatNum(totalPages)} ·{' '}
                    {formatNum(recordsData?.total)} receipts
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
                      style={{ color: 'var(--cluster-text-dim)' }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
                      style={{ color: 'var(--cluster-text-dim)' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </PanelErrorBoundary>
      </PageShell>
    </div>
  );
}
