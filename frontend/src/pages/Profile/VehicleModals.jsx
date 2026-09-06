// Presentational pieces for the Vehicles page: the delete-confirmation modal,
// the per-row actions menu, and the portal dropdown that hosts it.
// Extracted from VehiclesPage.jsx (WS0.7) — markup preserved byte-identically.
import ReactDOM from 'react-dom';
import React from 'react';
import { Edit, Trash2, MoreHorizontal, ToggleRight } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';

// --- Delete Vehicle Modal Component ---
export const DeleteVehicleModal = ({
  isOpen,
  onClose,
  onConfirm,
  vehicle,
  isLoading: isDeleting,
}) => {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="vehicle-delete-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="vehicle-delete-modal-content"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vehicle-delete-modal-header">
          <h4>Delete Vehicle</h4>
          <button onClick={onClose} className="vehicle-delete-modal-close-btn">
            &times;
          </button>
        </div>

        <div className="vehicle-delete-content">
          <div className="vehicle-delete-warning">
            <div className="vehicle-delete-warning-icon">⚠️</div>
            <p>
              This action cannot be undone. The vehicle will be permanently removed from the system.
            </p>
          </div>

          <div className="vehicle-delete-vehicle-info">
            <div className="vehicle-delete-info">
              <div className="vehicle-delete-details">
                <span className="vehicle-delete-registration">{vehicle.registration_no}</span>
                <span className="vehicle-delete-type">
                  {vehicle.vehicle_type || 'Unknown Type'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="vehicle-delete-modal-actions">
          <NewButton
            variant="secondary"
            size="md"
            type="button"
            text="Cancel"
            onClick={onClose}
            disabled={isDeleting}
          />
          <NewButton
            variant="danger"
            size="md"
            type="button"
            text="Delete Vehicle"
            onClick={() => onConfirm(vehicle.id)}
            loading={isDeleting}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * VehicleActionMenu
 * Stateless wrapper that owns the triggerRef for the PortalDropdown.
 * Keeps the portal trigger and its ref co-located.
 */
export function VehicleActionMenu({
  vehicle,
  isOpen,
  onToggle,
  onClose,
  isSubmitting,
  onEdit,
  onDelete,
  onActivateHere,
}) {
  const btnRef = React.useRef(null);
  // A vehicle deactivated here (moved to another location) can't be edited here —
  // the only action is to activate it back into this location.
  const isDeactivatedHere = vehicle?.branchStatus === 'DEACTIVATED';

  return (
    <div className="vehicle-action-menu-container">
      <button
        ref={btnRef}
        className="vehicle-actions-menu-btn"
        onClick={onToggle}
        disabled={isSubmitting}
        title="Actions"
      >
        <MoreHorizontal size={18} />
      </button>
      <PortalDropdown triggerRef={btnRef} isOpen={isOpen} onClose={onClose}>
        {isDeactivatedHere ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
              onActivateHere();
            }}
            disabled={isSubmitting}
          >
            <ToggleRight size={16} /> Mark as active
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                onEdit();
              }}
              disabled={isSubmitting}
            >
              <Edit size={16} /> Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                onDelete();
              }}
              disabled={isSubmitting}
            >
              <Trash2 size={16} /> Remove
            </button>
          </>
        )}
      </PortalDropdown>
    </div>
  );
}

/**
 * PortalDropdown
 * Renders the actions menu via ReactDOM.createPortal into document.body.
 *
 * WHY: The vehicles table uses `overflow-y: auto` on tbody and `overflow: hidden`
 * on td. Any position:absolute child is clipped to those scroll containers
 * regardless of z-index. Portaling to body bypasses all overflow constraints.
 *
 * The menu is positioned by reading the trigger button's getBoundingClientRect()
 * and converting to fixed-position coordinates.
 */
function PortalDropdown({ triggerRef, isOpen, onClose, children }) {
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4, // 4px gap below button
        left: rect.right + window.scrollX, // right-align to button edge
      });
    };

    updatePosition();

    // Reposition on scroll or resize so it doesn't detach
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, triggerRef]);

  // Close when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="vehicle-actions-menu"
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-100%)', // right-align: shift left by own width
        zIndex: 99999,
        margin: 0,
      }}
      // Stop clicks inside the menu from bubbling to document (closing it)
      onMouseDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      {children}
    </div>,
    document.body,
  );
}
