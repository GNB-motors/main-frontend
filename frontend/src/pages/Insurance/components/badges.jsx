import React from 'react';
import Dropdown from './Dropdown';
import { STATUS_STYLES, PRIORITY_META } from './leadMeta';
import { LEAD_PRIORITIES } from '../insuranceConstants';

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

// Inline priority editor for the leads table — a real coloured-pill dropdown.
export function PriorityDropdown({ value, onChange, disabled }) {
  const meta = PRIORITY_META[value] || PRIORITY_META.Warm;
  return (
    <Dropdown
      value={value}
      onChange={onChange}
      disabled={disabled}
      variant="pill"
      tone={meta.cls}
      ariaLabel="Lead priority"
      options={LEAD_PRIORITIES.map((p) => ({
        value: p,
        label: p,
        dot: PRIORITY_META[p].dot,
        Icon: PRIORITY_META[p].Icon,
      }))}
    />
  );
}
