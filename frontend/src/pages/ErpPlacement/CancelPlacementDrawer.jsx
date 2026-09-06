import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import PlacementService from './PlacementService';

/**
 * Reasons the server accepts, with what each one means for the tanker.
 *
 * This is not an undo. Cancelling a placement releases the quantity back to the
 * delivery order and, when the tanker has already moved, leaves empty running
 * that has to be budgeted against its next loaded trip — so the server requires
 * a reason and a remark. Labelling it "Undo" would promise a free reversal and
 * then present a three-field form.
 */
const REASONS = [
  {
    value: 'NO_LOAD',
    label: 'No load',
    blurb: 'The order fell through and the tanker never loaded.',
  },
  {
    value: 'LOADING_POINT_CHANGE',
    label: 'Loading point changed',
    blurb: 'The tanker has to be sent to a different loading point.',
  },
  {
    value: 'REPOSITION',
    label: 'Repositioning',
    blurb: 'The tanker is being moved for another order.',
  },
];

const CancelPlacementDrawer = ({ placement, qtyUnit = '', onClose, onCancelled }) => {
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [emptyBudget, setEmptyBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = Boolean(reason && remarks.trim().length >= 3);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await PlacementService.deletePlacement(placement._id, {
        reason,
        remarks: remarks.trim(),
        emptyBudgetAmount: Number(emptyBudget) || 0,
      });
      toast.success(`${placement.placementNumber} cancelled — quantity released back to the order`);
      onCancelled();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const vehicle = placement.vehicleId?.registrationNumber || placement.hireVehicleNumber || '—';

  return (
    <ErpDrawer
      isOpen
      onClose={onClose}
      title="Cancel placement"
      subtitle={`${placement.placementNumber} · ${vehicle}`}
      maxWidth="520px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Keep it
          </button>
          <button
            type="submit"
            form="cancel-placement-form"
            className="btn btn-danger"
            disabled={saving || !valid}
          >
            {saving ? 'Cancelling…' : 'Cancel placement'}
          </button>
        </>
      }
    >
      <div className="erp-callout warning">
        <AlertTriangle size={16} />
        <span>
          {placement.plannedQty} {qtyUnit} goes back onto the delivery order and {vehicle} becomes
          available again.
        </span>
      </div>

      <form id="cancel-placement-form" onSubmit={handleSubmit}>
        <div className="erp-form-grid">
          <div className="erp-field full">
            <label>
              Why <span className="required">*</span>
            </label>
            <div className="erp-outcomes">
              {REASONS.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  aria-pressed={reason === r.value}
                  className={`erp-outcome ${reason === r.value ? 'selected' : ''}`}
                  onClick={() => setReason(r.value)}
                >
                  {r.label}
                  <small>{r.blurb}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="erp-field full">
            <label htmlFor="cancel-remarks">
              Remarks <span className="required">*</span>
            </label>
            <textarea
              id="cancel-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="What happened?"
              required
            />
          </div>

          {reason && reason !== 'NO_LOAD' && (
            <div className="erp-field full">
              <label htmlFor="cancel-empty">Empty running to carry forward (₹)</label>
              <input
                id="cancel-empty"
                type="number"
                min="0"
                step="0.01"
                value={emptyBudget}
                onChange={(e) => setEmptyBudget(e.target.value)}
                placeholder="0"
              />
              {/* Only meaningful once the tanker has moved: NO_LOAD means it
                  never left, so there is no empty leg to recover. */}
              <span className="erp-field-hint">
                Recovered against this tanker&apos;s next loaded trip. Leave blank if it has not
                moved.
              </span>
            </div>
          )}
        </div>
      </form>
    </ErpDrawer>
  );
};

export default CancelPlacementDrawer;
