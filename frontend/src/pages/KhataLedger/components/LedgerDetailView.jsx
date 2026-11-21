import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Fuel } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import TripService from '../../Trip/services/TripService';
import { getVehicleList } from '../../../services/vehicleListService';
import AddFuelLogModal from './AddFuelLogModal';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import FuelAnomalyModal from './FuelAnomalyModal';
import ErpTripDetailModal from './ErpTripDetailModal';
import { KhataCard, KhataEmpty, KhataPager, KhataPill, KhataTableSkeleton } from './khataUi';
import { LedgerCostStrip, LedgerTripsCard, LedgerBreakdownCards } from './ledgerDetailCards';
import { LedgerFilterSelects } from './ledgerDetailFilters';
import { buildLedgerDetailColumns } from './ledgerDetailColumns';
import {
  EMPTY_SUMMARY,
  buildLedgerParams,
  parseLedgerResponse,
  parseLedgerSummary,
  ledgerTxKey,
  countActiveLedgerFilters,
  tripsInPeriod,
} from './ledgerDetailLogic';
import { getDriverName, getVehicleLabel, getInitialDateRange, plural } from '../utils';
import useErpAvailable from '../useErpAvailable';
import '../KhataLedger.css';
import './khataDetail.css';

const named = (value) => (value && value !== '-' ? value : '');

