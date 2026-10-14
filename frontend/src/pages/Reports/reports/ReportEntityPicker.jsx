import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { ReportsService } from '../ReportsService.js';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

const RESULT_LIMIT = 20;
const ALL = 'all';

/**
 * ReportEntityPicker — a searchable single-select whose options come from the
 * server as the user types, so a fleet of any size is reachable (a preloaded
 * <Select> stops at whatever page size it fetched).
 *
 * `fetchOptions(query, signal)` resolves to [{ id, label, sub? }]. `value` is
 * an id or 'all'; `onChange(id, row)` receives ('all', null) for the "All …"
 * row, and the chosen { id, label, sub } otherwise.
 */
export default function ReportEntityPicker({
  label,
  value,
  onChange,
  fetchOptions,
  allLabel,
  searchPlaceholder,
  width = 200,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selected, setSelected] = useState(null);

  const isAll = !value || value === ALL;
  const shownSelected = !isAll && selected?.id === value ? selected : null;

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    fetchOptions(debouncedQuery, controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return;
        setOptions(Array.isArray(rows) ? rows : []);
        setHighlight(0);
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'CanceledError') return;
        setOptions([]);
        setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // fetchOptions is a stable module-level function in every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debouncedQuery]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  const rows = [{ id: ALL, label: allLabel }, ...options];

  const choose = (row) => {
    setSelected(row.id === ALL ? null : row);
    onChange(row.id, row.id === ALL ? null : row);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rows[highlight]) choose(rows[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="rpt-field rpt-picker" ref={rootRef} style={{ width }}>
      {label}
      <button
        type="button"
        className={`rpt-picker-trigger${shownSelected ? '' : ' is-placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{shownSelected ? shownSelected.label : allLabel}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open ? (
        <div className="rpt-picker-panel">
          <div className="rpt-picker-query">
            <div className="rpt-picker-search">
              <Search size={14} aria-hidden="true" />
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
              />
            </div>
          </div>
          <div className="rpt-picker-list" id={listId} role="listbox">
            {rows.map((row, i) => (
              <div
                key={row.id}
                role="option"
                tabIndex={-1}
                aria-selected={row.id === (isAll ? ALL : value)}
                className={[
                  'rpt-picker-option',
                  i === highlight && 'is-active',
                  row.id === (isAll ? ALL : value) && 'is-selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(row);
                }}
              >
                {row.label}
                {row.sub ? <small>{row.sub}</small> : null}
              </div>
            ))}
          </div>
          {loading ? <div className="rpt-picker-note">Searching…</div> : null}
          {!loading && failed ? (
            <div className="rpt-picker-note">Could not load the list.</div>
          ) : null}
          {!loading && !failed && debouncedQuery && options.length === 0 ? (
            <div className="rpt-picker-note">No match for “{debouncedQuery}”.</div>
          ) : null}
          {!loading && options.length >= RESULT_LIMIT ? (
            <div className="rpt-picker-note">
              Type to narrow — showing the first {RESULT_LIMIT}.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const fetchVehicles = (query, signal) =>
  ReportsService.searchVehicles(query, { signal, limit: RESULT_LIMIT });

const fetchDrivers = (query, signal) =>
  ReportsService.searchDrivers(query, { signal, limit: RESULT_LIMIT });

export function VehiclePicker({ value, onChange, width = 200 }) {
  return (
    <ReportEntityPicker
      label="Vehicle"
      value={value}
      onChange={onChange}
      fetchOptions={fetchVehicles}
      allLabel="All vehicles"
      searchPlaceholder="Search vehicle number"
      width={width}
    />
  );
}

export function DriverPicker({ value, onChange, width = 200 }) {
  return (
    <ReportEntityPicker
      label="Driver"
      value={value}
      onChange={onChange}
      fetchOptions={fetchDrivers}
      allLabel="All drivers"
      searchPlaceholder="Search name or phone"
      width={width}
    />
  );
}
