import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Fuel, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import TripService from '../../Trip/services/TripService';
import PageShell from '@/components/ui/PageShell';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import AddFuelLogModal from './AddFuelLogModal';
import { LedgerSummaryCards, LedgerBreakdownCards } from './ledgerDetailCards';
import { LedgerFilterSelects } from './ledgerDetailFilters';
import { buildLedgerDetailColumns } from './ledgerDetailColumns';
import {
  EMPTY_SUMMARY,
  buildLedgerParams,
  parseLedgerResponse,
  parseLedgerSummary,
  ledgerTxKey,
  countActiveLedgerFilters,
} from './ledgerDetailLogic';
import { getDriverName, getVehicleLabel, getInitialDateRange } from '../utils';

const LedgerDetailView = ({ entityType, entityId }) => {
  const navigate = useNavigate();
  const isDriver = entityType === 'driver';

  const [entityName, setEntityName] = useState('');
  const [entityLoading, setEntityLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [summary, setSummary] = useState(() => ({ ...EMPTY_SUMMARY }));

  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [crossFilterId, setCrossFilterId] = useState('');
  const [fuelModalOpen, setFuelModalOpen] = useState(false);

  const [filterOptions, setFilterOptions] = useState({ vehicles: [], drivers: [] });

  useEffect(() => {
    const loadEntity = async () => {
      setEntityLoading(true);
      try {
        if (isDriver) {
          const res = await TripService.getDriverById(entityId);
          const data = res?.data ?? res;
          setEntityName(getDriverName(data) || 'Driver Ledger');
        } else {
          const res = await TripService.getVehicleById(entityId);
          const data = res?.data ?? res;
          setEntityName(getVehicleLabel(data) || 'Truck Ledger');
        }
      } catch {
        setEntityName(isDriver ? 'Driver Ledger' : 'Truck Ledger');
      } finally {
        setEntityLoading(false);
      }
    };

    const loadFilterOptions = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          TripService.getVehicles({ limit: 200 }),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setFilterOptions({
          vehicles: vRes?.data || vRes?.results || vRes || [],
          drivers: dRes?.data || dRes?.results || dRes || [],
        });
      } catch {
        // Filter dropdowns are a convenience; the ledger still loads without them.
      }
    };

    loadEntity();
    loadFilterOptions();
  }, [entityId, isDriver]);

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = buildLedgerParams({
          page,
          dateRange,
          category,
          source,
          crossFilterId,
          isDriver,
        });

        const [ledgerData, summaryData] = await Promise.all([
          isDriver
            ? KhataLedgerService.getDriverLedger(entityId, params)
            : KhataLedgerService.getVehicleLedger(entityId, params),
          isDriver
            ? KhataLedgerService.getDriverSummary(entityId, params)
            : KhataLedgerService.getVehicleSummary(entityId, params),
        ]);

        const parsed = parseLedgerResponse(ledgerData);
        setTransactions(parsed.transactions);
        setMeta(parsed.meta);
        setSummary(parseLedgerSummary(summaryData));
      } catch (err) {
        if (err?.response?.status === 404) {
          setTransactions([]);
          setMeta({ page: 1, totalPages: 1, totalResults: 0 });
          setSummary({ ...EMPTY_SUMMARY });
        } else {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to load ledger');
        }
      } finally {
        setLoading(false);
      }
    },
    [entityId, isDriver, dateRange, category, source, crossFilterId],
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const crossOptions = isDriver ? filterOptions.vehicles : filterOptions.drivers;
  const activeFilterCount = countActiveLedgerFilters({ category, source, crossFilterId });
  const columns = buildLedgerDetailColumns();

  const clearFilters = () => {
    setCategory('');
    setSource('');
    setCrossFilterId('');
  };

  return (
    <PageShell
      title={entityLoading ? (isDriver ? 'Driver Ledger' : 'Truck Ledger') : entityName}
      subtitle={`${isDriver ? 'Driver' : 'Truck'} ledger — merged transactions and summaries`}
      count={meta.totalResults}
      actions={
        <>
          <button
            type="button"
            onClick={() =>
              navigate('/khata-ledger', { state: { tab: isDriver ? 'drivers' : 'trucks' } })
            }
            className="pshell-btn"
            aria-label="Back to Khata Ledger"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setFuelModalOpen(true)}
            className="pshell-btn pshell-btn--primary"
          >
            <Fuel size={16} />
            Add Fuel
          </button>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </>
      }
      filters={
        <FilterBar
          activeCount={activeFilterCount}
          onClear={clearFilters}
          right={
            <LedgerFilterSelects
              isDriver={isDriver}
              category={category}
              source={source}
              crossFilterId={crossFilterId}
              crossOptions={crossOptions}
              onCategoryChange={setCategory}
              onSourceChange={setSource}
              onCrossFilterChange={setCrossFilterId}
            />
          }
        />
      }
      footer={
        meta.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.totalResults} total)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => fetchData(meta.page - 1)}
                className="pshell-btn"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchData(meta.page + 1)}
                className="pshell-btn"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : null
      }
    >
      <LedgerSummaryCards
        summary={summary}
        isDriver={isDriver}
        vehicles={filterOptions.vehicles}
        drivers={filterOptions.drivers}
      />
      <LedgerBreakdownCards
        summary={summary}
        isDriver={isDriver}
        vehicles={filterOptions.vehicles}
        drivers={filterOptions.drivers}
      />
      <DataTable
        columns={columns}
        rows={transactions}
        rowKey={ledgerTxKey}
        loading={loading}
        showing={transactions.length}
        total={meta.totalResults}
        activeFilters={activeFilterCount}
        emptyTitle="No transactions found"
        emptyHint="Try widening the date range or clearing the filters."
      />
      <AddFuelLogModal
        open={fuelModalOpen}
        onClose={() => setFuelModalOpen(false)}
        driverId={isDriver ? entityId : undefined}
        vehicleId={!isDriver ? entityId : undefined}
        onAdded={() => fetchData(meta.page)}
      />
    </PageShell>
  );
};

export default LedgerDetailView;
