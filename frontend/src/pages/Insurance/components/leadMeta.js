// Shared lead status/priority metadata + Dropdown option builders.
// Kept separate from badges.jsx so that file can export only components
// (satisfies react-refresh/only-export-components).
import { Flame, Thermometer, Snowflake } from 'lucide-react';
import { LEAD_STATUSES, LEAD_PRIORITIES } from '../insuranceConstants';

// Status pipeline → pill colours.
export const STATUS_STYLES = {
  New: 'bg-slate-100 text-slate-600 ring-slate-200',
  Contacted: 'bg-blue-50 text-blue-700 ring-blue-200',
  'Quote Shared': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Documents Pending': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Policy Issued': 'bg-teal-50 text-teal-700 ring-teal-200',
  Converted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-400 ring-slate-200',
};

// Solid dot colours used inside dropdown menus / triggers.
export const STATUS_DOT = {
  New: 'bg-slate-400',
  Contacted: 'bg-blue-500',
  'Quote Shared': 'bg-violet-500',
  'Documents Pending': 'bg-amber-500',
  'Policy Issued': 'bg-teal-500',
  Converted: 'bg-emerald-500',
  Closed: 'bg-slate-300',
};

// Lead strength → red / amber / grey, matching the app's signal palette.
export const PRIORITY_META = {
  Hot: { cls: 'bg-red-50 text-red-600 ring-red-200', dot: 'bg-red-500', Icon: Flame },
  Warm: { cls: 'bg-amber-50 text-amber-600 ring-amber-200', dot: 'bg-amber-500', Icon: Thermometer },
  Cold: { cls: 'bg-slate-100 text-slate-500 ring-slate-200', dot: 'bg-slate-400', Icon: Snowflake },
};

// Option lists for the shared Dropdown (with colour dots / icons).
export const statusOptions = (includeAll = false) => [
  ...(includeAll ? [{ value: '', label: 'All statuses' }] : []),
  ...LEAD_STATUSES.map((s) => ({ value: s, label: s, dot: STATUS_DOT[s] })),
];

export const priorityOptions = (includeAll = false) => [
  ...(includeAll ? [{ value: '', label: 'All priorities' }] : []),
  ...LEAD_PRIORITIES.map((p) => ({ value: p, label: p, dot: PRIORITY_META[p].dot, Icon: PRIORITY_META[p].Icon })),
];
