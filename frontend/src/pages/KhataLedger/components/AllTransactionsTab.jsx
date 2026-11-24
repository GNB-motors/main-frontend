import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import useUrlFilter from '@/hooks/useUrlFilter';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Pencil, BookOpen, Fuel } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import NewButton from '@/components/ui/NewButton';
import { useConfirm } from '@/components/ui/confirmContext';
import { istDayEndISO, istDayStartISO, istDayString } from '@/utils/dateUtils';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import TransactionSummaryCards from './TransactionSummaryCards';
import ExpenseModal from './ExpenseModal';
import AddFuelLogModal from './AddFuelLogModal';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import FuelAnomalyModal from './FuelAnomalyModal';
import ErpTripDetailModal from './ErpTripDetailModal';
import {
  KhataCard,
  KhataSectionHead,
  KhataEmpty,
  KhataField,
  KhataPager,
  KhataPill,
  KhataSearch,
  KhataTableSkeleton,
} from './khataUi';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUS_LABELS,
  formatCurrency,
  formatDate,
  getDriverName,
  getVehicleLabel,
  plural,
} from '../utils';
import './khataTransactions.css';

// The only sources /api/expenses returns rows for.
const SOURCES = [
  ['MANUAL', 'Manual'],
  ['FUEL', 'Fuel log'],
  ['DRIVER_BILL', 'Driver bill'],
  ['DETECTED_CROSSING', 'Detected toll'],
];
const SOURCE_NAMES = Object.fromEntries(SOURCES);

const STATUS_TONES = { CONFIRMED: 'ok', APPROVED: 'ok', PENDING: 'warn', REJECTED: 'bad' };

const words = (value) =>
  value ? value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ') : '';
const categoryName = (category) =>
  CATEGORY_LABELS[category] ? words(CATEGORY_LABELS[category]) : words(category);

const Missing = () => <span className="khata-muted">—</span>;

