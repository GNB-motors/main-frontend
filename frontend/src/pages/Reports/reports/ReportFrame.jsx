import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import './ReportFrame.css';

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

/** Labelled From / To day inputs; each bounds the other so To can't precede From. */
export function ReportDateRange({ from, to, onChange }) {
  return (
    <>
      <label className="rpt-field">
        From
        <input
          type="date"
          aria-label="From date"
          value={from}
          max={to || undefined}
          onChange={(e) => onChange({ from: e.target.value, to })}
        />
      </label>
      <label className="rpt-field">
        To
        <input
          type="date"
          aria-label="To date"
          value={to}
          min={from || undefined}
          onChange={(e) => onChange({ from, to: e.target.value })}
        />
      </label>
    </>
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
 * A labelled dropdown that looks and behaves like the vehicle picker (minus its
 * search box). options: [{ value, label }]; `onChange` receives the value as a
 * string, like a native <select>.
 */
export function ReportSelect({ label, value, onChange, options, width = 160 }) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => String(o.value) === String(value)),
  );
  const current = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  const openList = () => {
    setHighlight(selectedIndex);
    setOpen(true);
  };

  const choose = (option) => {
    onChange(String(option.value));
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setHighlight((h) => Math.min(Math.max(h + step, 0), options.length - 1));
    } else if ((e.key === 'Enter' || e.key === ' ') && open) {
      e.preventDefault();
      if (options[highlight]) choose(options[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="rpt-field rpt-picker" ref={rootRef} style={{ width }}>
      {label}
      <button
        type="button"
        className="rpt-picker-trigger"
        aria-label={`${label}: ${current?.label ?? ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span>{current?.label}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open ? (
        <div className="rpt-picker-panel rpt-picker-panel--fit">
          <div className="rpt-picker-list" id={listId} role="listbox" aria-label={label}>
            {options.map((option, i) => (
              <div
                key={option.value}
                role="option"
                tabIndex={-1}
                aria-selected={i === selectedIndex}
                className={[
                  'rpt-picker-option',
                  i === highlight && 'is-active',
                  i === selectedIndex && 'is-selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      ) : null}
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
