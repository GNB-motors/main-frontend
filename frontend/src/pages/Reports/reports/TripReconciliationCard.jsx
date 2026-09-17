import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Smartphone,
  Navigation,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';

/**
 * TripReconciliationCard (Feature #20)
 *
 * Compares vehicle telematics with DriverApp mobile GPS to verify that the
 * assigned driver physically accompanied the truck during the trip.
 */
const TripReconciliationCard = ({ tripId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReconciliation = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/trip-reconciliation/${tripId}`);
      setData(res.data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.detail || 'Reconciliation data not available');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const handleRecompute = async () => {
    if (!tripId || loading) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`/api/trip-reconciliation/${tripId}/recompute`);
      setData(res.data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not recompute verification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  if (!tripId) return null;

  const verdict = data?.verdict || 'INSUFFICIENT_DATA';
  const isMatch = verdict === 'VERIFIED_MATCH' || verdict === 'MATCHED';
  const isDivergent = verdict === 'DIVERGENT';

  return (
    <div className="trip-overview-card bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isMatch
                ? 'bg-emerald-50 text-emerald-600'
                : isDivergent
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-50 text-slate-500'
            }`}
          >
            {isMatch ? (
              <ShieldCheck size={18} />
            ) : isDivergent ? (
              <AlertTriangle size={18} />
            ) : (
              <Smartphone size={18} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Driver GPS Verification</h3>
            <p className="text-[11px] text-slate-400">Phone GPS vs. Vehicle Telematics</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRecompute}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 p-1 rounded hover:bg-slate-50 disabled:opacity-50"
          title="Recompute track reconciliation"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !data ? (
        <div className="text-xs text-slate-400 py-3 text-center">
          Checking driver location track…
        </div>
      ) : error ? (
        <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          {error}
        </div>
      ) : (
        <div className="space-y-2.5 text-xs">
          {/* Verdict Badge */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Trip Confirmation:</span>
            <span
              className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                isMatch
                  ? 'bg-emerald-100 text-emerald-800'
                  : isDivergent
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isMatch
                ? '✓ Co-located'
                : isDivergent
                  ? '⚠ Track Divergence'
                  : 'Insufficient Driver Fixes'}
            </span>
          </div>

          {/* Metrics */}
          {data && (
            <>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Overlap Match</span>
                  <strong className="text-slate-700 text-xs">{data.overlapPercent ?? 0}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Median Separation</span>
                  <strong className="text-slate-700 text-xs">
                    {data.medianSeparationMeters != null ? `${data.medianSeparationMeters} m` : '—'}
                  </strong>
                </div>
              </div>

              {data.notes?.length > 0 && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                  {data.notes.map((n, i) => (
                    <div key={i}>• {n}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TripReconciliationCard;
