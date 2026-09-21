import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import { formatINR, formatLitres } from '../../utils/formatters';
import { StatusPill } from '../../components/overview.primitives.jsx';
import TablePager from './TablePager.jsx';
import KaaranService from '../../services/KaaranService';

const PAGE_SIZE = 10;

const STATUS_MAP = {
  HONEST: { tone: 'positive', label: 'Honest' },
  RELIABLE: { tone: 'positive', label: 'Reliable' },
  SUSPICIOUS: { tone: 'caution', label: 'Suspicious' },
  UNRELIABLE: { tone: 'caution', label: 'Unreliable' },
  CHRONIC_SHORTAGE: { tone: 'critical', label: 'Chronic Shortage' },
  CHRONIC_DEFICIT: { tone: 'critical', label: 'Chronic Deficit' },
  INSUFFICIENT_DATA: { tone: 'neutral', label: 'Needs More Fills' },
};

export default function PumpHonestyPanel() {
  const [summary, setSummary] = useState(null);
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [sum, list] = await Promise.all([
          KaaranService.getPumpSummary().catch(() => ({})),
          KaaranService.getPumpLedger().catch(() => []),
        ]);
        if (active) {
          setSummary(sum);
          setPumps(list || []);
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load pump ledger');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(pumps.length / PAGE_SIZE));
  const pagePumps = pumps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return <div className="ov-inset h-40 animate-pulse" />;
  }

  if (error) {
    return <div className="text-dim py-8 text-center text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="pump-honesty-container flex flex-col gap-4">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 font-medium">Audited Refuels</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {summary.totalAuditedFills || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Shortfall</div>
            <div className="text-lg font-bold text-amber-600">
              {formatLitres(summary.totalShortLitres || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Estimated Rupee Loss</div>
            <div className="text-lg font-bold text-red-600">
              {formatINR(summary.totalRupeeLoss || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Chronic Shortage Pumps</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <span>{summary.chronicPumpsCount || 0}</span>
              {summary.chronicPumpsCount > 0 && <ShieldAlert size={16} className="text-red-500" />}
            </div>
          </div>
        </div>
      )}

      {pumps.length === 0 ? (
        <div className="text-dim py-10 text-center text-sm">
          No pump fill transactions recorded yet. Once fuel bills and sensor fill events are
          captured, pump honesty analytics will appear here.
        </div>
      ) : (
        <>
          <div className="fi-table-scroll">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Pump / Station</th>
                  <th>Location</th>
                  <th className="text-right">Fills</th>
                  <th className="text-right">Billed Fuel</th>
                  <th
                    className="text-right"
                    title="Volume rise measured by vehicle fuel tank sensor"
                  >
                    Actual Tank Rise
                  </th>
                  <th
                    className="text-right"
                    title="Difference between billed fuel and tank level rise"
                  >
                    Shortage
                  </th>
                  <th className="text-right">Est. Loss (₹)</th>
                  <th>Honesty Rating</th>
                </tr>
              </thead>
              <tbody>
                {pagePumps.map((p) => {
                  const status = STATUS_MAP[p.status] || STATUS_MAP.INSUFFICIENT_DATA;
                  const isShort = (p.totalShortageLitres || 0) > 0;
                  return (
                    <tr key={p.pumpId || p._id || p.pumpName}>
                      <td className="font-semibold text-slate-900 dark:text-slate-100">
                        {p.pumpName || 'Unknown Pump'}
                      </td>
                      <td className="text-xs text-slate-500">{p.location || '—'}</td>
                      <td className="num text-right">{p.fillCount || 0}</td>
                      <td className="num text-right">{formatLitres(p.totalBilledLitres || 0)}</td>
                      <td className="num text-right">{formatLitres(p.totalMeasuredLitres || 0)}</td>
                      <td
                        className="num text-right font-medium"
                        style={{ color: isShort ? 'var(--critical, #dc2626)' : 'inherit' }}
                      >
                        {formatLitres(p.totalShortageLitres || 0)}
                      </td>
                      <td
                        className="num text-right font-medium"
                        style={{
                          color:
                            (p.totalRupeeLoss || 0) > 0 ? 'var(--critical, #dc2626)' : 'inherit',
                        }}
                      >
                        {formatINR(p.totalRupeeLoss || 0)}
                      </td>
                      <td>
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <TablePager page={page} totalPages={totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
