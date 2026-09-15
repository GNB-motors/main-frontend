// Filter dropdown + portal action menu. Split from driversComponents.jsx (WS0.7); markup preserved.
import { createPortal } from 'react-dom';
import { X, ToggleRight, ToggleLeft, Trash2 } from 'lucide-react';
import { ROLE_LABELS } from './driverPresenters.js';

// --- Filter Dropdown Component ---
export const FilterDropdown = ({
  isOpen,
  onClose,
  filters,
  tempFilters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  isLoading,
  drivers = [],
}) => {
  // Canonical assignable roles are always offered (so FIELD_AGENT is selectable even
  // when none are loaded yet), plus any extra roles present in the fetched data.
  const getRoleOptions = () => {
    const values = new Set(['DRIVER', 'MANAGER', 'KAM', 'FIELD_AGENT']);
    drivers.forEach((driver) => {
      if (driver.is_superadmin) values.add('SUPER_ADMIN');
      else if (driver.role) values.add(driver.role);
    });
    return Array.from(values).map((value) => ({ value, label: ROLE_LABELS[value] || value }));
  };

  const filterOptions = {
    role: [{ value: '', label: 'All Roles' }, ...getRoleOptions()],
    vehicleAssignment: [
      { value: '', label: 'All' },
      { value: 'assigned', label: 'Has Vehicle' },
      { value: 'unassigned', label: 'No Vehicle' },
    ],
  };

  if (!isOpen) return null;

  return (
    <div className="drivers-filter-dropdown">
      <div className="drivers-filter-header">
        <h4>Filter Employees</h4>
        <button onClick={onClose} className="drivers-filter-close-btn">
          <X size={16} />
        </button>
      </div>

      <div className="drivers-filter-content">
        {/* Role Filter */}
        <div className="drivers-filter-group">
          <label className="drivers-filter-label">
            Role
            {filters.role && <span className="drivers-filter-indicator"></span>}
          </label>
          <select
            value={tempFilters.role}
            onChange={(e) => onFilterChange('role', e.target.value)}
            disabled={isLoading}
            className={filters.role ? 'drivers-filter-selected' : ''}
          >
            {filterOptions.role.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Assignment Filter */}
        <div className="drivers-filter-group">
          <label className="drivers-filter-label">
            Vehicle Assignment
            {filters.vehicleAssignment && <span className="drivers-filter-indicator"></span>}
          </label>
          <select
            value={tempFilters.vehicleAssignment}
            onChange={(e) => onFilterChange('vehicleAssignment', e.target.value)}
            disabled={isLoading}
            className={filters.vehicleAssignment ? 'drivers-filter-selected' : ''}
          >
            {filterOptions.vehicleAssignment.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="drivers-filter-actions">
        <NewButton
          variant="secondary"
          size="sm"
          text="Clear All"
          onClick={onClearFilters}
          disabled={isLoading}
        />
        <NewButton
          variant="primary"
          size="sm"
          text="Apply Filters"
          onClick={onApplyFilters}
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="drivers-filter-loader">
          <div className="drivers-spinner"></div>
          <span>Applying filters...</span>
        </div>
      )}
    </div>
  );
};

// --- Table Skeleton (shimmer) shown while the list is (re)loading ---
export const DriversTableSkeleton = ({ rows = 8 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={`skeleton-${i}`} className="drivers-table-row drivers-skeleton-row">
        <td>
          <div className="drivers-driver-name-cell">
            <div className="drivers-skeleton drivers-skeleton-avatar"></div>
            <div className="drivers-driver-info">
              <span className="drivers-skeleton drivers-skeleton-text drivers-skeleton-text-lg"></span>
              <span className="drivers-skeleton drivers-skeleton-text drivers-skeleton-text-sm"></span>
            </div>
          </div>
        </td>
        <td>
          <span className="drivers-skeleton drivers-skeleton-text"></span>
        </td>
        <td>
          <span className="drivers-skeleton drivers-skeleton-text"></span>
        </td>
        <td>
          <span className="drivers-skeleton drivers-skeleton-text"></span>
        </td>
        <td>
          <span className="drivers-skeleton drivers-skeleton-text drivers-skeleton-text-lg"></span>
        </td>
        <td>
          <span className="drivers-skeleton drivers-skeleton-pill"></span>
        </td>
      </tr>
    ))}
  </>
);

// --- Action Menu Component (portal-based to escape table stacking context) ---
export const ActionMenu = ({
  driver,
  onEdit,
  onDelete,
  onActivateHere,
  onDeactivate,
  position,
}) => {
  if (!position) return null;

  // Employees deactivated in this location (moved to another branch) can't be
  // edited/assigned here — the only action is to activate them back here.
  const isDeactivatedHere = driver.branchStatus === 'DEACTIVATED';
  // Legacy cross-org field agents carry a per-org membershipStatus and are
  // managed via membership, not branch-deactivated. New field agents are
  // branch-scoped employees and deactivate like a Driver/Manager.
  const isLegacyFieldAgent = driver.role === 'FIELD_AGENT' && driver.membershipStatus != null;
  // Owner/Super Admin are enterprise-level and never branch-deactivated.
  const canDeactivate =
    !isDeactivatedHere && !driver.is_superadmin && !driver.isOwner && !isLegacyFieldAgent;

  // Decide whether to open upward (if too close to the bottom of the viewport).
  // Height grows with the number of items so the upward flip is accurate.
  const itemCount = isDeactivatedHere
    ? 1
    : 1 /* edit */ + (canDeactivate ? 1 : 0) + (!driver.is_superadmin ? 1 : 0);
  const MENU_HEIGHT = 24 + itemCount * 34;
  const spaceBelow = window.innerHeight - position.bottom;
  const openUpward = spaceBelow < MENU_HEIGHT + 16;

  const style = {
    position: 'fixed',
    right: window.innerWidth - position.right,
    zIndex: 99999,
    ...(openUpward
      ? { bottom: window.innerHeight - position.top + 4 }
      : { top: position.bottom + 4 }),
  };

  return createPortal(
    <div className="drivers-action-menu" style={style}>
      {isDeactivatedHere ? (
        <button
          className="drivers-action-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            onActivateHere(driver);
          }}
        >
          <ToggleRight size={16} />
          <span>Mark as active</span>
        </button>
      ) : (
        <>
          <button
            className="drivers-action-menu-item"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(driver);
            }}
          >
            <Edit size={16} />
            <span>Edit</span>
          </button>
          {canDeactivate && (
            <button
              className="drivers-action-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                onDeactivate(driver);
              }}
            >
              <ToggleLeft size={16} />
              <span>Deactivate</span>
            </button>
          )}
          {!driver.is_superadmin && ( // Prevent deleting superadmin
            <>
              <div className="drivers-action-menu-divider"></div>
              <button
                className="drivers-action-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(driver);
                }}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  );
};
