import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import apiClient from '../../../utils/axiosConfig';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatLitres } from '../../../utils/formatters';
import { RECONCILIATION_META, drawerFromReconciliationRow } from '../mileageRows';

const STATUS_TABS = [
  { key: 'all', label: 'All Audits' },
  { key: 'flagged', label: 'Flagged Overbilling' },
  { key: 'review', label: 'Needs Review' },
  { key: 'clean', label: 'Verified Clean' },
];

export default function ReconciliationTab({ searchQuery = '', onOpenDrawer }) {
  const [activeStatus, setActiveStatus] = useState('all');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchedFor, setSearchedFor] = useState(searchQuery);
  if (searchedFor !== searchQuery) {
    setSearchedFor(searchQuery);
    setPage(1);
  }

  useEffect(() => {
    let isMounted = true;
    const fetchComparisonData = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await apiClient.get('/api/fuel-comparison/records', {
          params: {
            page,
            limit: pageSize,
            search: searchQuery || undefined,
            status: activeStatus !== 'all' ? activeStatus : undefined,
          },
        });

        if (isMounted && res.data?.status === 'success') {
          const raw = res.data.data?.records || res.data.data || [];
          setRecords(raw);
          setTotalCount(res.data.meta?.total || raw.length);
          setTotalPages(Math.ceil((res.data.meta?.total || raw.length) / pageSize) || 1);
        }
      } catch {
        if (isMounted) {
          setRecords([]);
          setTotalCount(0);
          setTotalPages(1);
          setLoadError(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchComparisonData();
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, searchQuery, activeStatus, reloadKey]);

  return (
    <div className="flex flex-col gap-3">
      {/* Status Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveStatus(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeStatus === tab.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          Each diesel bill against the tank-level rise it was matched to · last 30 days · search
          matches the plate
        </span>
      </div>

      {/* Comparison Table */}
      <div className="mileage-panel overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4">Vehicle No</th>
              <th className="py-3 px-4">Bill Date & Time</th>
              <th className="py-3 px-4">Fuel Station Name</th>
              <th className="py-3 px-4 text-right">Billed Litres</th>
              <th className="py-3 px-4 text-right">Telemetry Rise</th>
              <th className="py-3 px-4 text-right">Variance (Litres / %)</th>
              <th className="py-3 px-4 text-center">Audit Status</th>
              <th className="py-3 px-4 text-center">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                  Loading reconciliation audit data...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <span>Couldn&apos;t load reconciliation records.</span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="ml-2 inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No records matching the selected filter.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const status = RECONCILIATION_META[r.status];
                const hasVariance = r.varianceL != null;
                return (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="mileage-plate">{r.vehicleNumber || '—'}</span>
                        <span className="text-[11px] text-slate-400">{r.model || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {r.billDate ? formatDateTimeIST(r.billDate) : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {r.fuelPumpName || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatLitres(r.billLitres)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatLitres(r.telemetryLitres)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      {hasVariance ? (
                        <span
                          className={
                            r.status === 'FLAGGED'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {r.varianceL > 0 ? `+${r.varianceL.toFixed(1)}` : r.varianceL.toFixed(1)}{' '}
                          L{r.variancePct != null && ` (${r.variancePct.toFixed(1)}%)`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {status ? (
                        <span
                          className={`mileage-badge mileage-badge-${status.tone}`}
                          title={status.hint}
                        >
                          {status.label}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenDrawer?.(drawerFromReconciliationRow(r))}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        Side-by-Side
                      </button>
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
