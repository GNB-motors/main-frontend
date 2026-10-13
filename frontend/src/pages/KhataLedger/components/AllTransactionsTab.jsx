import React, { useState, useEffect, useCallback, useId } from 'react';
import { Plus, Search, BookOpen, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import KhataLedgerService from '../KhataLedgerService';
import { CATEGORIES, CATEGORY_LABELS } from '../utils';
import ExpenseModal from './ExpenseModal';
import TransactionSummaryCards from './TransactionSummaryCards';
import TransactionsTable from './TransactionsTable';
import DeleteExpenseDialog from './DeleteExpenseDialog';

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

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [includeTripExpenses, setIncludeTripExpenses] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const uid = useId();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">All Transactions</h2>
          <p className="text-sm text-muted-foreground">
            Flat merged list of manual and trip-generated expenses
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setModalOpen(true);
          }}
          className="pshell-btn pshell-btn--primary"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      <TransactionSummaryCards
        summary={summary}
        meta={meta}
        includeTripExpenses={includeTripExpenses}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1" style={{ minWidth: 200 }}>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                aria-label="Search by title"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none"
                style={{ outline: 'none' }}
                placeholder="Search by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <input
                type="checkbox"
                aria-label="Include Trip Expenses"
                checked={includeTripExpenses}
                onChange={(e) => setIncludeTripExpenses(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                style={{ accentColor: 'var(--primary-color, #4f46e5)' }}
              />
              Include Trip Expenses
            </label>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${showFilters ? 'border-primary-active' : 'text-gray-600'}`}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3">
              <div>
                <label htmlFor={`${uid}-category`} className="mb-1 block text-xs text-gray-500">
                  Category
                </label>
                <select
                  id={`${uid}-category`}
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
                <label htmlFor={`${uid}-from`} className="mb-1 block text-xs text-gray-500">
                  From
                </label>
                <input
                  id={`${uid}-from`}
                  aria-label="From"
                  type="date"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`${uid}-to`} className="mb-1 block text-xs text-gray-500">
                  To
                </label>
                <input
                  id={`${uid}-to`}
                  aria-label="To"
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
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--primary-color, #4f46e5)' }}
              >
                Add your first expense
              </button>
            </div>
          ) : (
            <TransactionsTable
              expenses={expenses}
              openEdit={openEdit}
              setDeleteTarget={setDeleteTarget}
            />
          )}

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

      {deleteTarget && (
        <DeleteExpenseDialog
          deleteTarget={deleteTarget}
          setDeleteTarget={setDeleteTarget}
          handleDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default AllTransactionsTab;
