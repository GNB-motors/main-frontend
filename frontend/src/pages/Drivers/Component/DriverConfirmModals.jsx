// Confirm dialogs: delete / deactivate / cross-branch move. Split from driversComponents.jsx (WS0.7); markup preserved.
import NewButton from '@/components/ui/NewButton';
import { getInitials } from './driverPresenters.js';

// --- Delete Driver Modal Component ---
export const DeleteDriverModal = ({
  isOpen,
  onClose,
  onConfirm,
  driver,
  isLoading: isDeleting,
}) => {
  if (!isOpen || !driver) return null;

  return (
    <div className="drivers-modal-overlay" onClick={onClose}>
      <div className="drivers-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="drivers-modal-header">
          <h4>Delete Employee</h4>
          <button onClick={onClose} className="drivers-close-btn">
            &times;
          </button>
        </div>

        <div className="drivers-delete-content">
          <div className="drivers-delete-warning">
            <div className="drivers-warning-icon">⚠️</div>
            <p>
              This action cannot be undone. The employee will be permanently removed from the
              system.
            </p>
          </div>

          <div className="drivers-delete-employee-info">
            <div className="drivers-driver-name-cell">
              <div className="drivers-driver-initials">{getInitials(driver.name)}</div>
              <div className="drivers-driver-info">
                <span className="drivers-driver-name">{driver.name}</span>
                <span className="drivers-driver-role">
                  {driver.is_superadmin ? 'Super Admin' : driver.role || 'Employee'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="drivers-modal-actions">
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
            text="Delete Employee"
            onClick={() => onConfirm(driver.id)}
            loading={isDeleting}
          />
        </div>
      </div>
    </div>
  );
};

// --- Deactivate Employee Modal ---
// Confirms turning an active employee off in their current branch (no move).
export const DeactivateDriverModal = ({ isOpen, onClose, onConfirm, driver, isLoading }) => {
  if (!isOpen || !driver) return null;

  return (
    <div className="drivers-modal-overlay" onClick={onClose}>
      <div className="drivers-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="drivers-modal-header">
          <h4>Deactivate Employee</h4>
          <button onClick={onClose} className="drivers-close-btn">
            &times;
          </button>
        </div>

        <div className="drivers-delete-content">
          <div className="drivers-delete-warning">
            <div className="drivers-warning-icon">⚠️</div>
            <p>
              This employee will be deactivated and won't be able to log in or be assigned work
              until you reactivate them. You can turn them back on anytime with “Mark as active”.
            </p>
          </div>

          <div className="drivers-delete-employee-info">
            <div className="drivers-driver-name-cell">
              <div className="drivers-driver-initials">{getInitials(driver.name)}</div>
              <div className="drivers-driver-info">
                <span className="drivers-driver-name">{driver.name}</span>
                <span className="drivers-driver-role">
                  {driver.is_superadmin ? 'Super Admin' : driver.role || 'Employee'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="drivers-modal-actions">
          <NewButton
            variant="secondary"
            size="md"
            type="button"
            text="Cancel"
            onClick={onClose}
            disabled={isLoading}
          />
          <NewButton
            variant="danger"
            size="md"
            type="button"
            text="Deactivate"
            onClick={() => onConfirm(driver)}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

// --- Move (Activate elsewhere) Modal ---
// Warns that activating an employee here will move them out of their current branch.
export const MoveEmployeeModal = ({ isOpen, onClose, onConfirm, driver, isLoading }) => {
  if (!isOpen || !driver) return null;

  const fromBranch = driver.currentBranchName || 'another location';

  return (
    <div className="drivers-modal-overlay" onClick={onClose}>
      <div className="drivers-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="drivers-modal-header">
          <h4>Move Employee Here</h4>
          <button onClick={onClose} className="drivers-close-btn">
            &times;
          </button>
        </div>

        <div className="drivers-delete-content">
          <div className="drivers-delete-warning">
            <div className="drivers-warning-icon">⚠️</div>
            <p>
              This employee is currently active in <strong>{fromBranch}</strong>. Activating them
              here will move them to this location and deactivate them in{' '}
              <strong>{fromBranch}</strong>. Their history there stays intact.
            </p>
          </div>

          <div className="drivers-delete-employee-info">
            <div className="drivers-driver-name-cell">
              <div className="drivers-driver-initials">{getInitials(driver.name)}</div>
              <div className="drivers-driver-info">
                <span className="drivers-driver-name">{driver.name}</span>
                <span className="drivers-driver-role">
                  {driver.is_superadmin ? 'Super Admin' : driver.role || 'Employee'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="drivers-modal-actions">
          <NewButton
            variant="secondary"
            size="md"
            type="button"
            text="Cancel"
            onClick={onClose}
            disabled={isLoading}
          />
          <NewButton
            variant="primary"
            size="md"
            type="button"
            text="Move Here"
            onClick={() => onConfirm(driver)}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

// --- Action Menu Component (portal-based to escape table stacking context) ---
