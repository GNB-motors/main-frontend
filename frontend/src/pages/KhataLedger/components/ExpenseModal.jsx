import { useState, useEffect, useId } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import KhataLedgerService from '../KhataLedgerService';
import useErpAvailable from '../useErpAvailable';
import DriverVehicleAssignmentService from '../../../services/DriverVehicleAssignmentService';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  formatCurrency,
  formatDate,
  getDriverName,
  getVehicleLabel,
} from '../utils';
import '../KhataLedger.css';
import './khataTransactions.css';

const today = () => new Date().toISOString().split('T')[0];
const categoryName = (category) => {
  const label = CATEGORY_LABELS[category] || category || '';
  return label.charAt(0) + label.slice(1).toLowerCase().replace(/_/g, ' ');
};

const emptyForm = () => ({
  title: '',
  amount: '',
  category: 'MISCELLANEOUS',
  description: '',
  expenseDate: today(),
  tripId: '',
  vehicleId: '',
  driverId: '',
});

const tripLabel = (trip) => trip.tripNumber || `TRIP-${trip._id.slice(-6).toUpperCase()}`;

/** Add or edit a manual expense, optionally linked to an ERP trip, vehicle and driver. */
const ExpenseModal = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  vehicles = [],
  drivers = [],
  existingExpenses = [],
}) => {
  const uid = useId();
  // ERP trips can be linked once the location has one; an expense already linked keeps its field.
  const erpAvailable = useErpAvailable();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [driverAutoFilled, setDriverAutoFilled] = useState(false);
  const [driverTouchedByUser, setDriverTouchedByUser] = useState(false);
  const [erpTrips, setErpTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateIgnored, setDuplicateIgnored] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadTrips = async () => {
      setTripsLoading(true);
      try {
        const res = await KhataLedgerService.getErpTrips({ limit: 100 });
        setErpTrips(res?.data || res?.results || (Array.isArray(res) ? res : []));
      } catch {
        setErpTrips([]);
      } finally {
        setTripsLoading(false);
      }
    };
    loadTrips();
  }, [isOpen]);

  useEffect(() => {
    setDriverAutoFilled(false);
    setDriverTouchedByUser(false);
    setDuplicateWarning(null);
    setDuplicateIgnored(false);
    setForm(
      editingExpense
        ? {
            title: editingExpense.title || '',
            amount: editingExpense.amount || '',
            category: editingExpense.category || 'MISCELLANEOUS',
            description: editingExpense.description || '',
            expenseDate: editingExpense.expenseDate
              ? new Date(editingExpense.expenseDate).toISOString().split('T')[0]
              : today(),
            tripId: editingExpense.trip?._id || editingExpense.tripId || '',
            vehicleId: editingExpense.vehicle?._id || editingExpense.vehicleId || '',
            driverId: editingExpense.driver?._id || editingExpense.driverId || '',
          }
        : emptyForm(),
    );
  }, [editingExpense, isOpen]);

  // Same amount, category and day on the same vehicle, driver or trip.
  useEffect(() => {
    if (!form.amount || duplicateIgnored || editingExpense) {
      setDuplicateWarning(null);
      return;
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    const match = existingExpenses.find((exp) => {
      if (Number(exp.amount) !== amount || exp.category !== form.category) return false;
      const day = exp.expenseDate ? new Date(exp.expenseDate).toISOString().split('T')[0] : '';
      if (day !== form.expenseDate) return false;
      const same = (a, b) => a && b && String(a) === String(b);
      return (
        same(form.vehicleId, exp.vehicle?._id || exp.vehicleId) ||
        same(form.driverId, exp.driver?._id || exp.driverId) ||
        same(form.tripId, exp.trip?._id || exp.tripId)
      );
    });
    setDuplicateWarning(match || null);
  }, [
    form.amount,
    form.category,
    form.expenseDate,
    form.vehicleId,
    form.driverId,
    form.tripId,
    existingExpenses,
    duplicateIgnored,
    editingExpense,
  ]);

  // Suggest the vehicle's assigned driver, unless a driver was already picked by hand.
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
    } catch {
      // A suggestion only; the driver can still be picked by hand.
    }
  };

  const handleDriverChange = (driverId) => {
    setForm((prev) => ({ ...prev, driverId }));
    setDriverTouchedByUser(true);
    setDriverAutoFilled(false);
  };

  // A trip fills in its vehicle and driver when those are still empty.
  const handleTripChange = (tripId) => {
    setForm((prev) => ({ ...prev, tripId }));
    const trip = tripId && erpTrips.find((t) => t._id === tripId);
    if (!trip) return;
    const updates = {};
    if (trip.vehicleId && !form.vehicleId) {
      updates.vehicleId = typeof trip.vehicleId === 'object' ? trip.vehicleId._id : trip.vehicleId;
    }
    if (trip.driverId && !form.driverId && !driverTouchedByUser) {
      updates.driverId = typeof trip.driverId === 'object' ? trip.driverId._id : trip.driverId;
      setDriverAutoFilled(true);
    }
    if (Object.keys(updates).length) setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.amount) {
      toast.error('Title and amount are required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        description: form.description.trim() || undefined,
        expenseDate: new Date(form.expenseDate).toISOString(),
        tripId: form.tripId || null,
        vehicleId: form.vehicleId || null,
        driverId: form.driverId || null,
      });
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Could not save the expense');
    } finally {
      setSaving(false);
    }
  };

  const field = (name) => `${uid}-${name}`;
  const selectedTrip = erpTrips.find((t) => t._id === form.tripId);
  const showTripField = erpAvailable === true || Boolean(form.tripId);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="khata-dialog max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-5">
          <DialogTitle>{editingExpense ? 'Edit expense' : 'Add expense'}</DialogTitle>
          <DialogDescription>
            A manual khata entry. Link it to a trip, vehicle or driver so it shows in their ledgers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="khata-dialog-body">
            {duplicateWarning ? (
              <div className="khata-note khata-note--warn" role="status">
                <AlertTriangle size={16} aria-hidden="true" />
                <div>
                  <p>
                    <b>This may be a duplicate.</b> A {formatCurrency(duplicateWarning.amount)}{' '}
                    {(
                      CATEGORY_LABELS[duplicateWarning.category] || duplicateWarning.category
                    ).toLowerCase()}{' '}
                    expense is already on record for {formatDate(duplicateWarning.expenseDate)}:
                    &ldquo;{duplicateWarning.title}&rdquo;.
                  </p>
                  <button
                    type="button"
                    className="khata-link khata-dialog-note-action"
                    onClick={() => setDuplicateIgnored(true)}
                  >
                    It&apos;s a different expense
                  </button>
                </div>
              </div>
            ) : null}

            <div className="khata-field">
              <label htmlFor={field('title')}>
                Title <span className="khata-required">*</span>
              </label>
              <input
                id={field('title')}
                aria-label="Title"
                className="khata-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Loading charge, toll, spare tyre…"
                maxLength={200}
                required
              />
            </div>

            <div className="khata-dialog-grid">
              <div className="khata-field">
                <label htmlFor={field('amount')}>
                  Amount (₹) <span className="khata-required">*</span>
                </label>
                <input
                  id={field('amount')}
                  aria-label="Amount in rupees"
                  type="number"
                  className="khata-input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="khata-field">
                <label htmlFor={field('category')}>Category</label>
                <SearchableSelect
                  id={field('category')}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {categoryName(c)}
                    </option>
                  ))}
                </SearchableSelect>
              </div>
            </div>

            <div className="khata-field">
              <label htmlFor={field('date')}>Expense date</label>
              <input
                id={field('date')}
                aria-label="Expense date"
                type="date"
                className="khata-input"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              />
            </div>

            <div className="khata-field">
              <label htmlFor={field('description')}>Notes</label>
              <textarea
                id={field('description')}
                aria-label="Notes"
                className="khata-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional notes or reference numbers"
                rows={2}
                maxLength={1000}
              />
            </div>

            <div className="khata-dialog-section">
              <h4>Link to</h4>
              {showTripField ? (
                <div className="khata-field">
                  <label htmlFor={field('trip')}>
                    ERP trip
                    {tripsLoading ? <span className="khata-hint">Loading trips…</span> : null}
                  </label>
                  <SearchableSelect
                    id={field('trip')}
                    value={form.tripId}
                    onChange={(e) => handleTripChange(e.target.value)}
                  >
                    <option value="">No trip</option>
                    {erpTrips.map((t) => (
                      <option key={t._id} value={t._id}>
                        {tripLabel(t)}
                        {t.fromLocation && t.toLocation
                          ? ` · ${t.fromLocation} → ${t.toLocation}`
                          : ''}
                      </option>
                    ))}
                  </SearchableSelect>
                  <p className="khata-hint">
                    Linking ERP trips needs a backend update; saving with a trip may fail.
                  </p>
                  {selectedTrip?.fromLocation ? (
                    <p className="khata-hint">
                      {tripLabel(selectedTrip)} · {selectedTrip.fromLocation} →{' '}
                      {selectedTrip.toLocation}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="khata-dialog-grid">
                <div className="khata-field">
                  <label htmlFor={field('vehicle')}>Vehicle</label>
                  <SearchableSelect
                    id={field('vehicle')}
                    value={form.vehicleId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                  >
                    <option value="">No vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {getVehicleLabel(v)}
                      </option>
                    ))}
                  </SearchableSelect>
                </div>
                <div className="khata-field">
                  <label htmlFor={field('driver')}>Driver</label>
                  <SearchableSelect
                    id={field('driver')}
                    value={form.driverId}
                    onChange={(e) => handleDriverChange(e.target.value)}
                  >
                    <option value="">No driver</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {getDriverName(d)}
                      </option>
                    ))}
                  </SearchableSelect>
                </div>
              </div>
              {driverAutoFilled ? (
                <p className="khata-hint">
                  Driver filled in from the vehicle&apos;s assignment or the trip. Change it if
                  someone else drove.
                </p>
              ) : null}
            </div>
          </div>

          <div className="khata-dialog-foot">
            <button type="button" className="khata-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="khata-btn khata-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : editingExpense ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
