import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { FUEL_TYPES, FILLING_TYPES } from './refuelLogsReportUtils';

export const RefuelLogEditModal = ({
  editingLog,
  editForm,
  setEditForm,
  onClose,
  onSubmit,
  submitting,
}) => {
  if (!editingLog) return null;

  return createPortal(
    <div className="refuel-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="refuel-modal refuel-edit-modal"
        role="presentation"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="refuel-modal-header">
          <h2>Edit Fuel Log</h2>
          <button
            type="button"
            className="refuel-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="refuel-modal-body">
            <div className="refuel-form-row">
              <div className="form-group">
                <label htmlFor="refuel-edit-fuel-type">Fuel Type</label>
                <select
                  id="refuel-edit-fuel-type"
                  value={editForm.fuelType}
                  onChange={(e) => setEditForm({ ...editForm, fuelType: e.target.value })}
                  required
                >
                  {FUEL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="refuel-edit-filling-type">Filling Type</label>
                <select
                  id="refuel-edit-filling-type"
                  value={editForm.fillingType}
                  onChange={(e) => setEditForm({ ...editForm, fillingType: e.target.value })}
                  required
                >
                  {FILLING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="refuel-form-row">
              <div className="form-group">
                <label htmlFor="refuel-edit-litres">Quantity (Litres)</label>
                <input
                  id="refuel-edit-litres"
                  aria-label="Quantity (Litres)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.litres}
                  onChange={(e) => setEditForm({ ...editForm, litres: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="refuel-edit-rate">Rate per Litre</label>
                <input
                  id="refuel-edit-rate"
                  aria-label="Rate per Litre"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.rate}
                  onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                />
              </div>
            </div>
            <div className="refuel-form-row">
              <div className="form-group">
                <label htmlFor="refuel-edit-odometer">Odometer Reading (km)</label>
                <input
                  id="refuel-edit-odometer"
                  aria-label="Odometer Reading (km)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editForm.odometerReading}
                  onChange={(e) => setEditForm({ ...editForm, odometerReading: e.target.value })}
                />
                <span className="refuel-form-hint">Optional — FleetEdge can backfill later</span>
              </div>
              <div className="form-group">
                <label htmlFor="refuel-edit-time">Refuel Time</label>
                <input
                  id="refuel-edit-time"
                  aria-label="Refuel Time"
                  type="datetime-local"
                  value={editForm.refuelTime}
                  onChange={(e) => setEditForm({ ...editForm, refuelTime: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="refuel-edit-location">Location</label>
              <input
                id="refuel-edit-location"
                aria-label="Location"
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>
          </div>
          <div className="refuel-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export const RefuelLogDeleteModal = ({ deletingLog, onClose, onConfirm, submitting }) => {
  if (!deletingLog) return null;

  return createPortal(
    <div className="refuel-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="refuel-modal refuel-delete-modal"
        role="presentation"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="refuel-modal-header">
          <h2>Delete Fuel Log</h2>
          <button
            type="button"
            className="refuel-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        <div className="refuel-modal-body">
          <div className="refuel-delete-warning">
            <AlertTriangle size={40} color="#dc2626" />
            <p>Are you sure you want to delete this fuel log?</p>
            <p className="refuel-delete-subtext">
              This will rebuild the mileage intervals for vehicle{' '}
              <strong>{deletingLog.vehicleNo}</strong>. Any previously computed FleetEdge
              comparisons will be reset to pending.
            </p>
          </div>
        </div>
        <div className="refuel-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
