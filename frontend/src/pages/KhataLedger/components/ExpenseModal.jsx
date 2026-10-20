import React, { useState, useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import DriverVehicleAssignmentService from '../../../services/DriverVehicleAssignmentService';
import { CATEGORIES, CATEGORY_LABELS, getDriverName, getVehicleLabel } from '../utils';
import logger from '../../../utils/logger';

const ExpenseModal = ({ isOpen, onClose, onSave, editingExpense, vehicles, drivers }) => {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'MISCELLANEOUS',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    tripId: '',
    vehicleId: '',
    driverId: '',
  });
  const [saving, setSaving] = useState(false);
  const [driverAutoFilled, setDriverAutoFilled] = useState(false);
  const [driverTouchedByUser, setDriverTouchedByUser] = useState(false);
  const uid = useId();

  useEffect(() => {
    setDriverAutoFilled(false);
    setDriverTouchedByUser(false);
    if (editingExpense) {
      setForm({
        title: editingExpense.title || '',
        amount: editingExpense.amount || '',
        category: editingExpense.category || 'MISCELLANEOUS',
        description: editingExpense.description || '',
        expenseDate: editingExpense.expenseDate
          ? new Date(editingExpense.expenseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        tripId: editingExpense.tripId || '',
        vehicleId: editingExpense.vehicle?._id || editingExpense.vehicleId || '',
        driverId: editingExpense.driver?._id || editingExpense.driverId || '',
      });
    } else {
      setForm({
        title: '',
        amount: '',
        category: 'MISCELLANEOUS',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        tripId: '',
        vehicleId: '',
        driverId: '',
      });
    }
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  /**
   * Suggest the vehicle's currently-assigned driver when a vehicle is picked.
   * Never overrides a driver already hand-picked in this form, and never
   * writes anything back — a suggestion for this one expense, not a sync.
   */
  const handleVehicleChange = async (vehicleId) => {
    setForm((prev) => ({ ...prev, vehicleId }));
    if (!vehicleId || driverTouchedByUser) return;
    try {
      const assignment = await DriverVehicleAssignmentService.getActiveAssignment({
        vehicleId,
        activeOn: form.expenseDate,
      });
      if (!assignment) return;
      const suggestedId = DriverVehicleAssignmentService.idOf(assignment.driverId);
      if (drivers.some((d) => d._id === suggestedId)) {
        setForm((prev) => ({ ...prev, driverId: suggestedId }));
        setDriverAutoFilled(true);
      }
    } catch (err) {
      if (err?.response?.status !== 404)
        logger.warn('AllTransactionsTab', 'Failed to resolve active assignment', err);
    }
  };

  const handleDriverChange = (driverId) => {
    setForm((prev) => ({ ...prev, driverId }));
    setDriverTouchedByUser(true);
    setDriverAutoFilled(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) {
      toast.error('Title and amount are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        description: form.description.trim() || undefined,
        expenseDate: new Date(form.expenseDate).toISOString(),
        tripId: form.tripId || null,
        vehicleId: form.vehicleId || null,
        driverId: form.driverId || null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to save expense');
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
            {editingExpense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={`${uid}-title`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id={`${uid}-title`}
              aria-label="Title"
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Tyre replacement"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`${uid}-amount`}
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Amount (INR) <span className="text-red-500">*</span>
              </label>
              <input
                id={`${uid}-amount`}
                aria-label="Amount (INR)"
                type="number"
                className={inputClass}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                min="0"
                step="1"
              />
            </div>
            <div>
              <label
                htmlFor={`${uid}-category`}
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <select
                id={`${uid}-category`}
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-date`} className="mb-1 block text-sm font-medium text-gray-700">
              Expense Date
            </label>
            <input
              id={`${uid}-date`}
              aria-label="Expense Date"
              type="date"
              className={inputClass}
              value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor={`${uid}-description`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id={`${uid}-description`}
              aria-label="Description"
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
              maxLength={1000}
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Optional — Map to
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor={`${uid}-vehicle`} className="mb-1 block text-xs text-gray-600">
                  Vehicle
                </label>
                <select
                  id={`${uid}-vehicle`}
                  className={inputClass}
                  value={form.vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                >
                  <option value="">None</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {getVehicleLabel(v)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${uid}-driver`} className="mb-1 block text-xs text-gray-600">
                  Driver
                </label>
                <select
                  id={`${uid}-driver`}
                  className={inputClass}
                  value={form.driverId}
                  onChange={(e) => handleDriverChange(e.target.value)}
                >
                  <option value="">None</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {getDriverName(d)}
                    </option>
                  ))}
                </select>
                {driverAutoFilled && (
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-filled from vehicle&apos;s assigned driver — change if a different driver
                    made this trip.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="pshell-btn pshell-btn--cancel"
              style={{ height: 38, minHeight: 38, padding: '0 18px', borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pshell-btn pshell-btn--primary"
              style={{ height: 38, minHeight: 38, padding: '0 20px', borderRadius: 8 }}
            >
              {saving ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
