import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Droplets,
  ReceiptText,
  Fuel,
  Activity,
  Columns,
  Table as TableIcon,
} from 'lucide-react';
import { formatINR, formatLitres } from '../../utils/formatters';
import { StatusPill } from '../../components/overview.primitives.jsx';
import TablePager from './TablePager.jsx';
import { RISK_TONE } from './fiData.js';

const PAGE_SIZE = 12;

export default function VehicleRiskPanel({ isLoading, riskVehicles = [], onDrill }) {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  useEffect(() => setPage(1), [riskVehicles]);

  const totalPages = Math.max(1, Math.ceil(riskVehicles.length / PAGE_SIZE));
  const pageVehicles = riskVehicles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Rollup summary metrics for the fleet
  const summary = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let healthy = 0;
    riskVehicles.forEach((v) => {
      if (v.risk === 'Critical') critical++;
      else if (v.risk === 'High') high++;
      else if (v.risk === 'Medium') medium++;
      else healthy++;
    });
    return { critical, high, medium, healthy, total: riskVehicles.length };
  }, [riskVehicles]);

  if (isLoading) {
    return <div className="ov-inset h-48 animate-pulse rounded-xl" />;
  }

  if (riskVehicles.length === 0) {
    return (
      <div className="text-dim py-12 text-center text-sm">
        No vehicle risk telemetry available for this time window.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Fleet Risk Triage Strip */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Risk Posture:
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Total {summary.total}
          </span>
          {summary.critical > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              <ShieldAlert size={12} /> {summary.critical} Critical
            </span>
          )}
          {summary.high > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <AlertTriangle size={12} /> {summary.high} High
            </span>
          )}
          {summary.medium > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300">
              {summary.medium} Medium
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck size={12} /> {summary.healthy} Clean
          </span>
        </div>

        <div className="fi-view-toggle">
          <button
            type="button"
            className={`fi-view-toggle-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Threat Cards"
          >
            <Columns size={12} />
            <span>Cards</span>
          </button>
          <button
            type="button"
            className={`fi-view-toggle-btn ${viewMode === 'table' ? 'is-active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Dense Table"
          >
            <TableIcon size={12} />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* ── CARD GRID VIEW ─────────────────────────────────────────────────── */}
      {viewMode === 'grid' ? (
        <div className="fi-risk-grid">
          {pageVehicles.map((v) => {
            const hasLoss = (v.siphonSuspectedLossL || 0) > 0;
            const tone = RISK_TONE[v.risk] || 'ok';

            return (
              <div
                key={v.registrationNumber}
                className="fi-risk-card"
                onClick={() => onDrill(v.registrationNumber)}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="hsrp-plate">
                    <span className="hsrp-ind">
                      <span className="hsrp-chakra" />
                      IND
                    </span>
                    <span className="hsrp-num">{v.registrationNumber}</span>
                  </div>
                  <StatusPill tone={tone}>{v.risk}</StatusPill>
                </div>

                {/* Fuel & Siphon Meter */}
                <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Audited Fuel Dispensed</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatLitres(v.fillsLitres || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-slate-500 font-medium">Unaccounted Siphon Loss</span>
                    <span
                      className={`font-bold font-mono ${
                        hasLoss
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {hasLoss
                        ? `−${formatLitres(v.siphonSuspectedLossL)} (${formatINR(v.siphonSuspectedLossInr)})`
                        : '0.0 L (Intact)'}
                    </span>
                  </div>
                </div>

                {/* Flags Row & Action */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center gap-1"
                      title={`${v.defFlagCount || 0} DEF ratio flags`}
                    >
                      <Droplets
                        size={13}
                        className={v.defFlagCount > 0 ? 'text-amber-500' : 'text-slate-400'}
                      />
                      <span className="text-slate-600 dark:text-slate-400 font-mono font-medium">
                        {v.defFlagCount || 0}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      title={`${v.billFlagCount || 0} Bill mismatches`}
                    >
                      <ReceiptText
                        size={13}
                        className={v.billFlagCount > 0 ? 'text-amber-500' : 'text-slate-400'}
                      />
                      <span className="text-slate-600 dark:text-slate-400 font-mono font-medium">
                        {v.billFlagCount || 0}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Telemetry Drilldown <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ──────────────────────────────────────────────────────── */
        <div className="fi-table-scroll">
          <table className="ov-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th className="text-right">Dispensed Fuel</th>
                <th className="text-right">Unaccounted Loss</th>
                <th className="text-right">Est. Rupee Loss</th>
                <th className="text-right">DEF Flags</th>
                <th className="text-right">Bill Flags</th>
                <th>Threat Status</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {pageVehicles.map((v) => (
                <tr
                  key={v.registrationNumber}
                  className="fi-row-click"
                  onClick={() => onDrill(v.registrationNumber)}
                >
                  <td>
                    <div className="hsrp-plate">
                      <span className="hsrp-ind">
                        <span className="hsrp-chakra" />
                        IND
                      </span>
                      <span className="hsrp-num">{v.registrationNumber}</span>
                    </div>
                  </td>
                  <td className="num text-right font-medium">{formatLitres(v.fillsLitres)}</td>
                  <td
                    className="num text-right font-bold"
                    style={{
                      color:
                        v.siphonSuspectedLossL > 0
                          ? 'var(--critical, #dc2626)'
                          : 'var(--cluster-text-dim)',
                    }}
                  >
                    {formatLitres(v.siphonSuspectedLossL)}
                  </td>
                  <td
                    className="num text-right font-medium"
                    style={{
                      color:
                        v.siphonSuspectedLossInr > 0
                          ? 'var(--critical, #dc2626)'
                          : 'var(--cluster-text-dim)',
                    }}
                  >
                    {formatINR(v.siphonSuspectedLossInr)}
                  </td>
                  <td className="text-right">
                    {v.defFlagCount > 0 ? (
                      <span className="ov-pill ov-pill--caution">{v.defFlagCount}</span>
                    ) : (
                      <span className="num text-dim">0</span>
                    )}
                  </td>
                  <td className="text-right">
                    {v.billFlagCount > 0 ? (
                      <span className="ov-pill ov-pill--caution">{v.billFlagCount}</span>
                    ) : (
                      <span className="num text-dim">0</span>
                    )}
                  </td>
                  <td>
                    <StatusPill tone={RISK_TONE[v.risk]}>{v.risk}</StatusPill>
                  </td>
                  <td className="text-right">
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600">
                      Drill down <ChevronRight size={13} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pt-2">
          <TablePager page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
