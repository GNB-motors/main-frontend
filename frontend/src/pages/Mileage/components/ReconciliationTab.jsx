import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import apiClient from '../../../utils/axiosConfig';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatLitres } from '../../../utils/formatters';
import { comparisonParams, toReconciliationRow, varianceText } from './reconciliationModel';

// Only filters the comparisons API can apply server-side, so counts and pages stay true.
const STATUS_TABS = [
  { key: 'all', label: 'All Audits' },
  { key: 'flagged', label: 'Flagged Overbilling' },
];

const litres = (v) => (v == null ? '—' : formatLitres(v));

export default function ReconciliationTab({ searchQuery = '', onOpenDrawer }) {
  const [activeStatus, setActiveStatus] = useState('all');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchComparisonData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await apiClient.get('/api/extension/comparisons', {
          params: comparisonParams({
            page,
            limit: pageSize,
            search: searchQuery,
            status: activeStatus,
          }),
        });
        if (!isMounted) return;
        const data = res.data?.data || {};
        const rows = (data.records || []).map(toReconciliationRow);
        const total = data.total ?? rows.length;
        setRecords(rows);
        setTotalCount(total);
        setTotalPages(data.totalPages || Math.ceil(total / pageSize) || 1);
      } catch (err) {
        if (!isMounted) return;
        setRecords([]);
        setTotalCount(0);
        setTotalPages(1);
        setLoadError(
          err?.response?.data?.message || err?.message || 'Could not load fuel comparisons.',
        );
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

        <span className="text-xs text-slate-500 font-mono">
          Litres billed vs FleetEdge-measured fuel, per refuel cycle
        </span>
      </div>

      {/* Comparison Table */}
      <div className="mileage-panel overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4">Vehicle No</th>
              <th className="py-3 px-4">Cycle Start</th>
              <th className="py-3 px-4">Closing Bill</th>
              <th className="py-3 px-4 text-right">Billed Litres</th>
              <th className="py-3 px-4 text-right">Telematics Used</th>
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
                  Could not load fuel comparisons: {loadError}{' '}
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="ml-2 px-3 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Try again
                  </button>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No fuel comparisons matching the selected filter.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr
                  key={r._id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="mileage-plate">{r.vehicleNumber || '—'}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {r.fromDate ? formatDateTimeIST(r.fromDate) : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {r.billDate ? formatDateTimeIST(r.billDate) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {litres(r.billLitres)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                    {litres(r.telemetryLitres)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    <span
                      className={
                        r.status === 'FLAGGED'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }
                      title={r.flagReason || undefined}
                    >
                      {varianceText(r)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.status === 'CLEAN' && (
                      <span className="mileage-badge mileage-badge-genuine">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Within Tolerance</span>
                      </span>
                    )}
                    {r.status === 'FLAGGED' && (
                      <span className="mileage-badge mileage-badge-variance">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Flagged Overbilling</span>
                      </span>
                    )}
                    {r.status === 'REVIEW' && (
                      <span className="mileage-badge mileage-badge-pending">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>Needs Review</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      aria-label="Side-by-Side Audit"
                      onClick={() => onOpenDrawer?.(r.task)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      Side-by-Side Audit
                    </button>
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
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
