import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Award,
  AlertCircle,
  HelpCircle,
  Activity,
  Sparkles,
} from 'lucide-react';
import KaaranService from '../../../services/KaaranService';
import { toast } from 'react-toastify';

const CONSISTENCY_MAP = {
  CONSISTENT: {
    label: 'Consistent',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300',
  },
  MODERATE: {
    label: 'Moderate',
    bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300',
  },
  VOLATILE: {
    label: 'Volatile',
    bg: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300',
  },
};

export default function DriverTrendDrawer({ isOpen, onClose }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, CONSISTENT, VOLATILE, IMPROVING

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const data = await KaaranService.getDriverTrends();
      setTrends(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load driver trends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrends();
    }
  }, [isOpen]);

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const res = await KaaranService.recomputeDriverTrends();
      toast.success(res.message || 'Driver consistency trends recomputed');
      await fetchTrends();
    } catch (err) {
      toast.error(err.message || 'Recomputation failed');
    } finally {
      setRecomputing(false);
    }
  };

  if (!isOpen) return null;

  // Filtered rows
  const filteredRows = trends.filter((row) => {
    if (filter === 'CONSISTENT') return row.consistencyClass === 'CONSISTENT';
    if (filter === 'VOLATILE') return row.consistencyClass === 'VOLATILE';
    if (filter === 'IMPROVING') return (row.trendSlope || 0) > 0.05;
    return true;
  });

  // KPI aggregates
  const consistentCount = trends.filter((t) => t.consistencyClass === 'CONSISTENT').length;
  const volatileCount = trends.filter((t) => t.consistencyClass === 'VOLATILE').length;
  const avgConsistency = trends.length
    ? Math.round(trends.reduce((s, t) => s + (t.consistencyIndex || 0), 0) / trends.length)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Driver Improvement & Consistency Tracking
              </h2>
              <p className="text-xs text-slate-500">
                Longitudinal CV variance, OLS regression trend slope & coaching attribution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecompute}
              disabled={recomputing}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1 text-slate-700 dark:text-slate-200"
            >
              <RefreshCw size={13} className={recomputing ? 'animate-spin' : ''} />
              {recomputing ? 'Computing...' : 'Recompute Trends'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 font-medium">Fleet Avg Consistency</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {avgConsistency} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 font-medium">Consistent Drivers</div>
            <div className="text-xl font-bold text-emerald-600">{consistentCount}</div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 font-medium">Volatile (High CV)</div>
            <div className="text-xl font-bold text-red-600">{volatileCount}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium mr-2">Filter:</span>
          {['ALL', 'CONSISTENT', 'VOLATILE', 'IMPROVING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filter === f
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading trend records...</div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No longitudinal trend entries accumulated yet. Recompute to generate from accumulated
              trip and fuel intervals.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-2">Driver</th>
                    <th className="pb-2 text-right">Score</th>
                    <th className="pb-2 text-right">CV %</th>
                    <th className="pb-2">Consistency</th>
                    <th className="pb-2 text-right">Trend Slope (β)</th>
                    <th className="pb-2">Coaching ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRows.map((row) => {
                    const cfg = CONSISTENCY_MAP[row.consistencyClass] || CONSISTENCY_MAP.MODERATE;
                    const slope = Number(row.trendSlope ?? 0);
                    const isPositive = slope > 0.05;
                    const isNegative = slope < -0.05;
                    return (
                      <tr key={row.driverId || row._id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {row.driverName || row.driverId}
                        </td>
                        <td className="py-3 text-right font-mono font-medium">
                          {row.consistencyIndex ?? 0}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-500">
                          {row.coefficientOfVariation
                            ? `${row.coefficientOfVariation.toFixed(1)}%`
                            : '—'}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded border text-[11px] font-semibold ${cfg.bg}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono">
                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              isPositive
                                ? 'text-emerald-600 font-bold'
                                : isNegative
                                  ? 'text-red-600 font-bold'
                                  : 'text-slate-500'
                            }`}
                          >
                            {isPositive && <TrendingUp size={13} />}
                            {isNegative && <TrendingDown size={13} />}
                            {!isPositive && !isNegative && <Minus size={13} />}
                            {slope >= 0 ? `+${slope.toFixed(2)}` : slope.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 text-[11px]">
                          {row.coachingAttribution?.coached ? (
                            <span className="text-emerald-600 font-medium">
                              +{row.coachingAttribution.improvementScore ?? 0}% post-coaching
                            </span>
                          ) : (
                            <span className="text-slate-400">Not coached</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
