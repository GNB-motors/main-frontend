import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import KhataLedgerService from '../KhataLedgerService';
import { getDriverName, getVehicleLabel } from '../utils';

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
      setForm({
        driverId: '',
        vehicleId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'ACTIVE',
        notes: '',
      });
    }
  }, [editingAssignment, isOpen]);

  if (!isOpen) return null;

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

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#4f46e5)] focus:border-[var(--primary-color,#4f46e5)]';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Driver <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClass}
                value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              >
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {getDriverName(d)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Vehicle <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClass}
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {getVehicleLabel(v)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Effective From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={inputClass}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Effective To</label>
              <input
                type="date"
                className={inputClass}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className={inputClass}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-color, #4f46e5)' }}
            >
              {saving ? 'Saving...' : editingAssignment ? 'Update' : 'Add Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentFormModal;
