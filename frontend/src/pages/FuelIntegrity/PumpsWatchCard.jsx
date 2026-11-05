import React, { useMemo } from 'react';
import { Fuel } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { KaaranService } from '../../services/KaaranService';
import { formatINR, formatLitres, formatNum, formatPct } from '../../utils/formatters';
import { MAX_PUMP_ROWS, pumpRow, sortPumps } from './pumpHonestyModel.js';

const MAX_ROWS = MAX_PUMP_ROWS;
const STATUS_BADGE = {
  RELIABLE: 'fi-status-badge--confirmed',
  SUSPICIOUS: 'fi-status-badge--flagged',
  CHRONIC_SHORTAGE: 'fi-status-badge--critical',
};

/** The backend's codes, in words a person would use. */
const STATUS_LABEL = {
  RELIABLE: 'Reliable',
  SUSPICIOUS: 'Suspicious',
  CHRONIC_SHORTAGE: 'Chronic shortage',
};

/**
 * Kaaran pump honesty — the ledger the pump call returns: what the pump
 * billed against what the tank sensor measured, and the rupee gap.
 * The API allows managers, owners and super admins; anyone else gets a
 * one-line note instead of a broken card.
 */
export default function PumpsWatchCard() {
  const { data, loading, error } = useApi(
    () =>
      Promise.all([KaaranService.getPumpLedger(), KaaranService.getPumpSummary()]).then(
        ([pumps, stats]) => ({
          pumps: Array.isArray(pumps) ? pumps : [],
          stats: stats || {},
        }),
      ),
    [],
  );

  const rows = useMemo(
    () => sortPumps((data?.pumps || []).map(pumpRow)).slice(0, MAX_ROWS),
    [data],
  );
  const stats = data?.stats || {};
  // With no pump audited there is nothing to count: the zeros would read as
  // findings, so the numbers go away and the explanation line does the talking.
  const auditedPumps = Array.isArray(data?.pumps) ? data.pumps.length : 0;
  const showStats = auditedPumps > 0;
  const pumpCount = Math.max(Number(stats.totalPumpsEvaluated) || 0, auditedPumps);

  return (
    <section className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          <Fuel size={15} className="text-slate-400" />
          Pumps
          {showStats ? (
            <span className="text-[11px] font-normal text-slate-500">
              {formatNum(pumpCount)} pumps · {formatNum(stats.chronicPumpsCount)} chronic
            </span>
          ) : null}
        </div>
        {showStats ? (
          <span className="text-[11px] text-slate-500">
            {formatLitres(stats.totalShortfallL ?? stats.totalShortLitres)} short ·{' '}
            {formatINR(stats.totalRupeeLoss)} lost
          </span>
        ) : null}
      </header>

      {loading && !data ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
      ) : error ? (
        <p className="text-xs text-slate-500 m-0">
          The pump ledger is not available for this account — it is read by managers and owners.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500 m-0">
          No pump fills audited yet — the ledger needs a fuel bill and a tank reading for the same
          fill.
        </p>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {rows.map((p) => (
            <li
              key={p.name}
              className="border-t border-slate-200 dark:border-slate-800 pt-2 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {p.name}
                </span>
                <span
                  className={`fi-status-badge ${
                    STATUS_BADGE[p.status] || 'fi-status-badge--neutral'
                  }`}
                >
                  {STATUS_LABEL[p.status] || 'Unknown'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Fills</div>
                  <div className="fi-mono text-slate-800 dark:text-slate-200">
                    {formatNum(p.fills)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Billed</div>
                  <div className="fi-mono text-slate-800 dark:text-slate-200">
                    {formatLitres(p.billedL)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Measured</div>
                  <div className="fi-mono text-slate-800 dark:text-slate-200">
                    {formatLitres(p.measuredL)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Short</div>
                  <div className="fi-mono text-slate-800 dark:text-slate-200">
                    {formatLitres(p.shortfallL)}
                    {p.variancePct == null ? '' : ` (${formatPct(p.variancePct, { decimals: 1 })})`}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Estimated loss {formatINR(p.rupeeLoss)}
                {p.variancePct == null && ' — no variance recorded for this pump yet'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
