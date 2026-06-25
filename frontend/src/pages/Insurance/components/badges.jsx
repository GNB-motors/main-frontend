import React from 'react';
import { Flame, Thermometer, Snowflake } from 'lucide-react';

// Status pipeline → pill colours. Keeps the whole module visually consistent
// across table, details, and overview.
const STATUS_STYLES = {
  New: 'bg-slate-100 text-slate-600 ring-slate-200',
  Contacted: 'bg-blue-50 text-blue-700 ring-blue-200',
  'Quote Shared': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Documents Pending': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Policy Issued': 'bg-teal-50 text-teal-700 ring-teal-200',
  Converted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-400 ring-slate-200',
};

export function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.New;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}

// Lead strength → red / amber / grey, matching the app's signal palette.
const PRIORITY_META = {
  Hot: { cls: 'bg-red-50 text-red-600 ring-red-200', Icon: Flame },
  Warm: { cls: 'bg-amber-50 text-amber-600 ring-amber-200', Icon: Thermometer },
  Cold: { cls: 'bg-slate-100 text-slate-500 ring-slate-200', Icon: Snowflake },
};

export function PriorityFlag({ priority }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.Warm;
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${meta.cls}`}
    >
      <Icon size={11} />
      {priority}
    </span>
  );
}

// Inline priority editor used in the leads table. Small, colour-coded native select.
export function PriorityDropdown({ value, onChange, disabled }) {
  const meta = PRIORITY_META[value] || PRIORITY_META.Warm;
  return (
    <select
      value={value}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 outline-none disabled:opacity-50 ${meta.cls}`}
    >
      {Object.keys(PRIORITY_META).map((p) => (
        <option key={p} value={p} className="bg-white text-slate-700">
          {p}
        </option>
      ))}
    </select>
  );
}
