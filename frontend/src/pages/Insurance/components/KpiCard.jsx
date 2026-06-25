import React from 'react';

// Clean, uniform KPI tile used on the Overview and Leads pages.
// Icon chip + label eyebrow + large tabular number, optional sub-line.
export default function KpiCard({ label, value, sub, icon: Icon, accent = 'blue', loading }) {
  const accents = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    teal: 'bg-teal-50 text-teal-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        {Icon ? (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accents[accent] || accents.blue}`}>
            <Icon size={15} />
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
      ) : (
        <div className="mt-2 text-3xl font-bold tabular-nums text-slate-800">{value ?? 0}</div>
      )}
      {sub ? <div className="mt-0.5 text-xs text-slate-400">{sub}</div> : null}
    </div>
  );
}
