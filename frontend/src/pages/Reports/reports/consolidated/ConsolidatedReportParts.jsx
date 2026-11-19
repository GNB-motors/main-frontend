import { Link } from 'react-router-dom';
import { useId, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import ManufacturerFilter from '../../../../components/filters/ManufacturerFilter';
import { useActiveBranch } from '../../../../contexts/BranchContext';
import { ReportDateRange, ReportSearch, ReportSelect } from '../ReportFrame';
import { DriverPicker, VehiclePicker } from '../ReportEntityPicker';
import { formatINR, formatNum } from '../../../../utils/formatters';
import { rangeLabel } from '../../../Mileage/mileageDates';
import './ConsolidatedReports.css';
import '../ReportFilterBar.css';

export function GroupControls({ groups, value, onChange }) {
  return (
    <div className="cr-group" role="group" aria-label="Group report by">
      <span>Group by</span>
      {groups.map((g) => (
        <button
          key={g.value}
          type="button"
          aria-pressed={g.value === value}
          onClick={() => onChange(g.value)}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

export function ReportScope({ report, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const controlsId = useId();
  const { branches, branchId } = useActiveBranch();
  const { filters, range, setFilter, setFilters, dateError } = report;
  const activeCount = [
    filters.manufacturer,
    filters.vehicle !== 'all' && filters.vehicle,
    filters.driver !== 'all' && filters.driver,
  ].filter(Boolean).length;
  return (
    <div className="cr-scope">
      <div className="cr-toolbar">
        <details
          className="cr-period"
          open={dateError ? true : undefined}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.currentTarget.open = false;
              event.currentTarget.querySelector('summary')?.focus();
            }
          }}
        >
          <summary aria-label="Reporting period">
            <CalendarDays size={16} aria-hidden="true" />
            <span>{range.from && range.to ? rangeLabel(range) : 'Choose a period'}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </summary>
          <div className="cr-period-panel">
            <strong>
              Reporting period <small>IST</small>
            </strong>
            <ReportDateRange
              from={range.from}
              to={range.to}
              dates={filters.dates}
              onChange={setFilters}
            />
            {dateError && (
              <p role="alert" className="cr-error">
                {dateError}
              </p>
            )}
            <button
              type="button"
              className="rpt-btn cr-apply-dates"
              onClick={(event) => {
                event.currentTarget.closest('details').open = false;
              }}
              disabled={Boolean(dateError)}
            >
              <Check size={14} /> Apply dates
            </button>
          </div>
        </details>
        <ReportSelect
          label="Location"
          value={branchId || ''}
          options={[
            { value: '', label: 'All locations' },
            ...branches.map((b) => ({ value: String(b._id), label: b.name })),
          ]}
          onChange={(value) => setFilter('loc', value || 'all')}
          width={170}
        />
        <ReportSearch
          value={report.search}
          onChange={report.setSearch}
          placeholder={searchPlaceholder}
        />
        <button
          type="button"
          className={`rpt-btn cr-filter-toggle ${activeCount ? 'has-filters' : ''}`}
          aria-expanded={open}
          aria-controls={controlsId}
          onClick={() => setOpen((value) => !value)}
        >
          <SlidersHorizontal size={15} aria-hidden="true" /> Filters{' '}
          {activeCount > 0 && <span className="cr-filter-count">{activeCount}</span>}
          <ChevronDown size={13} />
        </button>
        <button
          type="button"
          className="rpt-btn cr-reset"
          aria-label="Reset filters"
          title="Reset filters"
          onClick={report.clearFilters}
        >
          <X size={15} />
          <span>Reset</span>
        </button>
      </div>
      {open && (
        <div className="cr-advanced-filters" id={controlsId}>
          <ManufacturerFilter
            value={filters.manufacturer}
            onChange={(value) => setFilter('manufacturer', value)}
          />
          <VehiclePicker
            manufacturer={filters.manufacturer}
            value={filters.vehicle}
            valueLabel={filters.vehicleLabel}
            onChange={(id, row) => setFilters({ vehicle: id, vehicleLabel: row?.label || '' })}
          />
          <DriverPicker
            value={filters.driver}
            valueLabel={filters.driverLabel}
            onChange={(id, row) => setFilters({ driver: id, driverLabel: row?.label || '' })}
          />
        </div>
      )}
    </div>
  );
}

export function MethodNote({ children }) {
  return (
    <details className="cr-method">
      <summary>
        <Info size={14} aria-hidden="true" /> How these figures are calculated{' '}
        <ChevronDown size={13} aria-hidden="true" />
      </summary>
      <div className="cr-method-body">{children}</div>
    </details>
  );
}

export function Cost({ value, missing = 0, partial = 0 }) {
  return (
    <>
      <div className="cell-primary">{value == null ? '—' : formatINR(value)}</div>
      {missing + partial > 0 && (
        <div className="cr-caution">
          {missing > 0 ? `${formatNum(missing)} not costed` : ''}
          {missing && partial ? ' · ' : ''}
          {partial > 0 ? `${formatNum(partial)} partial` : ''}
        </div>
      )}
    </>
  );
}

export function DetailButton({ expanded, label, onClick }) {
  const Icon = expanded ? ChevronDown : ChevronRight;
  return (
    <button
      type="button"
      className="cr-detail-button"
      aria-expanded={expanded}
      aria-label={`${expanded ? 'Hide' : 'View'} details for ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon size={15} />
      Details
    </button>
  );
}

export function RecordLink({ record }) {
  return (
    <Link
      className="cr-record-link"
      to={
        record.kind === 'trip' ? `/auto-trips/${record.id}` : `/auto-trips/excursions/${record.id}`
      }
    >
      {record.kind === 'trip' ? 'Open trip' : 'Review movement'}
      <ArrowUpRight size={13} aria-hidden="true" />
    </Link>
  );
}
