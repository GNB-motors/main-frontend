import { useMemo, useState } from 'react';
import { Calendar, Search, X } from 'lucide-react';
import { presetRange, rangeLabel } from '../../Mileage/mileageDates';
import './ReportFrame.css';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';

/**
 * ReportFrame — the one layout every Reports-page report uses, taken from the
 * AdBlue Telemetry Comparison report: the title and filters (dates, search,
 * vehicle, …) with export, then a data notice, KPI cards, the table (scrolling
 * inside itself under a fixed header row), and a count + pager footer.
 *
 * `layout`:
 * - 'stacked' (default): title + subtitle with export beside it, and the
 *   filters on their own full-width row below — for reports with many filters,
 *   which would otherwise wrap beside the title and leave a gap.
 * - 'inline': filters to the right of the title, on one row.
 *
 *   <ReportFrame
 *     title="Vehicle Report" subtitle="…"
 *     filters={<><ReportDateRange …/><ReportSearch …/><VehiclePicker …/></>}
 *     actions={<ExportButton buttonClass="rpt-btn" …/>}
 *     notice={<ReportDataNotice …/>}
 *     kpis={[{ label: 'Fuel spend', value: '₹1.2L', icon: IndianRupee }]}
 *     footer={<ReportFooter summary="54 vehicles" page={2} totalPages={6} onPage={setPage} />}
 *   >
 *     <DataTable … />
 *   </ReportFrame>
 */
export default function ReportFrame({
  title,
  subtitle = null,
  filters = null,
  actions = null,
  notice = null,
  kpis = null,
  footer = null,
  layout = 'stacked',
  children,
}) {
  const heading = (
    <div className="rpt-head-text">
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );

  return (
    <div className="rpt">
      {layout === 'inline' ? (
        <header className="rpt-head rpt-head--inline">
          {heading}
          {filters || actions ? (
            <div className="rpt-filters">
              {filters}
              {actions}
            </div>
          ) : null}
        </header>
      ) : (
        <header className="rpt-head rpt-head--stacked">
          <div className="rpt-head-row">
            {heading}
            {actions ? <div className="rpt-actions">{actions}</div> : null}
          </div>
          {filters ? <div className="rpt-filters">{filters}</div> : null}
        </header>
      )}
      {notice ? <div className="rpt-notice">{notice}</div> : null}
      {kpis && kpis.length ? <ReportKpis items={kpis} /> : null}
      <div className="rpt-body">{children}</div>
      {footer}
    </div>
  );
}

const PRESET_OPTIONS = [
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: '7DAYS', label: 'Last 7 Days' },
  { value: '15DAYS', label: 'Last 15 Days' },
  { value: '30DAYS', label: 'Last 30 Days' },
  { value: 'MONTH', label: 'This Month' },
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

/**
 * Reusable Report Date Filter with Quick Date Range selector, clear range display,
 * and custom From/To inputs when Custom Range is active.
 */
export function ReportDateRange({
  from = '',
  to = '',
  dates = '',
  onChange,
  className = '',
  showPresetSelector = true,
}) {
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Detect which preset matches the given from & to (or dates param)
  const detectedPreset = useMemo(() => {
    if (dates && dates !== 'CUSTOM') return dates;
    if (from && to) {
      for (const p of PRESET_OPTIONS) {
        if (p.value === 'CUSTOM') continue;
        const r = presetRange(p.value);
        if (r.from === from && r.to === to) return p.value;
      }
      return 'CUSTOM';
    }
    return '';
  }, [dates, from, to]);

  const activePreset = isCustomMode ? 'CUSTOM' : detectedPreset || 'CUSTOM';
  const showCustomInputs = activePreset === 'CUSTOM' || !showPresetSelector;

  const handlePresetChange = (presetKey) => {
    if (presetKey === 'CUSTOM') {
      setIsCustomMode(true);
      onChange({ from: from || '', to: to || '', dates: 'CUSTOM' });
      return;
    }
    setIsCustomMode(false);
    const range = presetRange(presetKey);
    onChange({ from: range.from, to: range.to, dates: presetKey });
  };

  const handleFromChange = (newFrom) => {
    setIsCustomMode(true);
    onChange({ from: newFrom, to, dates: '' });
  };

  const handleToChange = (newTo) => {
    setIsCustomMode(true);
    onChange({ from, to: newTo, dates: '' });
  };

  const activeRangeText = from && to ? rangeLabel({ from, to }) : '';

  return (
    <div className={`rpt-date-range-group ${className}`.trim()}>
      {showPresetSelector ? (
        <ReportSelect
          label="Quick range"
          value={activePreset}
          onChange={handlePresetChange}
          options={PRESET_OPTIONS}
          width={155}
        />
      ) : null}

      {activeRangeText ? (
        <div className="rpt-field rpt-date-display">
          <span>Selected range</span>
          <div className="rpt-date-range-badge" title={`Current date range: ${activeRangeText}`}>
            <Calendar size={13} aria-hidden="true" />
            <span>{activeRangeText}</span>
          </div>
        </div>
      ) : null}

      {showCustomInputs ? (
        <>
          <label className="rpt-field">
            From
            <input
              type="date"
              aria-label="From date"
              value={from}
              max={to || undefined}
              onChange={(e) => handleFromChange(e.target.value)}
            />
          </label>
          <label className="rpt-field">
            To
            <input
              type="date"
              aria-label="To date"
              value={to}
              min={from || undefined}
              onChange={(e) => handleToChange(e.target.value)}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}

export function ReportSearch({ value, onChange, placeholder = 'Search' }) {
  return (
    <div className="rpt-search">
      <Search size={15} aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          className="rpt-search-x"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}

/**
 * A labelled dropdown using the shared searchable control. options: [{ value, label }]; `onChange` receives the value as a
 * string, like a native <select>.
 */
export function ReportSelect({ label, value, onChange, options, width = 160 }) {
  return (
    <div className="rpt-field rpt-picker" style={{ width }}>
      {label}
      <SearchableSelect
        aria-label={`${label}: ${options.find((option) => String(option.value) === String(value))?.label || ''}`}
        value={value}
        onValueChange={(next) => onChange(String(next))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SearchableSelect>
    </div>
  );
}

/** "Clear" — shown only while at least one filter is set. */
export function ReportClear({ active, onClear }) {
  if (!active) return null;
  return (
    <button type="button" className="rpt-btn rpt-btn--ghost" onClick={onClear}>
      Clear
    </button>
  );
}

const KPI_TONES = new Set(['blue', 'teal', 'violet', 'orange', 'red', 'green']);

/** KPI cards. items: [{ label, value, icon?: LucideIcon, tone?: 'blue'|…, hint? }]. */
export function ReportKpis({ items }) {
  return (
    <div className="rpt-kpis">
      {items.map((item) => {
        const Icon = item.icon;
        const tone = KPI_TONES.has(item.tone) ? item.tone : 'blue';
        return (
          <div
            key={item.key || item.label}
            className={`rpt-kpi rpt-kpi--${tone}`}
            title={item.hint}
          >
            {Icon ? <Icon size={19} aria-hidden="true" /> : null}
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The count line on the left, Previous · Page x of y · Next on the right. */
export function ReportFooter({ summary = null, page = 1, totalPages = 1, onPage = null }) {
  const pages = Math.max(1, totalPages || 1);
  return (
    <div className="rpt-foot">
      <span>{summary}</span>
      {onPage ? (
        <div className="rpt-pager">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {Math.min(page, pages)} of {pages}
          </span>
          <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
