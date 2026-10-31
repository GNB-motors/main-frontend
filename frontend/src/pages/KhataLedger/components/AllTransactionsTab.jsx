import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  BookOpen,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
  User,
  Route,
  Receipt,
  Eye,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import KhataLedgerService from '../KhataLedgerService';
import TransactionSummaryCards from './TransactionSummaryCards';
import NewButton from '@/components/ui/NewButton';
import DriverVehicleAssignmentService from '../../../services/DriverVehicleAssignmentService';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import FuelAnomalyModal from './FuelAnomalyModal';
import ErpTripDetailModal from './ErpTripDetailModal';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  formatCurrency,
  formatDate,
  getDriverName,
  getVehicleLabel,
} from '../utils';

const ExpenseModal = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  vehicles,
  drivers,
  existingExpenses = [],
}) => {
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

  // ERP Trips for trip-mapping
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
        const list = res?.data || res?.results || (Array.isArray(res) ? res : []);
        setErpTrips(list);
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

    if (editingExpense) {
      setForm({
        title: editingExpense.title || '',
        amount: editingExpense.amount || '',
        category: editingExpense.category || 'MISCELLANEOUS',
        description: editingExpense.description || '',
        expenseDate: editingExpense.expenseDate
          ? new Date(editingExpense.expenseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        tripId: editingExpense.trip?._id || editingExpense.tripId || '',
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

  // Duplicate Expense Warning Detection (Prompt Section 14)
  useEffect(() => {
    if (!form.amount || duplicateIgnored || editingExpense) {
      setDuplicateWarning(null);
      return;
    }

    const numAmount = Number(form.amount);
    if (!numAmount || numAmount <= 0) return;

    const formDateStr = form.expenseDate;
    const potentialMatch = existingExpenses.find((exp) => {
      // Must match amount and category
      if (Number(exp.amount) !== numAmount || exp.category !== form.category) return false;

      // Check same date (day)
      const expDateStr = exp.expenseDate
        ? new Date(exp.expenseDate).toISOString().split('T')[0]
        : '';
      if (expDateStr !== formDateStr) return false;

      // Check if vehicle or driver or trip matches
      const expVehId = exp.vehicle?._id || exp.vehicleId;
      const expDrvId = exp.driver?._id || exp.driverId;
      const expTripId = exp.trip?._id || exp.tripId;

      const vehicleMatches =
        form.vehicleId && expVehId && String(form.vehicleId) === String(expVehId);
      const driverMatches = form.driverId && expDrvId && String(form.driverId) === String(expDrvId);
      const tripMatches = form.tripId && expTripId && String(form.tripId) === String(expTripId);

      return vehicleMatches || driverMatches || tripMatches;
    });

    if (potentialMatch) {
      setDuplicateWarning(potentialMatch);
    } else {
      setDuplicateWarning(null);
    }
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

  if (!isOpen) return null;

  // When Vehicle is picked: suggest active driver
  const handleVehicleChange = async (vehId) => {
    setForm((prev) => ({ ...prev, vehicleId: vehId }));
    if (!vehId || driverTouchedByUser) return;
    try {
      const assignment = await DriverVehicleAssignmentService.getActiveAssignment({
        vehicleId: vehId,
        activeOn: form.expenseDate,
      });
      if (!assignment) return;
      const suggestedId = DriverVehicleAssignmentService.idOf(assignment.driverId);
      if (drivers.some((d) => d._id === suggestedId)) {
        setForm((prev) => ({ ...prev, driverId: suggestedId }));
        setDriverAutoFilled(true);
      }
    } catch {
      // ignore
    }
  };

  const handleDriverChange = (drvId) => {
    setForm((prev) => ({ ...prev, driverId: drvId }));
    setDriverTouchedByUser(true);
    setDriverAutoFilled(false);
  };

  // When Trip is picked: autofill vehicle & driver (Prompt Section 13)
  const handleTripChange = (tId) => {
    setForm((prev) => ({ ...prev, tripId: tId }));
    if (!tId) return;

    const matchedTrip = erpTrips.find((t) => t._id === tId);
    if (!matchedTrip) return;

    const updates = {};
    if (matchedTrip.vehicleId && !form.vehicleId) {
      const vehId =
        typeof matchedTrip.vehicleId === 'object'
          ? matchedTrip.vehicleId._id
          : matchedTrip.vehicleId;
      updates.vehicleId = vehId;
    }
    if (matchedTrip.driverId && !form.driverId && !driverTouchedByUser) {
      const drvId =
        typeof matchedTrip.driverId === 'object' ? matchedTrip.driverId._id : matchedTrip.driverId;
      updates.driverId = drvId;
      setDriverAutoFilled(true);
    }

    if (Object.keys(updates).length > 0) {
      setForm((prev) => ({ ...prev, ...updates }));
    }
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
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white';

  const selectedTripObj = erpTrips.find((t) => t._id === form.tripId);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-gray-900">
            {editingExpense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Possible Duplicate Warning Banner (Prompt Section 14) */}
        {duplicateWarning && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-bold block">Possible duplicate expense detected</span>
                <p className="text-amber-800">
                  A similar <strong>{formatCurrency(duplicateWarning.amount)}</strong> (
                  {CATEGORY_LABELS[duplicateWarning.category] || duplicateWarning.category}) expense
                  already exists on <strong>{formatDate(duplicateWarning.expenseDate)}</strong>:
                  &ldquo;{duplicateWarning.title}&rdquo;.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDuplicateIgnored(true)}
                    className="rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    Continue Anyway
                  </button>
                  <span className="text-amber-700 text-[11px]">
                    This is only a warning; you may proceed.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="atx-form-title"
              className="mb-1 block text-xs font-medium text-gray-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="atx-form-title"
              aria-label="Transaction title"
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Loading charge, Toll tax, Spare tyre"
              maxLength={200}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="atx-form-amount"
                className="mb-1 block text-xs font-medium text-gray-700"
              >
                Amount (INR) <span className="text-red-500">*</span>
              </label>
              <input
                id="atx-form-amount"
                aria-label="Amount in INR"
                type="number"
                className={inputClass}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                min="0"
                step="1"
                required
              />
            </div>
            <div>
              <label
                htmlFor="atx-form-category"
                className="mb-1 block text-xs font-medium text-gray-700"
              >
                Category
              </label>
              <select
                id="atx-form-category"
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
            <label htmlFor="atx-form-date" className="mb-1 block text-xs font-medium text-gray-700">
              Expense Date
            </label>
            <input
              id="atx-form-date"
              aria-label="Expense date"
              type="date"
              className={inputClass}
              value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="atx-form-desc" className="mb-1 block text-xs font-medium text-gray-700">
              Description / Notes
            </label>
            <textarea
              id="atx-form-desc"
              aria-label="Description or notes"
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional notes or reference numbers..."
              rows={2}
              maxLength={1000}
            />
          </div>

          {/* Attributions Mapping */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Map To Fleet Context
            </p>

            {/* Trip Selector */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 flex items-center justify-between">
                <span>ERP Trip (Optional)</span>
                {tripsLoading && (
                  <span className="text-[10px] text-gray-400">Loading trips...</span>
                )}
              </label>
              <select
                className={inputClass}
                value={form.tripId}
                onChange={(e) => handleTripChange(e.target.value)}
              >
                <option value="">None (Unassigned to any trip)</option>
                {erpTrips.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tripNumber || `TRIP-${t._id.slice(-6).toUpperCase()}`}
                    {t.fromLocation && t.toLocation ? ` (${t.fromLocation} → ${t.toLocation})` : ''}
                  </option>
                ))}
              </select>
              {selectedTripObj && (
                <div className="mt-1.5 p-2 bg-indigo-50/70 border border-indigo-100 rounded text-[11px] text-indigo-900">
                  <span>
                    Linked to <strong>{selectedTripObj.tripNumber}</strong>
                    {selectedTripObj.fromLocation &&
                      ` (${selectedTripObj.fromLocation} → ${selectedTripObj.toLocation})`}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Vehicle */}
              <div>
                <label
                  htmlFor="atx-form-vehicle"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Vehicle
                </label>
                <select
                  id="atx-form-vehicle"
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

              {/* Driver */}
              <div>
                <label
                  htmlFor="atx-form-driver"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Driver
                </label>
                <select
                  id="atx-form-driver"
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
              </div>
            </div>

            {driverAutoFilled && (
              <p className="text-[11px] text-indigo-600">
                Driver suggested based on active assignment / trip record.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AllTransactionsTab = ({ vehicles = [], drivers = [] }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 1,
    totalResults: 0,
    totalManual: 0,
    totalTrip: 0,
    totalFuel: 0,
  });
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 });
  const requestVersion = useRef(0);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [tripId, setTripId] = useState('');
  const [includeTripExpenses, setIncludeTripExpenses] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [selectedTripModalId, setSelectedTripModalId] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchExpenses = useCallback(
    async (page = 1) => {
      const version = ++requestVersion.current;
      setLoading(true);
      try {
        const params = { page, limit: 20, includeTripExpenses };
        if (search) params.search = search;
        if (category) params.category = category;
        if (source) params.source = source;
        if (status) params.status = status;
        if (vehicleId) params.vehicleId = vehicleId;
        if (driverId) params.driverId = driverId;
        if (tripId) params.tripId = tripId;
        if (startDate) params.startDate = new Date(startDate).toISOString();
        if (endDate) params.endDate = new Date(endDate).toISOString();

        let [data, summaryData] = await Promise.all([
          KhataLedgerService.getExpenses(params),
          KhataLedgerService.getSummary(params),
        ]);
        if (version !== requestVersion.current) return;
        const lastPage = Math.max(1, data.totalPages || 1);
        if (page > lastPage) {
          data = await KhataLedgerService.getExpenses({ ...params, page: lastPage });
          if (version !== requestVersion.current) return;
        }

        const loaded = data.results || data.data || [];

        setExpenses(loaded);
        setMeta({
          page: data.page || page,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || data.total || loaded.length,
          totalManual: data.totalManual || 0,
          totalTrip: data.totalTrip || 0,
          totalFuel: data.totalFuel || 0,
        });
        setSummary(summaryData);
      } catch (err) {
        if (version === requestVersion.current) {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to load expenses');
        }
      } finally {
        if (version === requestVersion.current) setLoading(false);
      }
    },
    [
      search,
      category,
      source,
      status,
      vehicleId,
      driverId,
      tripId,
      includeTripExpenses,
      startDate,
      endDate,
    ],
  );

  useEffect(() => {
    fetchExpenses(1);
    return () => {
      requestVersion.current += 1;
    };
  }, [fetchExpenses]);

  const handleSave = async (payload) => {
    if (editingExpense) {
      await KhataLedgerService.updateExpense(editingExpense._id, payload);
      toast.success('Expense updated');
    } else {
      await KhataLedgerService.createExpense(payload);
      toast.success('Expense added');
    }
    setEditingExpense(null);
    fetchExpenses(meta.page);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await KhataLedgerService.deleteExpense(deleteTarget._id);
      toast.success('Expense deleted');
      setDeleteTarget(null);
      fetchExpenses(meta.page);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete expense');
    }
  };

  const openEdit = (expense) => {
    setEditingExpense({
      ...expense,
      vehicleId: expense.vehicle?._id || expense.vehicleId || '',
      driverId: expense.driver?._id || expense.driverId || '',
      tripId: expense.trip?._id || expense.tripId || '',
    });
    setModalOpen(true);
  };

  const handleClearFilters = () => {
    setCategory('');
    setSource('');
    setStatus('');
    setVehicleId('');
    setDriverId('');
    setTripId('');
    setStartDate('');
    setEndDate('');
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="space-y-5">
      {/* Title bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">All Transactions</h2>
          <p className="text-sm text-muted-foreground">
            Unified financial transactions with trip drill-downs, source validation & receipt
            previews
          </p>
        </div>
        <NewButton
          size="md"
          prependIcon={<Plus size={16} />}
          onClick={() => {
            setEditingExpense(null);
            setModalOpen(true);
          }}
        >
          Add Expense
        </NewButton>
      </div>

      <TransactionSummaryCards
        summary={summary}
        meta={meta}
        includeTripExpenses={includeTripExpenses}
        loading={loading}
      />

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1" style={{ minWidth: 220 }}>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                aria-label="Search transactions"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder="Search transactions by title or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 bg-white">
              <input
                type="checkbox"
                aria-label="Include Auto Refuels and Trip Costs"
                checked={includeTripExpenses}
                onChange={(e) => setIncludeTripExpenses(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
              />
              Include Auto Refuels & Trip Costs
            </label>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                showFilters ||
                category ||
                source ||
                status ||
                vehicleId ||
                driverId ||
                startDate ||
                endDate
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={15} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              <div>
                <label
                  htmlFor="atx-filter-category"
                  className="block text-gray-500 font-medium mb-1"
                >
                  Category
                </label>
                <select
                  id="atx-filter-category"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 bg-white text-xs"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="atx-filter-source" className="block text-gray-500 font-medium mb-1">
                  Source
                </label>
                <select
                  id="atx-filter-source"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 bg-white text-xs"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="">All Sources</option>
                  <option value="MANUAL">Manual</option>
                  <option value="FUEL">Fuel Log</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="TRIP">Trip Expense</option>
                  <option value="DRIVER_BILL">Driver Bill</option>
                </select>
              </div>

              <div>
                <label htmlFor="atx-filter-status" className="block text-gray-500 font-medium mb-1">
                  Status
                </label>
                <select
                  id="atx-filter-status"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 bg-white text-xs"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="CONFIRMED">Confirmed / Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="atx-filter-vehicle"
                  className="block text-gray-500 font-medium mb-1"
                >
                  Vehicle
                </label>
                <select
                  id="atx-filter-vehicle"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 bg-white text-xs"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {getVehicleLabel(v)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="atx-filter-from" className="block text-gray-500 font-medium mb-1">
                  From Date
                </label>
                <input
                  id="atx-filter-from"
                  aria-label="From date"
                  type="date"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 bg-white text-xs"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="atx-filter-to" className="block text-gray-500 font-medium mb-1">
                  To Date
                </label>
                <input
                  id="atx-filter-to"
                  aria-label="To date"
                  type="date"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 bg-white text-xs"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="col-span-2 sm:col-span-4 lg:col-span-6 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <BookOpen size={40} className="opacity-30" />
              <p className="text-sm font-medium">No expenses found</p>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setModalOpen(true);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Add your first expense
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 text-xs">
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>ERP Trip</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Title & Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Receipt</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => {
                    const hasTrip = Boolean(exp.trip && exp.trip._id);
                    const tripLabel =
                      exp.trip?.tripNumber ||
                      (exp.trip?._id ? `TRIP-${exp.trip._id.slice(-6).toUpperCase()}` : null);

                    return (
                      <TableRow
                        key={`${exp.source}-${exp._id}`}
                        className="hover:bg-slate-50/70 text-xs"
                      >
                        {/* Date */}
                        <TableCell className="whitespace-nowrap font-medium text-gray-700">
                          {formatDate(exp.expenseDate || exp.createdAt)}
                        </TableCell>

                        {/* Source Badge */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold uppercase ${
                              SOURCE_COLORS[exp.source] || SOURCE_COLORS.MANUAL
                            }`}
                          >
                            {SOURCE_LABELS[exp.source] || exp.source || 'MANUAL'}
                          </Badge>
                        </TableCell>

                        {/* ERP Trip (Clickable Drill-down!) */}
                        <TableCell>
                          {hasTrip ? (
                            <button
                              onClick={() => setSelectedTripModalId(exp.trip._id)}
                              className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                              title="Click to view ERP Trip details"
                            >
                              <Route size={12} className="text-indigo-500" />
                              <span>{tripLabel}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 font-normal">Unassigned</span>
                          )}
                        </TableCell>

                        {/* Vehicle */}
                        <TableCell>
                          {exp.vehicle ? (
                            <span className="flex items-center gap-1 font-medium text-gray-800">
                              <Truck size={13} className="text-gray-400" />
                              {getVehicleLabel(exp.vehicle)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* Driver */}
                        <TableCell>
                          {exp.driver ? (
                            <span className="flex items-center gap-1 text-gray-700">
                              <User size={13} className="text-gray-400" />
                              {getDriverName(exp.driver)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* Category Badge */}
                        <TableCell>
                          <Badge
                            className={`text-[10px] ${
                              CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.MISCELLANEOUS
                            }`}
                          >
                            {CATEGORY_LABELS[exp.category] || exp.category}
                          </Badge>
                        </TableCell>

                        {/* Title & Description with Fuel Anomaly */}
                        <TableCell className="max-w-xs">
                          <div>
                            <span className="font-semibold text-gray-900 block">{exp.title}</span>
                            {exp.description && (
                              <span className="truncate text-[11px] text-gray-500 block mt-0.5">
                                {exp.description}
                              </span>
                            )}
                            {exp.mileageFlag && (
                              <button
                                onClick={() => setSelectedAnomaly(exp.mileageFlag)}
                                className="mt-1 inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 hover:bg-amber-100"
                                title="Click to view Mileage Anomaly details"
                              >
                                <AlertTriangle size={11} className="text-amber-600" />
                                <span>
                                  {exp.mileageFlag.actualKmPerL?.toFixed(2)} vs{' '}
                                  {exp.mileageFlag.expectedKmPerL} km/L
                                </span>
                              </button>
                            )}
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrency(exp.amount)}
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="text-center">
                          <Badge
                            className={`text-[10px] font-semibold ${
                              STATUS_COLORS[exp.status] || STATUS_COLORS.CONFIRMED
                            }`}
                          >
                            {STATUS_LABELS[exp.status] || exp.status || 'CONFIRMED'}
                          </Badge>
                        </TableCell>

                        {/* Receipt Preview Action (Prompt Section 12) */}
                        <TableCell className="text-center">
                          {exp.receiptUrl ? (
                            <button
                              onClick={() => setSelectedReceiptUrl(exp.receiptUrl)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                              title="Preview Attached Receipt"
                            >
                              <Eye size={12} />
                              Preview
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[11px]">-</span>
                          )}
                        </TableCell>

                        {/* Actions (Edit / Delete for Manual expenses) */}
                        <TableCell className="text-right whitespace-nowrap">
                          {exp.source === 'MANUAL' ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEdit(exp)}
                                className="rounded p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"
                                title="Edit Expense"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(exp)}
                                className="rounded p-1 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                title="Delete Expense"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">Automated</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50/50">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.totalResults} total)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={loading || meta.page <= 1}
                  onClick={() => fetchExpenses(meta.page - 1)}
                  className="rounded-lg border bg-white p-2 text-sm disabled:opacity-40"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={loading || meta.page >= meta.totalPages}
                  onClick={() => fetchExpenses(meta.page + 1)}
                  className="rounded-lg border bg-white p-2 text-sm disabled:opacity-40"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Expense Modal with Duplicate Warning */}
      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSave}
        editingExpense={editingExpense}
        vehicles={vehicles}
        drivers={drivers}
        existingExpenses={expenses}
      />

      {/* Receipt Preview Modal */}
      <ReceiptPreviewModal
        isOpen={Boolean(selectedReceiptUrl)}
        onClose={() => setSelectedReceiptUrl(null)}
        receiptUrl={selectedReceiptUrl}
      />

      {/* Fuel Anomaly Modal */}
      <FuelAnomalyModal
        isOpen={Boolean(selectedAnomaly)}
        onClose={() => setSelectedAnomaly(null)}
        flag={selectedAnomaly}
      />

      {/* ERP Trip Details Drill-Down Modal (Mandatory Drill-down from Transaction → Trip!) */}
      {selectedTripModalId && (
        <ErpTripDetailModal
          isOpen={Boolean(selectedTripModalId)}
          onClose={() => setSelectedTripModalId(null)}
          tripId={selectedTripModalId}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="presentation"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">Delete Expense</h3>
            <p className="mt-2 text-xs text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This will
              remove the record from Khata.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTransactionsTab;
