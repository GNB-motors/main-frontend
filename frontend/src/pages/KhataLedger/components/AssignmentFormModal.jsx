import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SelectField from './SelectField';
import KhataLedgerService from '../KhataLedgerService';
import { getDriverName, getVehicleLabel, toDateInputValue } from '../utils';

const fieldClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-foreground">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/**
 * Six fields and a yes/no — small enough to stay a dialog while the fuel and
 * expense forms moved to their own routes.
 */
const AssignmentFormModal = ({
  isOpen,
  onClose,
  onSaved,
  editingAssignment,
  vehicles = [],
  drivers = [],
}) => {
  const [form, setForm] = useState({
    driverId: '',
    vehicleId: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingAssignment) {
      setForm({
        driverId: editingAssignment.driverId?._id || editingAssignment.driverId || '',
        vehicleId: editingAssignment.vehicleId?._id || editingAssignment.vehicleId || '',
        startDate: toDateInputValue(editingAssignment.startDate),
        endDate: toDateInputValue(editingAssignment.endDate),
        status: editingAssignment.status || 'ACTIVE',
        notes: editingAssignment.notes || '',
      });
    } else {
      setForm({
        driverId: '',
        vehicleId: '',
        startDate: toDateInputValue(new Date()),
        endDate: '',
        status: 'ACTIVE',
        notes: '',
      });
    }
  }, [editingAssignment, isOpen]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.driverId || !form.vehicleId || !form.startDate) {
      toast.error('Pick a driver, a truck, and the date the assignment starts');
      return;
    }
    if (form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('The end date cannot be before the start date');
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
        toast.success('Assignment added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not save that assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingAssignment ? 'Edit assignment' : 'Add assignment'}</DialogTitle>
          <DialogDescription>
            Links a driver to a truck for a period, so entries get attributed to both.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Driver"
                required
                inDialog
                value={form.driverId}
                onChange={(v) => set('driverId', v)}
                placeholder="Select a driver"
                options={drivers.map((d) => ({ value: d._id, label: getDriverName(d) }))}
              />

              <SelectField
                label="Truck"
                required
                inDialog
                value={form.vehicleId}
                onChange={(v) => set('vehicleId', v)}
                placeholder="Select a truck"
                options={vehicles.map((v) => ({ value: v._id, label: getVehicleLabel(v) }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Starts" required>
                <input
                  type="date"
                  className={`${fieldClass} num`}
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                />
              </Field>

              <Field label="Ends" hint="Leave blank while it is ongoing.">
                <input
                  type="date"
                  className={`${fieldClass} num`}
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </Field>
            </div>

            <SelectField
              label="Status"
              inDialog
              value={form.status}
              onChange={(v) => set('status', v || 'ACTIVE')}
              placeholder="Active"
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />

            <Field label="Notes">
              <textarea
                className={`${fieldClass} h-auto py-2`}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Why this pairing, or anything worth remembering…"
                rows={2}
                maxLength={500}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
            >
              {saving ? 'Saving…' : editingAssignment ? 'Save changes' : 'Add assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentFormModal;
