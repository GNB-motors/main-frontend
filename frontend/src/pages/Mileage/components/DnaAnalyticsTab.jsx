import React from 'react';
import {
  TrendingUp,
  Activity,
  Truck,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';

const MODEL_BENCHMARKS = [
  { model: 'Signa 4825.TK (16-Wheel Tipper)', median: 3.75, p25: 3.4, p75: 4.1, actualAvg: 3.82 },
  { model: 'Signa 1918.K (6-Wheel Cargo)', median: 4.3, p25: 3.9, p75: 4.7, actualAvg: 4.25 },
  { model: 'Signa 5525.S (Tractor Trailer)', median: 3.45, p25: 3.1, p75: 3.8, actualAvg: 3.4 },
  { model: 'Ashok Leyland 4220 (14-Wheel)', median: 3.9, p25: 3.6, p75: 4.25, actualAvg: 3.95 },
];

const TWIN_VEHICLE_COMPARISON = [
  {
    corridor: 'Kolkata → Durgapur (175 km)',
    date: '06 Oct 2026',
    vehA: {
      plate: 'WB11G0962',
      driver: 'M. Ansari',
      mileage: 3.92,
      payloadT: 38.5,
      rpmSweetSpotPct: 78,
      idleHrs: 0.6,
    },
    vehB: {
      plate: 'JH05DH2318',
      driver: 'R. Sharma',
      mileage: 3.45,
      payloadT: 39.0,
      rpmSweetSpotPct: 54,
      idleHrs: 1.8,
    },
    varianceSummary:
      'Vehicle B burned 6.2 L more fuel on identical route; Driver DNA analysis reveals 1.2 hrs excess idle and low RPM sweet-spot compliance.',
  },
  {
    corridor: 'Jamshedpur → Haldia (240 km)',
    date: '05 Oct 2026',
    vehA: {
      plate: 'WB25K4011',
      driver: 'K. Yadav',
      mileage: 4.28,
      payloadT: 18.0,
      rpmSweetSpotPct: 82,
      idleHrs: 0.4,
    },
    vehB: {
      plate: 'NL01AH9821',
      driver: 'S. Mondal',
      mileage: 3.65,
      payloadT: 18.2,
      rpmSweetSpotPct: 61,
      idleHrs: 1.4,
    },
    varianceSummary:
      'Vehicle B mileage penalized by prolonged unmanaged idling at Kolaghat and aggressive highway accelerations.',
  },
];

export default function DnaAnalyticsTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Insight Banner: TKPL Normalized Engine ──────────────── */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Route-Normalized Efficiency Metric: Tonne-Kilometre per Litre (TKPL)</span>
          </div>
          <h3 className="text-lg font-bold">Driver DNA vs Vehicle Mechanical DNA Deconvolution</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Eliminates false mileage penalties by evaluating trucks on identical routes with
            equivalent payload bands, separating mechanical degradation from driver behavior.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-lg border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block uppercase">Fleet Mean TKPL</span>
            <span className="font-mono text-xl font-bold text-emerald-400">148.2</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Model-Wise Mileage Benchmarks ─────────────────── */}
      <div className="mileage-panel p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Model-Wise Baseline Corridor (P25 – Median – P75)
            </h4>
            <p className="text-xs text-slate-500">
              Each vehicle family evaluated against its factory mechanical envelope.
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            Target Corridor: 3.5 – 4.4 km/L
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MODEL_BENCHMARKS} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="model" tick={{ fontSize: 11 }} />
              <YAxis unit=" km/L" domain={[2.5, 5.0]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val) => [`${val} km/L`, '']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="p25" fill="#cbd5e1" name="Lower Band (P25)" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="median"
                fill="#6366f1"
                name="Model Median (km/L)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="actualAvg"
                fill="#10b981"
                name="Fleet Actual (km/L)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 2: Twin Vehicle Identical Route Comparison ────────── */}
      <div className="mileage-panel p-5">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Twin-Vehicle Comparison: Same Corridor & Same Day Runs
          </h4>
          <p className="text-xs text-slate-500">
            Comparing identical chassis on identical corridors to isolate driver habits from
            mechanical defects.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {TWIN_VEHICLE_COMPARISON.map((comp, idx) => (
            <div
              key={`twin-${idx}`}
              className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap gap-2">
                <span className="font-bold text-xs text-indigo-700 dark:text-indigo-400">
                  {comp.corridor}
                </span>
                <span className="font-mono text-xs text-slate-500">{comp.date}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle A */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="mileage-plate">{comp.vehA.plate}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Driver: {comp.vehA.driver}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                      <span className="text-slate-400 block text-[10px]">Mileage</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {comp.vehA.mileage} km/L
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                      <span className="text-slate-400 block text-[10px]">RPM Sweet-Spot</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {comp.vehA.rpmSweetSpotPct}%
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                      <span className="text-slate-400 block text-[10px]">Idle Dwell</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {comp.vehA.idleHrs} h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle B */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-rose-200 dark:border-rose-900 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="mileage-plate">{comp.vehB.plate}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Driver: {comp.vehB.driver}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                      <span className="text-slate-400 block text-[10px]">Mileage</span>
                      <span className="font-mono font-bold text-rose-600">
                        {comp.vehB.mileage} km/L
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                      <span className="text-slate-400 block text-[10px]">RPM Sweet-Spot</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {comp.vehB.rpmSweetSpotPct}%
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                      <span className="text-slate-400 block text-[10px]">Idle Dwell</span>
                      <span className="font-mono font-bold text-rose-600">
                        {comp.vehB.idleHrs} h
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 px-3 py-2 rounded-lg font-medium">
                💡 <strong>Audit Verdict:</strong> {comp.varianceSummary}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
