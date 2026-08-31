import React, { useMemo } from 'react';
import { toISTDateString } from '../../utils/dateUtils';

/**
 * DateRangeFilter — the one date-range control for ERP financial screens.
 *
 * Emits YYYY-MM-DD strings built through toISTDateString. This matters: the
 * backend normalises every ERP date filter to IST day boundaries, so a range
 * built with `new Date().toISOString().slice(0,10)` is off by one day for the
 * 5.5 hours after IST midnight — which is exactly when a "today" report would
 * be run at the start of a shift.
 *
 * Includes an Indian financial-year preset (Apr–Mar) because every statutory
 * report and most "how are we doing" questions are scoped to the FY, not the
 * calendar year.
 */

const shiftDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Indian FY runs 1 Apr → 31 Mar. Before April, the FY started last year. */
const financialYearBounds = (ref) => {
  const istIso = toISTDateString(ref);
  const [year, month] = istIso.split('-').map(Number);
  const startYear = month >= 4 ? year : year - 1;
  return {
    from: `${startYear}-04-01`,
    to: `${startYear + 1}-03-31`,
  };
};

const buildPreset = (key, now = new Date()) => {
  const today = toISTDateString(now);
  const [y, m] = today.split('-').map(Number);

  switch (key) {
    case 'TODAY':
      return { from: today, to: today };
    case 'WEEK': {
      // Week starts Monday; getDay() is Sunday-based.
      const dow = new Date(`${today}T00:00:00`).getDay();
      const back = dow === 0 ? 6 : dow - 1;
      return { from: toISTDateString(shiftDays(`${today}T00:00:00`, -back)), to: today };
    }
    case 'MONTH':
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case 'LAST_MONTH': {
      const lastM = m === 1 ? 12 : m - 1;
      const lastY = m === 1 ? y - 1 : y;
      const mm = String(lastM).padStart(2, '0');
      const lastDay = new Date(lastY, lastM, 0).getDate();
      return { from: `${lastY}-${mm}-01`, to: `${lastY}-${mm}-${String(lastDay).padStart(2, '0')}` };
    }
    case 'FY':
      return financialYearBounds(now);
    case 'LAST_30':
      return { from: toISTDateString(shiftDays(`${today}T00:00:00`, -29)), to: today };
    case 'LAST_90':
      return { from: toISTDateString(shiftDays(`${today}T00:00:00`, -89)), to: today };
    case 'ALL':
    default:
      return { from: '', to: '' };
  }
};

const DEFAULT_PRESETS = [
  { key: 'ALL', label: 'All time' },
  { key: 'TODAY', label: 'Today' },
  { key: 'WEEK', label: 'This week' },
  { key: 'MONTH', label: 'This month' },
  { key: 'LAST_MONTH', label: 'Last month' },
  { key: 'FY', label: 'This FY (Apr–Mar)' },
  { key: 'LAST_30', label: 'Last 30 days' },
  { key: 'LAST_90', label: 'Last 90 days' },
];

const DateRangeFilter = ({
  value = { from: '', to: '' },
  onChange,
  presets = DEFAULT_PRESETS,
  showPresets = true,
  label = null,
  disabled = false,
}) => {
  const from = value?.from || '';
  const to = value?.to || '';

  // Reflect the current range back onto a preset when it matches one exactly,
  // so the dropdown doesn't read "Custom" right after the user picked "Today".
  const activePreset = useMemo(() => {
    const match = presets.find((p) => {
      const built = buildPreset(p.key);
      return built.from === from && built.to === to;
    });
    return match ? match.key : 'CUSTOM';
  }, [presets, from, to]);

  const applyPreset = (key) => {
    if (key === 'CUSTOM') return;
    onChange(buildPreset(key));
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {label && <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{label}</span>}

      {showPresets && (
        <select
          className="erp-filter"
          value={activePreset}
          disabled={disabled}
          onChange={(e) => applyPreset(e.target.value)}
          aria-label="Date range preset"
        >
          {presets.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
          <option value="CUSTOM">Custom…</option>
        </select>
      )}

      <input
        type="date"
        className="erp-filter"
        value={from}
        max={to || undefined}
        disabled={disabled}
        onChange={(e) => onChange({ from: e.target.value, to })}
        aria-label="From date"
      />
      <span style={{ color: '#94a3b8', fontSize: '13px' }}>to</span>
      <input
        type="date"
        className="erp-filter"
        value={to}
        min={from || undefined}
        disabled={disabled}
        onChange={(e) => onChange({ from, to: e.target.value })}
        aria-label="To date"
      />
    </div>
  );
};

export default DateRangeFilter;
