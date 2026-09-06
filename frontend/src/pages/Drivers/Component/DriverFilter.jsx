// Filter button + FilterDropdown for the Drivers page (role / vehicle-assignment).
// Extracted from DriversPage.jsx (WS0.7); markup preserved.
import { Filter } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';
import { FilterDropdown } from './DriverMenuExtras.jsx';

export default function DriverFilter({
  isOpen,
  onToggle,
  onClose,
  filters,
  tempFilters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  activeFilterCount,
  drivers,
}) {
  return (
    <div className="drivers-filter-container">
      <NewButton
        variant="secondary"
        size="lg"
        iconOnly
        selected={activeFilterCount > 0}
        aria-label="Filter employees"
        onClick={onToggle}
      >
        <Filter size={14} />
        {activeFilterCount > 0 && (
          <span className="drivers-filter-count-badge">{activeFilterCount}</span>
        )}
      </NewButton>

      <FilterDropdown
        isOpen={isOpen}
        onClose={onClose}
        filters={filters}
        tempFilters={tempFilters}
        onFilterChange={onFilterChange}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
        isLoading={false}
        drivers={drivers}
      />
    </div>
  );
}
