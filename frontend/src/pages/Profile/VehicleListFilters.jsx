import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import './VehicleListFilters.css';

export default function VehicleListFilters({
  manufacturers,
  manufacturer,
  onManufacturerChange,
  view,
  onViewChange,
  registryStatus,
  onRegistryStatusChange,
  account,
  accounts,
  onAccountChange,
  missingDocs,
  onMissingDocsChange,
  itemsPerPage,
  onItemsPerPageChange,
  metadataError,
  retryMetadata,
}) {
  const count =
    Number(Boolean(manufacturer)) +
    Number(view !== 'ALL') +
    Number(Boolean(registryStatus)) +
    Number(Boolean(account)) +
    Number(Boolean(missingDocs));
  return (
    <Popover>
      <PopoverTrigger className="vehicle-list-filter-trigger" aria-label="Vehicle filters">
        <SlidersHorizontal size={15} aria-hidden="true" />
        Filters
        {count > 0 && <span className="vehicle-list-filter-count">{count}</span>}
      </PopoverTrigger>
      <PopoverContent className="vehicle-list-filter-menu" align="end" collisionPadding={16}>
        <PopoverTitle>Vehicle filters</PopoverTitle>
        <div className="vehicle-list-filter-field">
          <label htmlFor="vehicle-list-view">Fleet view</label>
          <SearchableSelect
            id="vehicle-list-view"
            value={view}
            onChange={(event) => onViewChange(event.target.value)}
          >
            <option value="ALL">All vehicles</option>
            <option value="ACTIVE">Active Fleet</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="FLEETEDGE">Account linked</option>
            <option value="RELINK">Needs reconnect</option>
          </SearchableSelect>
          {view === 'ACTIVE' && <small>Vehicles active in the current location.</small>}
          {view === 'UNASSIGNED' && <small>Vehicles without an active driver assignment.</small>}
        </div>
        <div className="vehicle-list-filter-field">
          <label htmlFor="vehicle-table-manufacturer">Manufacturer</label>
          <SearchableSelect
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
          </SearchableSelect>
        </div>
        <div className="vehicle-list-filter-field">
          <label htmlFor="vehicle-registry-status">Vehicle status</label>
          <SearchableSelect
            id="vehicle-registry-status"
            value={registryStatus}
            onChange={(e) => onRegistryStatusChange(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On trip</option>
            <option value="MAINTENANCE">Maintenance</option>
          </SearchableSelect>
        </div>
        <div className="vehicle-list-filter-field">
          <label htmlFor="vehicle-source-account">Telematics account</label>
          <SearchableSelect
            id="vehicle-source-account"
            value={account}
            onChange={(e) => onAccountChange(e.target.value)}
          >
            <option value="">All accounts</option>
            <option value="unlinked">No linked account</option>
            {accounts.map((entry) => (
              <option key={entry._id} value={entry._id}>
                {entry.friendlyName || entry.externalAccountId || entry._id}
              </option>
            ))}
          </SearchableSelect>
        </div>
        <label>
          <input
            type="checkbox"
            aria-label="Missing required documents"
            checked={missingDocs}
            onChange={(e) => onMissingDocsChange(e.target.checked)}
          />
          Missing required documents
        </label>
        <div className="vehicle-list-filter-field">
          <label htmlFor="vehicle-list-page-size">Vehicles per page</label>
          <SearchableSelect
            id="vehicle-list-page-size"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </SearchableSelect>
        </div>
        {metadataError && (
          <button type="button" className="vehicle-list-filter-reset" onClick={retryMetadata}>
            Retry manufacturers
          </button>
        )}
        {count > 0 && (
          <button
            type="button"
            className="vehicle-list-filter-reset"
            onClick={() => {
              onManufacturerChange('');
              onViewChange('ALL');
              onRegistryStatusChange('');
              onAccountChange('');
              onMissingDocsChange(false);
            }}
          >
            Reset filter
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
