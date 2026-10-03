import React, { useEffect, useState, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Fuel,
  MapPin,
  Search,
  Building2,
  TrendingDown,
} from 'lucide-react';
import { formatINR, formatLitres } from '../../utils/formatters';
import { StatusPill } from '../../components/overview.primitives.jsx';
import TablePager from './TablePager.jsx';
import { FuelIntegrityService } from './FuelIntegrityService.jsx';
import { cleanStationName } from './fiData.js';

const PAGE_SIZE = 10;

const STATUS_MAP = {
  HONEST: { tone: 'ok', label: 'Honest Delivery' },
  RELIABLE: { tone: 'ok', label: 'Reliable Delivery' },
  SUSPICIOUS: { tone: 'caution', label: 'Suspicious Shortage' },
  UNRELIABLE: { tone: 'caution', label: 'Unreliable' },
  CHRONIC_SHORTAGE: { tone: 'critical', label: 'Chronic Shortage' },
  CHRONIC_DEFICIT: { tone: 'critical', label: 'Chronic Deficit' },
  INSUFFICIENT_DATA: { tone: 'inert', label: 'Needs More Fills' },
};

/** Derive a honesty status from shortfall percentage and fill count. */
function derivePumpStatus(shortfallPct, fills) {
  if (fills < 3) return 'INSUFFICIENT_DATA';
  if (shortfallPct <= 1) return 'HONEST';
  if (shortfallPct <= 3) return 'RELIABLE';
  if (shortfallPct <= 6) return 'SUSPICIOUS';
  if (shortfallPct <= 10) return 'UNRELIABLE';
  return 'CHRONIC_SHORTAGE';
}

export default function PumpHonestyPanel() {
  const [summary, setSummary] = useState(null);
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const ledger = await FuelIntegrityService.getPumpLedger();
        if (!active) return;
        const pumpList = (ledger.pumps || []).map((p) => ({
          pumpName: p.pump,
          fillCount: p.fills,
          totalBilledLitres: p.claimedLitres,
          totalShortageLitres: p.shortfallLitres,
          totalRupeeLoss: p.estimatedLossInr,
          shortfallPct: p.shortfallPct,
          status: derivePumpStatus(p.shortfallPct, p.fills),
          lat: p.lat,
          lng: p.lng,
          lastFillAt: p.lastFillAt,
          _id: p.pump,
        }));
        const totalShort = pumpList.reduce((s, p) => s + (p.totalShortageLitres || 0), 0);
        const totalLoss = pumpList.reduce((s, p) => s + (p.totalRupeeLoss || 0), 0);
        const totalFills = pumpList.reduce((s, p) => s + (p.fillCount || 0), 0);
        const chronicCount = pumpList.filter(
          (p) => p.status === 'CHRONIC_SHORTAGE' || p.status === 'CHRONIC_DEFICIT',
        ).length;
        setSummary({
          totalAuditedFills: totalFills,
          totalShortLitres: totalShort,
          totalRupeeLoss: totalLoss,
          chronicPumpsCount: chronicCount,
        });
        setPumps(pumpList);
      } catch (err) {
        if (active) setError(err.message || err.detail || 'Failed to load pump ledger');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredPumps = useMemo(() => {
    if (!searchQuery.trim()) return pumps;
    const q = searchQuery.toLowerCase();
    return pumps.filter((p) => {
      const name = (p.pumpName || '').toLowerCase();
      const loc = (p.location || '').toLowerCase();
      return name.includes(q) || loc.includes(q);
    });
  }, [pumps, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPumps.length / PAGE_SIZE));
  const pagePumps = filteredPumps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return <div className="ov-inset h-48 animate-pulse rounded-xl" />;
  }

  if (error) {
    return <div className="text-dim py-8 text-center text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="pump-honesty-container flex flex-col gap-4">
      {/* Top Rollup Metrics */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Audited Refuels
            </div>
            <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.totalAuditedFills || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cross-checked bills</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Dispensing Shortfall
            </div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {formatLitres(summary.totalShortLitres || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Billed vs sensor rise</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Estimated Rupee Loss
            </div>
            <div className="text-xl font-bold font-mono text-red-600 dark:text-red-400 mt-0.5">
              {formatINR(summary.totalRupeeLoss || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Financial leakage</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Chronic Shortage Pumps
            </div>
            <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
              <span>{summary.chronicPumpsCount || 0}</span>
              {summary.chronicPumpsCount > 0 && <ShieldAlert size={18} className="text-red-500" />}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Flagged for blacklist</div>
          </div>
        </div>
      )}

      {/* Filter / Search Strip */}
      <div className="flex items-center justify-between gap-3">
        <div className="fi-search-wrap max-w-sm flex-1">
          <Search size={14} className="fi-search-icon" />
          <input
            type="text"
            className="fi-search-input"
            placeholder="Search petrol bunk or highway…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing {pagePumps.length} of {filteredPumps.length} stations
        </div>
      </div>

      {filteredPumps.length === 0 ? (
        <div className="text-dim py-12 text-center text-sm">
          No pump fill transactions recorded yet. Once fuel bills and sensor fill events are
          captured, pump honesty analytics will appear here.
        </div>
      ) : (
        <>
          <div className="fi-bunk-grid">
            {pagePumps.map((p) => {
              const cleaned = cleanStationName(p.pumpName);
              const status = STATUS_MAP[p.status] || STATUS_MAP.INSUFFICIENT_DATA;
              const isShort = (p.totalShortageLitres || 0) > 0;
              const billedL = p.totalBilledLitres || 0;
              const shortL = p.totalShortageLitres || 0;
              const shortPct = billedL > 0 ? (shortL / billedL) * 100 : 0;

              return (
                <div key={p.pumpId || p._id || p.pumpName} className="fi-bunk-card">
                  {/* Left: Station Brand & Name */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Fuel size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {cleaned.displayName}
                        </span>
                        {cleaned.brand && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {cleaned.brand}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        {cleaned.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={11} className="text-slate-400" />
                            {cleaned.location}
                          </span>
                        )}
                        <span>·</span>
                        <span className="font-mono">{p.fillCount || 0} refuels audited</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Shortfall Progress Meter */}
                  <div className="hidden md:flex flex-col gap-1 w-44">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Shortage</span>
                      <span
                        className={`font-mono font-bold ${
                          isShort
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {shortPct.toFixed(1)}% ({formatLitres(shortL)})
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isShort ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(4, shortPct * 5))}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Est Loss & Honesty Pill */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                      {(p.totalRupeeLoss || 0) > 0 ? (
                        <span className="text-red-600 dark:text-red-400">
                          {formatINR(p.totalRupeeLoss)} lost
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">₹0 Shortfall</span>
                      )}
                    </div>

                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pt-2">
              <TablePager page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
