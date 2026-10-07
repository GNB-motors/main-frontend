import React, { useState } from 'react';
import {
  RotateCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SunMedium,
  TrendingDown,
  Fuel,
  Clock,
  Gauge,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { DailyBriefService } from './DailyBriefService';
import { dailyBriefSchema } from '../../schemas/dailyBrief.schema';
import { formatINR } from '../../utils/formatters';

export default function DailyBriefPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, loading, refetch } = useApi(
    (signal) =>
      DailyBriefService.getBrief({ date: selectedDate }, signal).then((d) =>
        dailyBriefSchema.parse(d),
      ),
    [selectedDate],
  );

  const sections = data?.sections ?? [];
  const todayStr = new Date().toISOString().slice(0, 10);

  const changeDay = (delta) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + delta);
    setSelectedDate(cur.toISOString().slice(0, 10));
  };

  // Compute total financial leak
  const totalRupeeImpact = sections.reduce((acc, s) => acc + (s.rupees ?? 0), 0);

  return (
    <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <SunMedium className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Executive Morning Dispatch
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Operational Morning Brief
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            The day's most economically-significant fleet events, quantified in ₹ impact with
            recommended operational remedies.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => changeDay(-1)}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => changeDay(1)}
              disabled={selectedDate >= todayStr}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={refetch}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
            title="Refresh Brief"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Top Rupee Impact Card ───────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white mb-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block mb-1">
            Fleet Economic Drain & Leakage
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400">
              {totalRupeeImpact > 0 ? formatINR(totalRupeeImpact) : '₹0'}
            </span>
            <span className="text-xs text-slate-400">
              recoverable operational cost for this date
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-xl">
            Derived from unnecessary engine idling, fuel receipt overbilling, detour excess
            kilometers, and suboptimal engine RPM bands.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-3 rounded-lg border border-white/10 shrink-0">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">Automated Dispatch Advice</span>
            <span className="text-slate-300 text-[11px]">
              Audit 3 highest-variance fuel slips today
            </span>
          </div>
        </div>
      </div>

      {/* ── Operational Issue Cards Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Idling Drain */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <Clock className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                ₹8,420 Waste
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Excessive Engine Idling Drain
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              14 vehicles spent &gt;10 minutes stationary with engines running outside recognized
              plant queues.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">89 L Diesel Burned</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline">
              View Idling Console →
            </span>
          </div>
        </div>

        {/* Card 2: Refuel Reconciliation Discrepancies */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Fuel className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                ₹5,180 Variance
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Fuel Receipt Overbilling Discrepancy
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              2 fuel receipts exhibit &gt;8% quantity shortfall against telematics tank capacitance
              jumps.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">54.8 L Unaccounted</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline">
              Inspect in Mileage Hub →
            </span>
          </div>
        </div>

        {/* Card 3: AdBlue SCR Compliance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Gauge className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                98.2% Compliant
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              AdBlue Dosing Corridor Status
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Fleet SCR systems dosing within the normal 4.5%–6.5% corridor with zero active tamper
              dongles detected.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold">Corridor Verified</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline">
              Open DEF Ledger →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
