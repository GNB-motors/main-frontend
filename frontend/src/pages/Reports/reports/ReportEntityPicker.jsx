import { getVehicleList } from '../../../services/vehicleListService';
import { toast } from 'react-toastify';
import { useCallback, useEffect, useRef, useState } from 'react';
import useManufacturerFilter from '../../../hooks/useManufacturerFilter';
import SearchableDropdown from '@/components/SearchableDropdown/SearchableDropdown';
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
 *
 * `valueLabel` is the picked row's text, kept by the caller. The options are
 * only fetched while the panel is open, so without it a value restored from a
 * shared link would show the "All …" text while filtering to one entity.
 */
export default function ReportEntityPicker({
  label,
  value,
  valueLabel = '',
  onChange,
  fetchOptions,
  allLabel,
  searchPlaceholder,
  width = 200,
  scopeKey = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(null);

  const isAll = !value || value === ALL;
  const shownSelected = !isAll && selected?.id === value ? selected : null;
  const triggerLabel = shownSelected ? shownSelected.label : isAll ? allLabel : valueLabel;

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    fetchOptions(debouncedQuery, controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return;
        setOptions(Array.isArray(rows) ? rows : []);
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
  }, [open, debouncedQuery, scopeKey]);

  const rows = [{ id: ALL, label: allLabel }, ...options];

  const choose = (row) => {
    setSelected(row.id === ALL ? null : row);
    onChange(row.id, row.id === ALL ? null : row);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="rpt-field rpt-picker" style={{ width }}>
      {label}
      <SearchableDropdown
        bare
        options={rows}
        selectedOption={triggerLabel}
        aria-label={`${label}: ${triggerLabel}`}
        open={open}
        onOpenChange={setOpen}
        onSelect={choose}
        searchValue={query}
        onSearchChange={setQuery}
        filterOptions={false}
        searchLabel={searchPlaceholder}
        searchPlaceholder={searchPlaceholder}
        loading={loading}
        error={failed ? 'Could not load the list.' : null}
        isOptionSelected={(row) => row.id === (isAll ? ALL : value)}
        renderOption={(row) => (
          <span>
            {row.label}
            {row.sub ? <small className="block text-xs text-slate-500">{row.sub}</small> : null}
          </span>
        )}
        footer={
          !loading && !failed && debouncedQuery && options.length === 0 ? (
            <div className="rpt-picker-note">No match for “{debouncedQuery}”.</div>
          ) : !loading && options.length >= RESULT_LIMIT ? (
            <div className="rpt-picker-note">
              Type to narrow — showing the first {RESULT_LIMIT}.
            </div>
          ) : null
        }
      />
    </div>
  );
}

const fetchVehicles = (query, signal) =>
  ReportsService.searchVehicles(query, { signal, limit: RESULT_LIMIT });

const fetchDrivers = (query, signal) =>
  ReportsService.searchDrivers(query, { signal, limit: RESULT_LIMIT });

export function VehiclePicker({ value, valueLabel, onChange, width = 200, manufacturer: make }) {
  const { manufacturer: urlMake } = useManufacturerFilter();
  const manufacturer = make ?? urlMake;
  const fetchScopedVehicles = useCallback(
    (query, signal) =>
      manufacturer
        ? ReportsService.searchVehicles(query, { signal, limit: RESULT_LIMIT, manufacturer })
        : fetchVehicles(query, signal),
    [manufacturer],
  );
  const previousMake = useRef(manufacturer);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    if (previousMake.current === manufacturer) return undefined;
    previousMake.current = manufacturer;
    if (!manufacturer || !value || value === ALL) return undefined;
    const controller = new AbortController();
    getVehicleList({ signal: controller.signal })
      .then((vehicles) => {
        const selectedVehicle = vehicles.find((v) => String(v._id || v.id) === String(value));
        if (selectedVehicle && (selectedVehicle.manufacturer || 'UNKNOWN') === manufacturer) return;
        if (controller.signal.aborted) return;
        onChangeRef.current(ALL, null);
        toast.info('Vehicle selection cleared for the selected manufacturer.');
      })
      .catch(() => {
        /* Backend still intersects a conflicting selection. */
      });
    return () => controller.abort();
  }, [manufacturer, value]);
  return (
    <ReportEntityPicker
      label="Vehicle"
      value={value}
      valueLabel={valueLabel}
      onChange={onChange}
      fetchOptions={fetchScopedVehicles}
      scopeKey={manufacturer}
      allLabel="All vehicles"
      searchPlaceholder="Search vehicle number"
      width={width}
    />
  );
}

export function DriverPicker({ value, valueLabel, onChange, width = 200 }) {
  return (
    <ReportEntityPicker
      label="Driver"
      value={value}
      valueLabel={valueLabel}
      onChange={onChange}
      fetchOptions={fetchDrivers}
      allLabel="All drivers"
      searchPlaceholder="Search name or phone"
      width={width}
    />
  );
}
