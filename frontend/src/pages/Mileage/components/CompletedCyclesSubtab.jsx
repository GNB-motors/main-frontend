import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import apiClient from '../../../utils/axiosConfig';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatINR, formatKm, formatLitres } from '../../../utils/formatters';
import { mapIntervalRow } from '../mileageRows';
import FuelCyclesList from './FuelCyclesList';

const mileageTone = (kmPerL) => {
  if (kmPerL == null) return 'text-slate-500';
  if (kmPerL >= 4.0)
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
  if (kmPerL >= 3.5)
    return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300';
  return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300';
};

function IntervalCycles({ searchQuery = '' }) {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchedFor, setSearchedFor] = useState(searchQuery);
  if (searchedFor !== searchQuery) {
    setSearchedFor(searchQuery);
    setPage(1);
  }

  useEffect(() => {
    let isMounted = true;
    const fetchCompletedCycles = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await apiClient.get('/api/mileage/intervals', {
          params: {
            page,
            limit: pageSize,
            status: 'COMPLETED',
            search: searchQuery || undefined,
          },
        });
        if (!isMounted) return;
        const rows = (res.data?.data || []).map(mapIntervalRow);
        setCycles(rows);
        setTotalCount(res.data?.meta?.total ?? rows.length);
        setTotalPages(res.data?.meta?.totalPages || 1);
      } catch {
        if (!isMounted) return;
        setCycles([]);
        setTotalCount(0);
        setTotalPages(1);
        setLoadError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchCompletedCycles();
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, searchQuery, reloadKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="px-1 py-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Completed Refuel Cycles
        </h3>
        <p className="text-xs text-slate-500">
          Full-tank to full-tank cycles, newest first. Open a cycle to see its bills and the
          FleetEdge comparison.
        </p>
      </div>

      <div className="mileage-panel overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4">Vehicle No</th>
              <th className="py-3 px-4">Cycle Date Range</th>
              <th className="py-3 px-4 text-right">Odometer</th>
              <th className="py-3 px-4 text-right">Distance</th>
              <th className="py-3 px-4 text-right">Fuel Consumed</th>
              <th className="py-3 px-4 text-center">Cycle Mileage</th>
              <th className="py-3 px-4 text-right">Fuel Cost</th>
              <th className="py-3 px-4 text-center">Telematics Check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                  Loading completed refuel cycles...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <span>Couldn&apos;t load refuel cycles.</span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="ml-2 inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </td>
              </tr>
            ) : cycles.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No completed cycles found.
                </td>
              </tr>
            ) : (
              cycles.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/mileage-tracking/${row.id}`)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="mileage-plate">{row.vehicleNo || '—'}</span>
                      <span className="text-[11px] text-slate-400">{row.model || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                    <div>{row.startDate ? formatDateTimeIST(row.startDate) : '—'}</div>
                    <div className="text-[11px] text-slate-400">
                      to {row.endDate ? formatDateTimeIST(row.endDate) : '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                    <div>{formatKm(row.startOdo)}</div>
                    <div className="text-[11px] text-slate-400">→ {formatKm(row.endOdo)}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {formatKm(row.distanceKm)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                    {formatLitres(row.fuelL)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.kmPerL != null ? (
                      <span
                        className={`inline-block px-2.5 py-1 rounded font-mono font-bold text-xs ${mileageTone(row.kmPerL)}`}
                      >
                        {row.kmPerL.toFixed(2)} km/L
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatINR(row.cost)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`mileage-badge mileage-badge-${row.audit.tone}`}
                      title={row.audit.hint}
                    >
                      {row.audit.label}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <EnterprisePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalCount}
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

/**
 * Slip-based intervals for orgs that log slips (GNB). An org whose bills come
 * in the OIL REPORT register has none, so it gets the fill-to-fill cycles from
 * /api/reports/fuel-cycles instead (autoTrips flag, OWNER/MANAGER).
 */
export default function CompletedCyclesSubtab({ searchQuery = '', fuelCyclesAllowed = false }) {
  const [source, setSource] = useState(fuelCyclesAllowed ? null : 'intervals');

  useEffect(() => {
    if (!fuelCyclesAllowed) return undefined;
    let isMounted = true;
    apiClient
      .get('/api/mileage/intervals', { params: { page: 1, limit: 1, status: 'COMPLETED' } })
      .then((res) => {
        if (isMounted) setSource(res.data?.meta?.total > 0 ? 'intervals' : 'fuelCycles');
      })
      .catch(() => {
        if (isMounted) setSource('fuelCycles');
      });
    return () => {
      isMounted = false;
    };
  }, [fuelCyclesAllowed]);

  if (!source) {
    return (
      <div className="mileage-panel py-12 text-center text-xs text-slate-400 font-mono">
        Loading completed refuel cycles...
      </div>
    );
  }
  return source === 'fuelCycles' ? (
    <FuelCyclesList searchQuery={searchQuery} />
  ) : (
    <IntervalCycles searchQuery={searchQuery} />
  );
}
