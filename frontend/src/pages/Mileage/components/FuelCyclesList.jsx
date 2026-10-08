import React, { useEffect, useMemo, useState } from 'react';
import { RotateCw } from 'lucide-react';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import apiClient from '../../../utils/axiosConfig';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatKm, formatLitres } from '../../../utils/formatters';
import {
  DATE_PRESETS,
  DEFAULT_PRESET,
  mapFuelCycleRow,
  presetRange,
  rangeToParams,
} from '../mileageRows';

const STATUS_META = {
  OPEN: { label: 'Open', tone: 'pending' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
  RECONCILED: { label: 'Reconciled', tone: 'genuine' },
  UNRECONCILED_NO_LEDGER: { label: 'No ledger', tone: 'variance' },
};

const pillClass = (active) =>
  `px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
    active
      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
  }`;

const compact = (s) =>
  String(s || '')
    .replace(/[\s\-_]/g, '')
    .toUpperCase();

const kmPerL = (v) => (v != null ? `${v.toFixed(2)} km/L` : '—');

const CoveragePill = ({ label, pct }) =>
  pct == null ? (
    <span className="text-slate-400">—</span>
  ) : (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
        pct >= 80
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : pct >= 40
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
      }`}
      title={`${label} measured by telemetry`}
    >
      {label} {Math.round(pct)}%
    </span>
  );

/**
 * GET /api/reports/fuel-cycles — fill-to-fill cycles built nightly from slips
 * and the OIL REPORT register, for orgs whose bills don't come as slips. The
 * endpoint returns every cycle in the range (newest first, capped at 5,000),
 * so search and paging happen here.
 */
export default function FuelCyclesList({ searchQuery = '' }) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [range, setRange] = useState(() => presetRange(DEFAULT_PRESET));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchedFor, setSearchedFor] = useState(searchQuery);
  if (searchedFor !== searchQuery) {
    setSearchedFor(searchQuery);
    setPage(1);
  }

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await apiClient.get('/api/reports/fuel-cycles', {
          params: rangeToParams(range),
        });
        if (!isMounted) return;
        setRows((res.data?.data?.rows || []).map(mapFuelCycleRow));
      } catch {
        if (!isMounted) return;
        setRows([]);
        setLoadError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [range, reloadKey]);

  const filtered = useMemo(() => {
    const needle = compact(searchQuery);
    return needle ? rows.filter((r) => compact(r.vehicleNo).includes(needle)) : rows;
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const choosePreset = (key) => {
    setPreset(key);
    setRange(presetRange(key));
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <p className="text-xs text-slate-500">
          Fill-to-fill cycles from bills and the OIL REPORT register, by the day each cycle opened.
        </p>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => choosePreset(p.key)}
              className={pillClass(preset === p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mileage-panel overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4">Vehicle No</th>
              <th className="py-3 px-4">Cycle (IST)</th>
              <th className="py-3 px-4 text-right">Odometer</th>
              <th className="py-3 px-4 text-right">Distance</th>
              <th className="py-3 px-4 text-right">Billed</th>
              <th className="py-3 px-4 text-right">Engine (ECU)</th>
              <th className="py-3 px-4 text-right">Mileage</th>
              <th className="py-3 px-4 text-center">Coverage</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-mono">
                  Loading fuel cycles...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <span>Couldn&apos;t load fuel cycles.</span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="ml-2 inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No fuel cycles in this range.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const status = STATUS_META[row.status];
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="mileage-plate">{row.vehicleNo || '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      <div>{row.openAt ? formatDateTimeIST(row.openAt) : '—'}</div>
                      <div className="text-[11px] text-slate-400">
                        to {row.closeAt ? formatDateTimeIST(row.closeAt) : 'open'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      <div>{formatKm(row.openOdo)}</div>
                      <div className="text-[11px] text-slate-400">→ {formatKm(row.closeOdo)}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatKm(row.km)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatLitres(row.fuelBills)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatLitres(row.fuelEcu)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div
                        className="font-semibold text-slate-800 dark:text-slate-200"
                        title="From bills, tank to tank"
                      >
                        {kmPerL(row.kmPerLTankToTank)}
                      </div>
                      <div className="text-[11px] text-slate-400" title="From the engine (ECU)">
                        ECU {kmPerL(row.kmPerLEcu)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <CoveragePill label="km" pct={row.kmCoveragePct} />
                        <CoveragePill label="fuel" pct={row.fuelCoveragePct} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {status ? (
                        <span
                          className={`mileage-badge mileage-badge-${status.tone}`}
                          title={row.flags.length ? row.flags.join(', ') : undefined}
                        >
                          {status.label}
                        </span>
                      ) : (
                        '—'
                      )}
                      {row.flags.length > 0 && (
                        <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                          {row.flags.length} flag{row.flags.length === 1 ? '' : 's'}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <EnterprisePagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
