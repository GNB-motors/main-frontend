import { X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { getVehicleList } from '@/services/vehicleListService';
import DriverVehicleAssignmentService from '@/services/DriverVehicleAssignmentService';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { driverOptions } from './intelligenceModel';

/**
 * IntelligenceFilters — one truck, or one driver, or the whole fleet.
 *
 * The choice is kept in the URL, so a link to a filtered page opens the same
 * way. When a filter is on, a chip says what is being looked at and how to
 * let it go again.
 */
export default function IntelligenceFilters({
  vehicle = '',
  driver = '',
  onChange,
  showVehicle = true,
  showDriver = true,
}) {
  const { data: vehicles } = useApi((signal) => getVehicleList({ signal }), [], {
    enabled: showVehicle,
  });
  const { data: assignments } = useApi(
    (signal) => DriverVehicleAssignmentService.getAllActiveAssignments({ signal }),
    [],
    { enabled: showDriver },
  );

  const drivers = driverOptions(assignments ?? []);
  const vehicleOptions = (vehicles ?? [])
    .map((row) => row?.registrationNumber)
    .filter(Boolean)
    .sort();

  const driverName = drivers.find((entry) => entry.id === driver)?.name ?? driver;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {showVehicle ? (
          <div className="w-full sm:w-[260px]">
            <SearchableSelect
              value={vehicle}
              aria-label="Filter by truck"
              placeholder="All trucks"
              className="intelligence-filter-select"
              onValueChange={(value) => onChange({ vehicle: value, driver })}
            >
              <option value="">All trucks</option>
              {vehicleOptions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </SearchableSelect>
          </div>
        ) : null}
        {showDriver ? (
          <div className="w-full sm:w-[260px]">
            <SearchableSelect
              value={driver}
              aria-label="Filter by driver"
              placeholder="All drivers"
              className="intelligence-filter-select"
              onValueChange={(value) => onChange({ vehicle, driver: value })}
            >
              <option value="">All drivers</option>
              {drivers.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </SearchableSelect>
          </div>
        ) : null}
      </div>

      {(showVehicle && vehicle) || (showDriver && driver) ? (
        <div className="flex flex-wrap items-center gap-2">
          {showVehicle && vehicle ? (
            <button
              type="button"
              onClick={() => onChange({ vehicle: '', driver })}
              aria-label={`Remove truck filter ${vehicle}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--rd-line)] bg-[var(--rd-card-2)] px-2.5 py-1 text-[12px] font-medium text-[var(--rd-ink-2)] hover:border-[var(--rd-line-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
            >
              {`Truck ${vehicle}`}
              <X size={12} aria-hidden="true" />
            </button>
          ) : null}
          {showDriver && driver ? (
            <button
              type="button"
              onClick={() => onChange({ vehicle, driver: '' })}
              aria-label={`Remove driver filter ${driverName}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--rd-line)] bg-[var(--rd-card-2)] px-2.5 py-1 text-[12px] font-medium text-[var(--rd-ink-2)] hover:border-[var(--rd-line-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
            >
              {`Driver ${driverName}`}
              <X size={12} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
