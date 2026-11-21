import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { useState, useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import KhataLedgerService from '../KhataLedgerService';
import { getDriverName, getVehicleLabel } from '../utils';
import '../KhataLedger.css';
import './khataTrips.css';

const EMPTY_FORM = {
  driverId: '',
  vehicleId: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  notes: '',
};

const AssignmentFormModal = ({
  isOpen,
  onClose,
  onSaved,
  editingAssignment,
  vehicles = [],
  drivers = [],
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const uid = useId();

  useEffect(() => {
    if (editingAssignment) {
      setForm({
        driverId: editingAssignment.driverId?._id || editingAssignment.driverId || '',
        vehicleId: editingAssignment.vehicleId?._id || editingAssignment.vehicleId || '',
        startDate: editingAssignment.startDate
          ? new Date(editingAssignment.startDate).toISOString().split('T')[0]
          : '',
        endDate: editingAssignment.endDate
          ? new Date(editingAssignment.endDate).toISOString().split('T')[0]
          : '',
        status: editingAssignment.status || 'ACTIVE',
        notes: editingAssignment.notes || '',
      });
    } else {
      setForm({ ...EMPTY_FORM, startDate: new Date().toISOString().split('T')[0] });
    }
  }, [editingAssignment, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.driverId || !form.vehicleId || !form.startDate) {
      toast.error('Driver, vehicle, and start date are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        driverId: form.driverId,
        vehicleId: form.vehicleId,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };
      if (editingAssignment) {
        await KhataLedgerService.updateAssignment(editingAssignment._id, payload);
        toast.success('Assignment updated');
      } else {
        await KhataLedgerService.createAssignment(payload);
        toast.success('Assignment created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  // An assignment being edited may point at a driver or vehicle outside the
  // loaded lists; keep it selectable so the form doesn't blank it.
  const editDriver =
    editingAssignment?.driverId && typeof editingAssignment.driverId === 'object'
      ? editingAssignment.driverId
      : null;
  const editVehicle =
    editingAssignment?.vehicleId && typeof editingAssignment.vehicleId === 'object'
      ? editingAssignment.vehicleId
      : null;
  const driverOptions =
    editDriver && !drivers.some((d) => d._id === editDriver._id)
      ? [editDriver, ...drivers]
      : drivers;
  const vehicleOptions =
    editVehicle && !vehicles.some((v) => v._id === editVehicle._id)
      ? [editVehicle, ...vehicles]
      : vehicles;

  return (
    <Dialog
      open={Boolean(isOpen)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="khata-dialog khata-dialog--form">
        <div className="khata-dialog-head">
          <div>
            <DialogTitle className="khata-dialog-title">
              {editingAssignment ? 'Edit assignment' : 'Add assignment'}
            </DialogTitle>
            <DialogDescription className="khata-dialog-desc">
              Which driver drives which vehicle, and from when.
            </DialogDescription>
          </div>
          <button type="button" className="khata-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="khata-dialog-body">
            <div className="khata-dialog-grid">
              <div className="khata-field">
                <label htmlFor={`${uid}-driver`}>
                  Driver <span className="khata-required">*</span>
                </label>
                <SearchableSelect
                  id={`${uid}-driver`}
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                >
                  <option value="">Select driver</option>
                  {driverOptions.map((d) => (
                    <option key={d._id} value={d._id}>
                      {getDriverName(d)}
                    </option>
                  ))}
                </SearchableSelect>
              </div>
              <div className="khata-field">
                <label htmlFor={`${uid}-vehicle`}>
                  Vehicle <span className="khata-required">*</span>
                </label>
                <SearchableSelect
                  id={`${uid}-vehicle`}
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                >
                  <option value="">Select vehicle</option>
                  {vehicleOptions.map((v) => (
                    <option key={v._id} value={v._id}>
                      {getVehicleLabel(v)}
                    </option>
                  ))}
                </SearchableSelect>
              </div>
            </div>

            <div className="khata-dialog-grid">
              <div className="khata-field">
                <label htmlFor={`${uid}-from`}>
                  Effective from <span className="khata-required">*</span>
                </label>
                <input
                  id={`${uid}-from`}
                  aria-label="Effective from"
                  type="date"
                  className="khata-input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="khata-field">
                <label htmlFor={`${uid}-to`}>Effective to</label>
                <input
                  id={`${uid}-to`}
                  aria-label="Effective to"
                  type="date"
                  className="khata-input"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="khata-field">
              <label htmlFor={`${uid}-status`}>Status</label>
              <SearchableSelect
                id={`${uid}-status`}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </SearchableSelect>
            </div>

            <div className="khata-field">
              <label htmlFor={`${uid}-notes`}>Notes</label>
              <textarea
                id={`${uid}-notes`}
                aria-label="Notes"
                className="khata-input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional"
                rows={2}
                maxLength={500}
              />
            </div>

            {!drivers.length || !vehicles.length ? (
              <p className="khata-hint">
                {!drivers.length && !vehicles.length
                  ? 'No drivers or vehicles loaded yet.'
                  : !drivers.length
                    ? 'No drivers loaded yet.'
                    : 'No vehicles loaded yet.'}{' '}
                Add them under Drivers and Vehicles first.
              </p>
            ) : null}
          </div>

          <div className="khata-dialog-foot">
            <button type="button" className="khata-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="khata-btn khata-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : editingAssignment ? 'Save changes' : 'Add assignment'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentFormModal;
