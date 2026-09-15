import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

/** Edit / delete-confirm / view-proof-image modals for the AdBlue tracking page. */
const AdBlueTrackingModals = (props) => {
  const {
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
  } = props;

  return (
    <>
      {editingLog &&
        createPortal(
          <div className="refuel-modal-overlay" onClick={onEditClose}>
            <div
              className="refuel-modal refuel-edit-modal"
              style={{ maxWidth: 480 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="refuel-modal-header">
                <h2>Edit AdBlue Entry</h2>
                <button type="button" className="refuel-modal-close" onClick={onEditClose}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={onEditSubmit}>
                <div className="refuel-modal-body">
                  <div className="refuel-form-row">
                    <div className="form-group">
                      <label>Litres *</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.litres}
                        onChange={(e) => setEditForm({ ...editForm, litres: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Amount *</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Place</label>
                    <input
                      type="text"
                      value={editForm.place}
                      onChange={(e) => setEditForm({ ...editForm, place: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="refuel-modal-footer">
                  <button type="button" className="refuel-btn-secondary" onClick={onEditClose}>
                    Cancel
                  </button>
                  <button type="submit" className="refuel-btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {deletingLog &&
        createPortal(
          <div className="refuel-modal-overlay" onClick={onDeleteClose}>
            <div
              className="refuel-modal"
              style={{ maxWidth: 420 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="refuel-modal-header">
                <h2>Delete AdBlue Entry</h2>
                <button type="button" className="refuel-modal-close" onClick={onDeleteClose}>
                  <X size={20} />
                </button>
              </div>
              <div className="refuel-modal-body">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={22} color="#dc2626" />
                  <p style={{ margin: 0, color: '#475569' }}>
                    Delete AdBlue entry for <strong>{deletingLog.vehicleNo}</strong>? This cannot be
                    undone.
                  </p>
                </div>
              </div>
              <div className="refuel-modal-footer">
                <button type="button" className="refuel-btn-secondary" onClick={onDeleteClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="refuel-btn-danger"
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

      {viewImageUrl &&
        createPortal(
          <div className="refuel-modal-overlay" onClick={onViewImageClose}>
            <div
              className="refuel-modal"
              style={{ maxWidth: 720 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="refuel-modal-header">
                <h2>AdBlue Proof</h2>
                <button type="button" className="refuel-modal-close" onClick={onViewImageClose}>
                  <X size={20} />
                </button>
              </div>
              <div className="refuel-modal-body" style={{ textAlign: 'center' }}>
                <img
                  src={viewImageUrl}
                  alt="AdBlue receipt"
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default AdBlueTrackingModals;
