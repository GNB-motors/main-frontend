import { SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import './VehicleListFilters.css';

export default function VehicleListFilters({
  manufacturers,
  manufacturer,
  onManufacturerChange,
  view,
  onViewChange,
  metadataError,
  retryMetadata,
}) {
  return (
    <Popover>
      <PopoverTrigger className="vehicle-list-filter-trigger" aria-label="Vehicle filters">
        <SlidersHorizontal size={15} aria-hidden="true" />
        Filters
        {(manufacturer || view !== 'ALL') && (
          <span className="vehicle-list-filter-count">
            {Number(Boolean(manufacturer)) + Number(view !== 'ALL')}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="vehicle-list-filter-menu" align="end" collisionPadding={16}>
        <PopoverTitle>Vehicle filters</PopoverTitle>
        <div className="vehicle-list-filter-field">
          <label htmlFor="vehicle-list-view">Fleet view</label>
          <select
            id="vehicle-list-view"
            value={view}
            onChange={(event) => onViewChange(event.target.value)}
          >
            <option value="ALL">All vehicles</option>
            <option value="ACTIVE">Active Fleet</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="FLEETEDGE">Account linked</option>
            <option value="RELINK">Needs reconnect</option>
          </select>
          {view === 'ACTIVE' && <small>Vehicles active in the current location.</small>}
          {view === 'UNASSIGNED' && <small>Vehicles without an active driver assignment.</small>}
        </div>
        <div className="vehicle-list-filter-field">
          <label htmlFor="vehicle-table-manufacturer">Manufacturer</label>
          <select
            id="vehicle-table-manufacturer"
            value={manufacturer}
            onChange={(event) => onManufacturerChange(event.target.value)}
          >
            <option value="">All manufacturers</option>
            {manufacturers.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {metadataError && (
          <button type="button" className="vehicle-list-filter-reset" onClick={retryMetadata}>
            Retry manufacturers
          </button>
        )}
        {(manufacturer || view !== 'ALL') && (
          <button
            type="button"
            className="vehicle-list-filter-reset"
            onClick={() => {
              onManufacturerChange('');
              onViewChange('ALL');
            }}
          >
            Reset filter
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
