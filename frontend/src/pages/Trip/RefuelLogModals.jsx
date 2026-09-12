/**
 * RefuelLogModals — the page-specific modals for RefuelLogsPage (WS0.7
 * component split): edit fuel log, delete confirmation, and bill image
 * viewer. Markup and behaviour are unchanged from the monolithic page;
 * all state and handlers are owned by the parent and passed in.
 */

import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

const FUEL_TYPES = ['DIESEL', 'ADBLUE'];
const FILLING_TYPES = ['PARTIAL', 'FULL_TANK'];

const RefuelLogModals = ({
  editingLog,
  editForm,
  setEditForm,
  submitting,
  onEditClose,
  onEditSubmit,
  deletingLog,
  onDeleteClose,
  onDeleteConfirm,
  viewImageUrl,
  onViewImageClose,
}) => (
  <>
    {/* Edit Modal */}
    {editingLog &&
      createPortal(
        <div className="refuel-modal-overlay" role="presentation" onClick={onEditClose}>
          <div
            className="refuel-modal refuel-edit-modal"
            role="presentation"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="refuel-modal-header">
              <h2>Edit Fuel Log</h2>
              <button type="button" className="refuel-modal-close" onClick={onEditClose}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={onEditSubmit}>
              <div className="refuel-modal-body">
                <div className="refuel-form-row">
                  <div className="form-group">
                    <label>Fuel Type</label>
                    <select
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
                    <label>Filling Type</label>
                    <select
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
                    <label>Quantity (Litres)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.litres}
                      onChange={(e) => setEditForm({ ...editForm, litres: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rate per Litre</label>
                    <input
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
                    <label>Odometer Reading (km)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editForm.odometerReading}
                      onChange={(e) =>
                        setEditForm({ ...editForm, odometerReading: e.target.value })
                      }
                    />
                    <span className="refuel-form-hint">
                      Optional — FleetEdge can backfill later
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Refuel Time</label>
                    <input
                      type="datetime-local"
                      value={editForm.refuelTime}
                      onChange={(e) => setEditForm({ ...editForm, refuelTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
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
                  onClick={onEditClose}
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
      )}

    {/* Delete Confirmation Modal */}
    {deletingLog &&
      createPortal(
        <div className="refuel-modal-overlay" role="presentation" onClick={onDeleteClose}>
          <div
            className="refuel-modal refuel-delete-modal"
            role="presentation"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="refuel-modal-header">
              <h2>Delete Fuel Log</h2>
              <button type="button" className="refuel-modal-close" onClick={onDeleteClose}>
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
                onClick={onDeleteClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

    {/* View Image Modal */}
    {viewImageUrl &&
      createPortal(
        <div
          className="refuel-modal-overlay"
          role="presentation"
          onClick={onViewImageClose}
          style={{ zIndex: 9999 }}
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '80vw',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={onViewImageClose}
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                color: '#4b5563',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: 10,
              }}
            >
              <X size={18} />
            </button>
            <img
              src={viewImageUrl}
              alt="Fuel Bill"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '16px',
                background: 'white',
                padding: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                display: 'block',
              }}
            />
          </div>
        </div>,
        document.body,
      )}
  </>
);

export default RefuelLogModals;