const AllTransactionsTab = ({ vehicles = [], drivers = [] }) => {
  const confirm = useConfirm();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 1,
    totalResults: 0,
    totalManual: null,
    totalFuel: null,
  });
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 });
  const requestVersion = useRef(0);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(() =>
    searchParams.get('category') === 'TOLL' ? 'TOLL' : '',
  );
  const [source, setSource] = useState('');
  const [status, setStatus] = useUrlFilter('expenseStatus');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [tripId, setTripId] = useState('');
  const [includeTripExpenses, setIncludeTripExpenses] = useState(true);
  // IST calendar days ("YYYY-MM-DD"), so a Digest link can set them.
  const [startDate, setStartDate] = useUrlFilter('from');
  const [endDate] = useUrlFilter('to');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [selectedTripModalId, setSelectedTripModalId] = useState(null);

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
        if (startDate) params.startDate = new Date(`${startDate}T00:00:00.000+05:30`).toISOString();
        if (endDate) params.endDate = new Date(`${endDate}T23:59:59.999+05:30`).toISOString();

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
          totalManual: data.totalManual ?? null,
          totalFuel: data.totalFuel ?? null,
        });
        setSummary(summaryData);
      } catch (err) {
        if (version === requestVersion.current) {
          toast.error(err?.response?.data?.message || err?.message || 'Could not load expenses');
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

  const handleDelete = async (expense) => {
    const question = {
      title: 'Delete this expense?',
      body: `“${expense.title}” is removed from the khata.`,
      confirmLabel: 'Delete expense',
      danger: true,
    };
    // The confirm host lives in the dashboard layout; outside it, fall back to the browser's.
    const ok = confirm
      ? await confirm(question)
      : window.confirm(`${question.title} ${question.body}`);
    if (!ok) return;
    try {
      await KhataLedgerService.deleteExpense(expense._id);
      toast.success('Expense deleted');
      fetchExpenses(meta.page);
    } catch (err) {
      toast.error(err?.message || 'Could not delete the expense');
    }
  };

  const openAdd = () => {
    setEditingExpense(null);
    setModalOpen(true);
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

  const hasFilters = Boolean(
    search ||
    searchInput ||
    category ||
    source ||
    status ||
    vehicleId ||
    driverId ||
    tripId ||
    startDate ||
    endDate,
  );

  const handleClearFilters = () => {
    setCategory('');
    setSource('');
    setStatus('', { from: null, to: null });
    setVehicleId('');
    setDriverId('');
    setTripId('');
    setSearchInput('');
    setSearch('');
  };

  const dateRange = {
    startDate: startDate ? istDayStartISO(startDate) : null,
    endDate: endDate ? istDayEndISO(endDate) : null,
  };
  const handleDateRange = ({ startDate: from, endDate: to }) =>
    setStartDate(from ? istDayString(from) : '', { to: to ? istDayString(to) : null });

  const shown = meta.totalResults || expenses.length;

  return (
    <>
      <KhataSectionHead
        title="Transactions"
        subtitle="Every expense, toll and fuel refill, with receipts and trip links."
        actions={
          <>
            <NewButton
              variant="secondary"
              size="md"
              prependIcon={<Fuel size={16} />}
              onClick={() => setFuelModalOpen(true)}
            >
              Add fuel
            </NewButton>
            <NewButton size="md" prependIcon={<Plus size={16} />} onClick={openAdd}>
              Add expense
            </NewButton>
          </>
        }
      />
      <TransactionSummaryCards
        summary={summary}
        meta={meta}
        includeTripExpenses={includeTripExpenses}
        loading={loading}
      />

      <KhataCard
        flush
        title={
          <>
            Entries
            {!loading ? (
              <span className="khata-count">{plural(shown, 'entry', 'entries')}</span>
            ) : null}
          </>
        }
        actions={
          <KhataSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search title or notes"
            label="Search transactions"
          />
        }
      >
        <div className="khata-strip">
          <div className="khata-filters khata-tx-filters">
            <div className="khata-field">
              <span className="khata-field-label">Date</span>
              <DateRangeFilter value={dateRange} onChange={handleDateRange} />
            </div>
            <KhataField label="Category" htmlFor="atx-filter-category">
              <SearchableSelect
                id="atx-filter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryName(c)}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
            <KhataField label="Source" htmlFor="atx-filter-source">
              <SearchableSelect
                id="atx-filter-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">All sources</option>
                {SOURCES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
            <KhataField label="Status" htmlFor="atx-filter-status">
              <SearchableSelect
                id="atx-filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="CONFIRMED">Confirmed or approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </SearchableSelect>
            </KhataField>
            <KhataField label="Vehicle" htmlFor="atx-filter-vehicle">
              <SearchableSelect
                id="atx-filter-vehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">All vehicles</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {getVehicleLabel(v)}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
            <KhataField label="Driver" htmlFor="atx-filter-driver">
              <SearchableSelect
                id="atx-filter-driver"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              >
                <option value="">All drivers</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {getDriverName(d)}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
          </div>
          <div className="khata-tx-filter-foot">
            <label className="khata-check">
              <input
                type="checkbox"
                aria-label="Include fuel refills"
                checked={includeTripExpenses}
                onChange={(e) => setIncludeTripExpenses(e.target.checked)}
              />
              Include fuel refills
            </label>
            {hasFilters ? (
              <button
                type="button"
                className="khata-btn khata-btn--ghost"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <KhataTableSkeleton rows={6} />
        ) : expenses.length === 0 ? (
          hasFilters ? (
            <KhataEmpty
              icon={BookOpen}
              title="No entries match these filters"
              action={
                <button type="button" className="khata-btn" onClick={handleClearFilters}>
                  Clear filters
                </button>
              }
            >
              Widen the date range or clear a filter to see more.
            </KhataEmpty>
          ) : (
            <KhataEmpty
              icon={BookOpen}
              title="No expenses recorded yet"
              action={
                <button type="button" className="khata-btn khata-btn--primary" onClick={openAdd}>
                  Add expense
                </button>
              }
            >
              Fuel logs, driver bills and detected tolls show up here once they are recorded.
            </KhataEmpty>
          )
        ) : (
          <Table className="khata-table">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vehicle · driver</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead className="is-num">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead className="is-end">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => {
                // Expense trip ids are mostly auto trips; only a numbered trip is an ERP trip.
                const erpTrip = exp.trip?.tripNumber ? exp.trip : null;
                const autoTripId = erpTrip ? null : exp.trip?._id || exp.tripId || null;
                const flag = exp.mileageFlag;
                const vehicle = exp.vehicle ? getVehicleLabel(exp.vehicle) : null;
                const driver = exp.driver ? getDriverName(exp.driver) : null;
                const statusKey = exp.status || 'CONFIRMED';
                return (
                  <TableRow key={`${exp.source}-${exp._id}`}>
                    <TableCell className="khata-tx-date">
                      {formatDate(exp.expenseDate || exp.createdAt)}
                    </TableCell>
                    <TableCell className="khata-tx-entry">
                      <span className="khata-cell-main">{exp.title || 'Untitled'}</span>
                      {exp.description ? (
                        <span className="khata-cell-sub" title={exp.description}>
                          {exp.description}
                        </span>
                      ) : null}
                      {flag ? (
                        <button
                          type="button"
                          className="khata-pill khata-pill--warn khata-pill--sm khata-tx-flag"
                          onClick={() => setSelectedAnomaly(flag)}
                          aria-label={`Mileage flag: ${flag.actualKmPerL?.toFixed(2) ?? '—'} against ${flag.expectedKmPerL ?? '—'} km/L expected. Show details`}
                        >
                          {flag.actualKmPerL?.toFixed(2) ?? '—'} vs {flag.expectedKmPerL ?? '—'}{' '}
                          km/L
                        </button>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="khata-cell-main">{categoryName(exp.category) || '—'}</span>
                      <span className="khata-cell-sub">
                        {SOURCE_NAMES[exp.source] || words(exp.source) || 'Manual'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {vehicle || driver ? (
                        <>
                          <span className="khata-cell-main is-code">{vehicle || '—'}</span>
                          {driver ? <span className="khata-cell-sub">{driver}</span> : null}
                        </>
                      ) : (
                        <Missing />
                      )}
                    </TableCell>
                    <TableCell>
                      {erpTrip ? (
                        <button
                          type="button"
                          className="khata-link"
                          onClick={() => setSelectedTripModalId(erpTrip._id)}
                          aria-label={`Open ERP trip ${erpTrip.tripNumber}`}
                        >
                          {erpTrip.tripNumber}
                        </button>
                      ) : autoTripId ? (
                        <Link className="khata-link" to={`/auto-trips/${autoTripId}`}>
                          Auto trip →
                        </Link>
                      ) : (
                        <Missing />
                      )}
                    </TableCell>
                    <TableCell className="is-num">{formatCurrency(exp.amount)}</TableCell>
                    <TableCell>
                      <KhataPill tone={STATUS_TONES[statusKey] || 'neutral'}>
                        {STATUS_LABELS[statusKey] || words(statusKey)}
                      </KhataPill>
                    </TableCell>
                    <TableCell>
                      {exp.receiptUrl ? (
                        <button
                          type="button"
                          className="khata-link"
                          onClick={() => setSelectedReceiptUrl(exp.receiptUrl)}
                          aria-label={`Preview receipt for ${exp.title || 'this entry'}`}
                        >
                          Preview
                        </button>
                      ) : (
                        <Missing />
                      )}
                    </TableCell>
                    <TableCell className="is-end">
                      {exp.source === 'MANUAL' ? (
                        <span className="khata-cell-actions">
                          <button
                            type="button"
                            className="khata-icon-btn"
                            onClick={() => openEdit(exp)}
                            aria-label={`Edit ${exp.title || 'expense'}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="khata-icon-btn khata-icon-btn--danger"
                            onClick={() => handleDelete(exp)}
                            aria-label={`Delete ${exp.title || 'expense'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      ) : (
                        <span className="khata-muted is-secondary">Automatic</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!loading && expenses.length > 0 ? (
          <KhataPager
            summary={plural(shown, 'entry', 'entries')}
            page={meta.page}
            totalPages={meta.totalPages}
            onPage={fetchExpenses}
            disabled={loading}
          />
        ) : null}
      </KhataCard>

      <AddFuelLogModal
        open={fuelModalOpen}
        onClose={() => setFuelModalOpen(false)}
        onAdded={() => fetchExpenses(meta.page)}
      />

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

      <ReceiptPreviewModal
        isOpen={Boolean(selectedReceiptUrl)}
        onClose={() => setSelectedReceiptUrl(null)}
        receiptUrl={selectedReceiptUrl}
      />

      <FuelAnomalyModal
        isOpen={Boolean(selectedAnomaly)}
        onClose={() => setSelectedAnomaly(null)}
        flag={selectedAnomaly}
      />

      {selectedTripModalId && (
        <ErpTripDetailModal
          isOpen={Boolean(selectedTripModalId)}
          onClose={() => setSelectedTripModalId(null)}
          tripId={selectedTripModalId}
        />
      )}
    </>
  );
};

export default AllTransactionsTab;
