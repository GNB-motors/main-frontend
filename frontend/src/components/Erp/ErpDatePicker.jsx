import React from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { offset, shift } from '@floating-ui/react';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/erp-datepicker.css';

/**
 * ErpDatePicker — the one calendar control for the ERP.
 *
 * A thin react-datepicker wrapper that is a drop-in for `<input type="date">`:
 * it takes and emits plain `YYYY-MM-DD` strings, so every existing caller
 * (DateRangeFilter, finance forms, …) keeps its exact contract. Because the
 * whole ERP funnels its dates through DateRangeFilter, swapping the native
 * input here upgrades every financial screen at once.
 *
 * The popup is portaled to <body> and pinned below the field (flip middleware
 * removed) so it never opens upward out of a modal or a low toolbar.
 */

const pad = (n) => String(n).padStart(2, '0');

/** Local Y-M-D of the clicked day — the date the user sees, never tz-shifted. */
const toYmd = (d) =>
  d instanceof Date && !Number.isNaN(d.getTime())
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    : '';

/** Noon avoids any DST/tz edge when parsing a bare date string to a Date. */
const fromYmd = (s) => (s ? new Date(`${s}T12:00:00`) : null);

const ErpDatePicker = ({
  value = '',
  onChange,
  minDate = '',
  maxDate = '',
  disabled = false,
  placeholder = 'dd/mm/yyyy',
  block = false,
  id,
}) => (
  <div className={`erp-datepicker${block ? ' erp-datepicker--block' : ''}`}>
    <DatePicker
      id={id}
      selected={fromYmd(value)}
      onChange={(d) => onChange(toYmd(d))}
      minDate={fromYmd(minDate) || undefined}
      maxDate={fromYmd(maxDate) || undefined}
      disabled={disabled}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      popperPlacement="bottom-start"
      portalId="erp-datepicker-portal"
      showPopperArrow={false}
      popperProps={{
        strategy: 'fixed',
        middleware: [offset(6), shift({ mainAxis: false, crossAxis: true, padding: 8 })],
      }}
      wrapperClassName="erp-datepicker-wrap"
      className="erp-filter erp-datepicker-input"
    />
    <Calendar size={15} className="erp-datepicker-ic" />
  </div>
);

export default ErpDatePicker;