const LedgerDetailView = ({ entityType, entityId }) => {
  const erpAvailable = useErpAvailable();
  const isDriver = entityType === 'driver';
  const listTab = isDriver ? 'drivers' : 'trucks';

  const [entityData, setEntityData] = useState(null);
  const [entityName, setEntityName] = useState('');
  const [entityLoading, setEntityLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [summary, setSummary] = useState(() => ({ ...EMPTY_SUMMARY }));
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Linked ERP Trips
  const [erpTrips, setErpTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripFinances, setTripFinances] = useState({});

  // Filter states
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [crossFilterId, setCrossFilterId] = useState('');
  const [filterOptions, setFilterOptions] = useState({ vehicles: [], drivers: [] });

  // Modals
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [selectedTripModalId, setSelectedTripModalId] = useState(null);

  useEffect(() => {
    const loadEntity = async (driversPromise) => {
      setEntityLoading(true);
      try {
        if (isDriver) {
          // There is no GET /api/employees/:id; the driver list loaded for the
          // filters already carries the name.
          const drivers = await driversPromise;
          const data = drivers.find((d) => String(d._id ?? d.id) === String(entityId));
          setEntityData(data || null);
          setEntityName(named(getDriverName(data)));
        } else {
          const res = await TripService.getVehicleById(entityId);
          const data = res?.data ?? res;
          setEntityData(data || null);
          setEntityName(named(getVehicleLabel(data)));
        }
      } catch {
        setEntityName('');
      } finally {
        setEntityLoading(false);
      }
    };

    const loadFilterOptions = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          getVehicleList(),
          TripService.getDrivers({ limit: 200 }),
        ]);
        const drivers = dRes?.data || dRes?.results || dRes || [];
        setFilterOptions({
          vehicles: vRes,
          drivers,
        });
        return Array.isArray(drivers) ? drivers : [];
      } catch {
        // Filter dropdowns are a convenience; the ledger still loads without them.
        return [];
      }
    };

    const loadTrips = async () => {
      setTripsLoading(true);
      try {
        const tripList = isDriver
          ? await KhataLedgerService.getDriverTrips(entityId)
          : await KhataLedgerService.getVehicleTrips(entityId);

        const list = Array.isArray(tripList) ? tripList : tripList?.data || [];
        setErpTrips(list);

        // Fetch finances for these trips
        const finances = {};
        await Promise.allSettled(
          list.slice(0, 20).map(async (t) => {
            try {
              const fin = await KhataLedgerService.getErpTripFinance(t._id);
              if (fin?.margin) finances[t._id] = fin.margin;
            } catch {
              // ignore
            }
          }),
        );
        setTripFinances(finances);
      } catch {
        setErpTrips([]);
      } finally {
        setTripsLoading(false);
      }
    };

    loadEntity(loadFilterOptions());
    loadTrips();
  }, [entityId, isDriver]);

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      setSummaryLoading(page === 1);
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
          toast.error(err?.response?.data?.message || err?.message || 'Could not load the ledger');
        }
      } finally {
        setLoading(false);
        setSummaryLoading(false);
      }
    },
    [entityId, isDriver, dateRange, category, source, crossFilterId],
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // The ledger's own rows carry the name when the picker lists don't have it.
  const displayName = useMemo(() => {
    if (entityName) return entityName;
    const row = transactions.find((tx) => (isDriver ? tx.driver : tx.vehicle));
    if (row) return named(isDriver ? getDriverName(row.driver) : getVehicleLabel(row.vehicle));
    return '';
  }, [entityName, transactions, isDriver]);
  const title = displayName || (entityLoading ? '' : isDriver ? 'Driver' : 'Vehicle');

  const descriptor = isDriver
    ? [entityData?.mobileNumber, 'Driver ledger']
    : [
        [entityData?.make || entityData?.manufacturer, entityData?.model].filter(Boolean).join(' '),
        entityData?.vehicleType,
        'Vehicle ledger',
      ];

  // Ledger cost is for the selected period, so trip revenue must be too.
  const periodTrips = useMemo(() => tripsInPeriod(erpTrips, dateRange), [erpTrips, dateRange]);

  const crossOptions = isDriver ? filterOptions.vehicles : filterOptions.drivers;
  const activeFilterCount = countActiveLedgerFilters({ category, source, crossFilterId });

  const columns = useMemo(
    () =>
      buildLedgerDetailColumns({
        isDriver,
        onOpenTrip: (tId) => setSelectedTripModalId(tId),
        onPreviewReceipt: (url) => setSelectedReceiptUrl(url),
        onOpenAnomaly: (flag) => setSelectedAnomaly(flag),
      }),
    [isDriver],
  );

  const clearFilters = () => {
    setCategory('');
    setSource('');
    setCrossFilterId('');
  };

  return (
    <div className="pshell khata-ledger khata-detail">
      <div className="khata-detail-top">
        <nav className="khata-crumbs" aria-label="Breadcrumb">
          <Link to="/khata-ledger">Khata ledger</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/khata-ledger?tab=${listTab}`}>{isDriver ? 'Drivers' : 'Vehicles'}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title || '…'}</span>
        </nav>

        <section
          className="khata-card khata-card--flush khata-hero"
          aria-labelledby="khata-hero-title"
        >
          <div className="khata-hero-top">
            <div className="khata-hero-text">
              <div className="khata-hero-title-row">
                <h1
                  id="khata-hero-title"
                  className={`khata-hero-title${isDriver ? '' : ' is-code'}`}
                >
                  {title || <span className="khata-muted">Loading…</span>}
                </h1>
                <KhataPill>{isDriver ? 'Driver' : 'Vehicle'}</KhataPill>
              </div>
              <p className="khata-hero-desc">{descriptor.filter(Boolean).join(' · ')}</p>
            </div>
            <div className="khata-hero-actions">
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
              <button
                type="button"
                className="khata-btn khata-btn--primary khata-btn--lg"
                onClick={() => setFuelModalOpen(true)}
              >
                <Fuel size={16} aria-hidden="true" />
                Add fuel
              </button>
            </div>
          </div>
          <LedgerCostStrip summary={summary} loading={summaryLoading} />
        </section>
      </div>

      {erpAvailable === true ? (
        <LedgerTripsCard
          trips={periodTrips}
          finances={tripFinances}
          totalCost={summary.totalAmount}
          loading={tripsLoading}
          isDriver={isDriver}
          onOpenTrip={(tId) => setSelectedTripModalId(tId)}
        />
      ) : null}

      <LedgerBreakdownCards
        summary={summary}
        isDriver={isDriver}
        vehicles={filterOptions.vehicles}
        drivers={filterOptions.drivers}
        loading={summaryLoading}
      />

      <KhataCard
        flush
        title={
          <>
            Entries
            {!loading ? (
              <span className="khata-count">{plural(meta.totalResults, 'entry', 'entries')}</span>
            ) : null}
          </>
        }
        subtitle="Expenses, fuel logs and maintenance records in the selected period."
        actions={
          activeFilterCount ? (
            <button type="button" className="khata-link" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null
        }
      >
        <div className="khata-strip">
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
          {activeFilterCount ? (
            <p className="khata-hint">
              The totals above cover the whole period; these filters narrow only this list.
            </p>
          ) : null}
        </div>
        {loading ? (
          <KhataTableSkeleton />
        ) : transactions.length === 0 ? (
          <KhataEmpty icon={BookOpen} title="No entries found">
            {activeFilterCount
              ? 'Nothing matches these filters. Clear them or pick a wider date range.'
              : 'Nothing was recorded in this period. Pick a wider date range.'}
          </KhataEmpty>
        ) : (
          <Table className="khata-table">
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={ledgerTxKey(tx)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(tx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && transactions.length ? (
          <KhataPager
            summary={plural(meta.totalResults, 'entry', 'entries')}
            page={meta.page}
            totalPages={meta.totalPages}
            onPage={fetchData}
          />
        ) : null}
      </KhataCard>

      {/* Fuel Refill Modal */}
      <AddFuelLogModal
        open={fuelModalOpen}
        onClose={() => setFuelModalOpen(false)}
        driverId={isDriver ? entityId : undefined}
        vehicleId={!isDriver ? entityId : undefined}
        onAdded={() => fetchData(meta.page)}
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

      {/* ERP Trip Details Drill-down Modal */}
      {selectedTripModalId && (
        <ErpTripDetailModal
          isOpen={Boolean(selectedTripModalId)}
          onClose={() => setSelectedTripModalId(null)}
          tripId={selectedTripModalId}
        />
      )}
    </div>
  );
};

export default LedgerDetailView;
