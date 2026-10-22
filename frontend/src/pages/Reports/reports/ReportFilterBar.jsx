import { RotateCcw } from 'lucide-react';
import { useActiveBranch } from '../../../contexts/BranchContext';
import { ReportDateRange, ReportSearch, ReportSelect } from './ReportFrame';
import { DriverPicker, VehiclePicker } from './ReportEntityPicker';
import { REPORT_RANGE_PRESETS, activePresetId } from './reportFilterParams';
import useReportFilterParams from './useReportFilterParams';
import './ReportFilterBar.css';

/**
 * ReportFilterBar — the one filter row every consolidated report uses.
 *
 * The controls are fixed and ordered (location, range presets, dates, search,
 * vehicle, driver) so two reports filter the same way; a report with something
 * extra to narrow by passes it through `extra`. Every control writes straight
 * to the URL, so a filtered report is shareable and survives a refresh without
 * the report holding any filter state of its own.
 *
 *   <ReportFrame filters={<ReportFilterBar searchPlaceholder="Search driver or phone" />} … />
 *
 * Hide a control the report cannot use: showVehicle={false} showDriver={false}
 * showSearch={false} showLocation={false}. `extra` is a node, or a function
 * receiving { filters, setFilter } when the control has to read the URL state.
 */
export default function ReportFilterBar({
  searchPlaceholder = 'Search',
  showSearch = true,
  showLocation = true,
  showVehicle = true,
  showDriver = true,
  extra = null,
}) {
  const { filters, range, activeCount, setFilter, setFilters, applyRangePreset, clearFilters } =
    useReportFilterParams();
  const { branches } = useActiveBranch();

  const locationOptions = [
    { value: '', label: 'All locations' },
    ...branches.map((b) => ({ value: String(b._id), label: b.name })),
  ];
  const preset = activePresetId(filters);

  return (
    <div className="rpt-bar">
      <div className="rpt-bar-row">
        {showLocation ? (
          <ReportSelect
            label="Location"
            value={filters.loc}
            onChange={(value) => setFilter('loc', value)}
            options={locationOptions}
            width={180}
          />
        ) : null}

        <div className="rpt-field">
          Quick range
          <div className="rpt-presets" role="group" aria-label="Quick date range">
            {REPORT_RANGE_PRESETS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`rpt-preset${preset === option.key ? ' is-active' : ''}`}
                aria-pressed={preset === option.key}
                onClick={() => applyRangePreset(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <ReportDateRange from={range.from} to={range.to} onChange={setFilters} />

        {showSearch ? (
          <ReportSearch
            value={filters.search}
            onChange={(value) => setFilter('search', value)}
            placeholder={searchPlaceholder}
          />
        ) : null}

        {showVehicle ? (
          <VehiclePicker
            value={filters.vehicle}
            valueLabel={filters.vehicleLabel}
            onChange={(id, row) => setFilters({ vehicle: id, vehicleLabel: row?.label || '' })}
          />
        ) : null}

        {showDriver ? (
          <DriverPicker
            value={filters.driver}
            valueLabel={filters.driverLabel}
            onChange={(id, row) => setFilters({ driver: id, driverLabel: row?.label || '' })}
          />
        ) : null}

        {typeof extra === 'function' ? extra({ filters, setFilter }) : extra}
      </div>

      <div className="rpt-bar-foot">
        <span className="rpt-bar-count">
          {activeCount
            ? `${activeCount} filter${activeCount === 1 ? '' : 's'} applied`
            : 'Showing everything'}
        </span>
        {activeCount ? (
          <button type="button" className="rpt-btn rpt-btn--ghost" onClick={clearFilters}>
            <RotateCcw size={14} aria-hidden="true" /> Reset filters
          </button>
        ) : null}
      </div>
    </div>
  );
}