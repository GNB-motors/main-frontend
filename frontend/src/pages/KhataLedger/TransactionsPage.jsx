import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Receipt } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DateRangeFilter from '../Superadmin/components/DateRangeFilter';
import TripService from '../Trip/services/TripService';
import KhataLedgerService from './KhataLedgerService';
import LedgerPageHeader from './components/LedgerPageHeader';
import StatRow from './components/StatRow';
import FilterBar, { FilterSelect } from './components/FilterBar';
import LedgerTable from './components/LedgerTable';
import PaginationFooter from './components/PaginationFooter';
import EmptyState from './components/EmptyState';
import ConfirmDialog from './components/ConfirmDialog';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  EXPENSE_SOURCES,
  SOURCE_LABELS,
  describeDateRange,
  formatCurrencyCompact,
  formatNumber,
  getDriverName,
  getVehicleLabel,
} from './utils';

const PAGE_PATH = '/khata-ledger/transactions';

const TransactionsPage = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0, totalManual: 0, totalTrip: 0, totalFuel: 0 });
  const [summary, setSummary] = useState({ totalAmount: 0 });

  // All time by default — this page is the flat "everything" view, and the
  // Drivers/Trucks pages are the ones scoped to a period. Narrowing it to the
  // current month hides every older entry behind a filter nobody set.
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');

  const [options, setOptions] = useState({ vehicles: [], drivers: [] });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          TripService.getVehicles({ limit: 200 }),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setOptions({
          vehicles: vRes?.data || vRes?.results || vRes || [],
          drivers: dRes?.data || dRes?.results || dRes || [],
        });
      } catch {
        // Filter dropdowns are an enhancement; the ledger still loads without them.
      }
    };
    loadOptions();
  }, []);

  const fetchRows = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        // Always merge; `source` is what narrows the list. The stat cards keep
        // reporting the whole period either way.
        const params = { page, limit: 20, includeTripExpenses: true };
        if (search) params.search = search;
        if (category) params.category = category;
        if (source) params.source = source;
        if (vehicleId) params.vehicleId = vehicleId;
        if (driverId) params.driverId = driverId;
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;

        const [data, summaryData] = await Promise.all([
          KhataLedgerService.getExpenses(params),
          KhataLedgerService.getSummary({
            ...(dateRange.startDate && { startDate: dateRange.startDate }),
            ...(dateRange.endDate && { endDate: dateRange.endDate }),
          }),
        ]);

        setRows(data.results || []);
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || 0,
          totalManual: data.totalManual || 0,
          totalTrip: data.totalTrip || 0,
          totalFuel: data.totalFuel || 0,
        });
        setSummary(summaryData || { totalAmount: 0 });
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Could not load transactions');
      } finally {
        setLoading(false);
      }
    },
    [search, category, source, vehicleId, driverId, dateRange],
  );

  useEffect(() => {
    fetchRows(1);
  }, [fetchRows]);

  const handleDelete = async () => {
    try {
      await KhataLedgerService.deleteExpense(deleteTarget._id);
      toast.success('Expense deleted');
      setDeleteTarget(null);
      fetchRows(meta.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not delete that expense');
    }
  };

  const clearAll = () => {
    setSearchInput('');
    setCategory('');
    setSource('');
    setVehicleId('');
    setDriverId('');
  };

  const vehicleLabel = (id) => getVehicleLabel(options.vehicles.find((v) => v._id === id));
  const driverLabel = (id) => getDriverName(options.drivers.find((d) => d._id === id));

  const activeFilters = [
    search && { key: 'search', label: `Search: ${search}`, onClear: () => setSearchInput('') },
    category && {
      key: 'category',
      label: `Category: ${CATEGORY_LABELS[category] || category}`,
      onClear: () => setCategory(''),
    },
    source && {
      key: 'source',
      label: `Source: ${SOURCE_LABELS[source] || source}`,
      onClear: () => setSource(''),
    },
    vehicleId && { key: 'vehicle', label: `Truck: ${vehicleLabel(vehicleId)}`, onClear: () => setVehicleId('') },
    driverId && { key: 'driver', label: `Driver: ${driverLabel(driverId)}`, onClear: () => setDriverId('') },
  ].filter(Boolean);

  const periodLabel = describeDateRange(dateRange);

  const stats = [
    {
      label: 'Manual spend',
      value: formatCurrencyCompact(summary.totalAmount),
      context: periodLabel,
      accent: true,
    },
    { label: 'Manual entries', value: formatNumber(meta.totalManual), context: 'Added by hand' },
    { label: 'Trip entries', value: formatNumber(meta.totalTrip), context: 'Generated from trips' },
    { label: 'Fuel entries', value: formatNumber(meta.totalFuel), context: 'From fuel logs' },
  ];

  return (
    <div className="space-y-5 p-1">
      <LedgerPageHeader
        title="All Transactions"
        icon={Receipt}
        description="Every khata entry in one list — manual, trip, fuel and maintenance."
      >
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Button
          size="lg"
          onClick={() => navigate('/khata-ledger/expenses/new', { state: { from: PAGE_PATH } })}
          style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
        >
          <Plus size={16} />
          Add Expense
        </Button>
      </LedgerPageHeader>

      <StatRow items={stats} loading={loading} />

      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search entries by title…"
        activeFilters={activeFilters}
        onClearAll={activeFilters.length ? clearAll : undefined}
      >
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          allLabel="All categories"
          options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
        />
        <FilterSelect
          label="Source"
          value={source}
          onChange={setSource}
          allLabel="All sources"
          options={EXPENSE_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
        />
        <FilterSelect
          label="Truck"
          value={vehicleId}
          onChange={setVehicleId}
          allLabel="All trucks"
          options={options.vehicles.map((v) => ({ value: v._id, label: getVehicleLabel(v) }))}
        />
        <FilterSelect
          label="Driver"
          value={driverId}
          onChange={setDriverId}
          allLabel="All drivers"
          options={options.drivers.map((d) => ({ value: d._id, label: getDriverName(d) }))}
        />
      </FilterBar>

      <Card className="card-static overflow-hidden p-0">
        <CardContent className="p-0">
          <LedgerTable
            rows={rows}
            loading={loading}
            showTrip
            showActions
            onEdit={(tx) => navigate(`/khata-ledger/expenses/${tx._id}/edit`, { state: { from: PAGE_PATH } })}
            onDelete={setDeleteTarget}
            empty={
              <EmptyState
                icon={BookOpen}
                title={activeFilters.length ? 'Nothing matches these filters' : 'No entries in this period'}
                hint={
                  activeFilters.length
                    ? 'Clear a filter or widen the date range to see more.'
                    : 'Add an expense by hand, or run a trip to generate entries automatically.'
                }
                action={
                  activeFilters.length ? (
                    <Button variant="outline" size="lg" onClick={clearAll}>
                      Clear all filters
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => navigate('/khata-ledger/expenses/new', { state: { from: PAGE_PATH } })}
                      style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
                    >
                      <Plus size={16} />
                      Add Expense
                    </Button>
                  )
                }
              />
            }
          />

          <PaginationFooter
            page={meta.page}
            totalPages={meta.totalPages}
            totalResults={meta.totalResults}
            onPageChange={fetchRows}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this expense?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed from the khata. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete expense"
      />
    </div>
  );
};

export default TransactionsPage;
