import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  BookOpen,
  IndianRupee,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
  User,
  Route,
  Fuel,
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
import KhataLedgerService from './KhataLedgerService';
import TripService from '../Trip/services/TripService';

const CATEGORIES = [
  'FUEL',
  'TOLL',
  'MAINTENANCE',
  'REPAIR',
  'DRIVER_SALARY',
  'DRIVER_ALLOWANCE',
  'INSURANCE',
  'PERMIT',
  'FINE',
  'TYRE',
  'LOADING_UNLOADING',
  'MISCELLANEOUS',
];

const CATEGORY_LABELS = {
  FUEL: 'Fuel',
  TOLL: 'Toll',
  MAINTENANCE: 'Maintenance',
  REPAIR: 'Repair',
  DRIVER_SALARY: 'Driver Salary',
  DRIVER_ALLOWANCE: 'Driver Allowance',
  INSURANCE: 'Insurance',
  PERMIT: 'Permit',
  FINE: 'Fine',
  TYRE: 'Tyre',
  LOADING_UNLOADING: 'Loading/Unloading',
  MISCELLANEOUS: 'Miscellaneous',
  TRIP_EXPENSE: 'Trip Expense',
};

const CATEGORY_COLORS = {
  FUEL: 'bg-blue-100 text-blue-700',
  TOLL: 'bg-amber-100 text-amber-700',
  MAINTENANCE: 'bg-purple-100 text-purple-700',
  REPAIR: 'bg-red-100 text-red-700',
  DRIVER_SALARY: 'bg-green-100 text-green-700',
  DRIVER_ALLOWANCE: 'bg-teal-100 text-teal-700',
  INSURANCE: 'bg-indigo-100 text-indigo-700',
  PERMIT: 'bg-cyan-100 text-cyan-700',
  FINE: 'bg-rose-100 text-rose-700',
  TYRE: 'bg-orange-100 text-orange-700',
  LOADING_UNLOADING: 'bg-lime-100 text-lime-700',
  MISCELLANEOUS: 'bg-gray-100 text-gray-700',
  TRIP_EXPENSE: 'bg-violet-100 text-violet-700',
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const getDriverName = (driver) => {
  if (!driver) return '-';
  return [driver.firstName, driver.lastName].filter(Boolean).join(' ') || '-';
};

// ======================== Add/Edit Expense Modal ========================
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

  useEffect(() => {
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
        vehicleId: editingExpense.vehicleId || '',
        driverId: editingExpense.driverId || '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
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
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Tyre replacement"
              maxLength={200}
            />
          </div>

          {/* Amount & Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Amount (INR) <span className="text-red-500">*</span>
              </label>
              <input
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
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

          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Expense Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
              maxLength={1000}
            />
          </div>

          {/* Optional mappings */}
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Optional — Map to
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Vehicle</label>
                <select
                  className={inputClass}
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                >
                  <option value="">None</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Driver</label>
                <select
                  className={inputClass}
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                >
                  <option value="">None</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
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
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50" style={{backgroundColor: "var(--primary-color, #4f46e5)"}}
            >
              {saving ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================== Main Page ========================
const KhataLedgerPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0, totalManual: 0, totalTrip: 0, totalFuel: 0 });
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 });

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [includeTripExpenses, setIncludeTripExpenses] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Dropdown data
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load vehicles & drivers for dropdowns
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          TripService.getVehicles({ limit: 200 }),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setVehicles(vRes?.data || vRes?.results || vRes || []);
        setDrivers(dRes?.data || dRes?.results || dRes || []);
      } catch {
        // Non-critical
      }
    };
    loadDropdowns();
  }, []);

  const fetchExpenses = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20, includeTripExpenses };
        if (search) params.search = search;
        if (category) params.category = category;
        if (startDate) params.startDate = new Date(startDate).toISOString();
        if (endDate) params.endDate = new Date(endDate).toISOString();

        const [data, summaryData] = await Promise.all([
          KhataLedgerService.getExpenses(params),
          KhataLedgerService.getSummary({
            ...(startDate && { startDate: new Date(startDate).toISOString() }),
            ...(endDate && { endDate: new Date(endDate).toISOString() }),
          }),
        ]);

        setExpenses(data.results || []);
        setMeta({
          page: data.page,
          totalPages: data.totalPages,
          totalResults: data.totalResults,
          totalManual: data.totalManual,
          totalTrip: data.totalTrip,
          totalFuel: data.totalFuel || 0,
        });
        setSummary(summaryData);
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load expenses');
      } finally {
        setLoading(false);
      }
    },
    [search, category, includeTripExpenses, startDate, endDate],
  );

  useEffect(() => {
    fetchExpenses(1);
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
      toast.error(err?.message || 'Failed to delete');
    }
  };

  const openEdit = (expense) => {
    setEditingExpense({
      ...expense,
      vehicleId: expense.vehicle?._id || '',
      driverId: expense.driver?._id || '',
      tripId: expense.trip?._id || '',
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-5 p-1">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BookOpen size={24} style={{color: "var(--primary-color, #4f46e5)"}} />
            Khata Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Track all expenses — manual and trip-generated
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm" style={{backgroundColor: "var(--primary-color, #4f46e5)"}}
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{backgroundColor: "var(--primary-light, #eef2ff)", color: "var(--primary-color, #4f46e5)"}}>
              <IndianRupee size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total Manual Expenses
              </p>
              <p className="mt-0.5 text-xl font-bold">{formatCurrency(summary.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Manual Entries
              </p>
              <p className="mt-0.5 text-xl font-bold">{meta.totalManual}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Route size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Trip Expenses
              </p>
              <p className="mt-0.5 text-xl font-bold">
                {includeTripExpenses ? meta.totalTrip : 'Hidden'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Fuel size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fuel Logs
              </p>
              <p className="mt-0.5 text-xl font-bold">
                {includeTripExpenses ? meta.totalFuel : 'Hidden'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: 200 }}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none" style={{outline: "none"}}
                placeholder="Search by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Include trip expenses toggle */}
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={includeTripExpenses}
                onChange={(e) => setIncludeTripExpenses(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300" style={{accentColor: "var(--primary-color, #4f46e5)"}}
              />
              Include Trip Expenses
            </label>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${showFilters ? 'border-primary-active' : 'text-gray-600'}`}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Category</label>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                <label className="mb-1 block text-xs text-gray-500">From</label>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">To</label>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  setCategory('');
                  setStartDate('');
                  setEndDate('');
                  setSearchInput('');
                  setSearch('');
                }}
                className="rounded-lg border px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
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
              <p className="text-sm">No expenses found</p>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setModalOpen(true);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{backgroundColor: "var(--primary-color, #4f46e5)"}}
              >
                Add your first expense
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={`${exp.source}-${exp._id}`}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(exp.expenseDate)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{exp.title}</p>
                        {exp.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.MISCELLANEOUS}`}
                      >
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(exp.amount)}</TableCell>
                    <TableCell className="text-sm">
                      {exp.vehicle ? (
                        <span className="flex items-center gap-1">
                          <Truck size={14} className="text-gray-400" />
                          {exp.vehicle.registrationNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {exp.driver ? (
                        <span className="flex items-center gap-1">
                          <User size={14} className="text-gray-400" />
                          {getDriverName(exp.driver)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${exp.source === 'TRIP' ? 'border-violet-300 text-violet-600' : 'border-blue-300 text-blue-600'}`}
                      >
                        {exp.source === 'TRIP' ? 'Trip' : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {exp.source === 'MANUAL' ? (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(exp)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100" style={{transition: "color 0.2s"}}
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(exp)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Read-only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.totalResults} total)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchExpenses(meta.page - 1)}
                  className="rounded-lg border p-2 text-sm disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchExpenses(meta.page + 1)}
                  className="rounded-lg border p-2 text-sm disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
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
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Expense</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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

export default KhataLedgerPage;