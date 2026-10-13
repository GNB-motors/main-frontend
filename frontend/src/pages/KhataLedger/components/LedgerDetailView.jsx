import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Fuel,
  ChevronLeft,
  ChevronRight,
  Route,
  Truck,
  User,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import TripService from '../../Trip/services/TripService';
import PageShell from '@/components/ui/PageShell';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import AddFuelLogModal from './AddFuelLogModal';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import FuelAnomalyModal from './FuelAnomalyModal';
import ErpTripDetailModal from './ErpTripDetailModal';
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
import {
  getDriverName,
  getVehicleLabel,
  getInitialDateRange,
  formatCurrency,
  formatDate,
  formatKm,
  TRIP_STATE_LABELS,
  TRIP_STATE_COLORS,
} from '../utils';

const LedgerDetailView = ({ entityType, entityId }) => {
  const navigate = useNavigate();
  const isDriver = entityType === 'driver';

  const [entityName, setEntityName] = useState('');
  const [_entityData, setEntityData] = useState(null);
  const [entityLoading, setEntityLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [summary, setSummary] = useState(() => ({ ...EMPTY_SUMMARY }));

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
          setEntityData(data);
          setEntityName(getDriverName(data) || 'Driver Ledger');
        } else {
          const res = await TripService.getVehicleById(entityId);
          const data = res?.data ?? res;
          setEntityData(data);
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
        const drivers = dRes?.data || dRes?.results || dRes || [];
        setFilterOptions({
          vehicles: vRes?.data || vRes?.results || vRes || [],
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

  // Aggregate trip financials for this entity
  const tripTotals = useMemo(() => {
    let totalRev = 0;
    let totalDist = 0;

    erpTrips.forEach((t) => {
      const fin = tripFinances[t._id];
      if (fin?.revenue) totalRev += fin.revenue;
      if (t.totalKm && t.totalKm > 0) totalDist += t.totalKm;
    });

    const netProfit = totalRev - (summary.totalAmount || 0);

    return {
      totalRevenue: totalRev,
      totalDistanceKm: totalDist,
      netProfit,
    };
  }, [erpTrips, tripFinances, summary.totalAmount]);

  const crossOptions = isDriver ? filterOptions.vehicles : filterOptions.drivers;
  const activeFilterCount = countActiveLedgerFilters({ category, source, crossFilterId });

  // Columns with clickable handlers
  const columns = useMemo(() => {
    return buildLedgerDetailColumns({
      onOpenTrip: (tId) => setSelectedTripModalId(tId),
      onPreviewReceipt: (url) => setSelectedReceiptUrl(url),
      onOpenAnomaly: (flag) => setSelectedAnomaly(flag),
    });
  }, []);

  const clearFilters = () => {
    setCategory('');
    setSource('');
    setCrossFilterId('');
  };

  return (
    <PageShell
      title={entityLoading ? (isDriver ? 'Driver Ledger' : 'Truck Ledger') : entityName}
      subtitle={`${isDriver ? 'Driver' : 'Truck'} financial ledger — operational trips, transactions & cost per KM`}
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
            title="Back to Khata Ledger"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
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
            <span className="text-xs text-muted-foreground">
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
      {/* Upgraded Financial KPI Cards */}
      <LedgerSummaryCards
        summary={summary}
        isDriver={isDriver}
        vehicles={filterOptions.vehicles}
        drivers={filterOptions.drivers}
        tripsCount={erpTrips.length}
        distanceKm={tripTotals.totalDistanceKm}
        revenue={tripTotals.totalRevenue}
        profit={tripTotals.netProfit}
        pendingAmount={0}
        walletAmount={null}
      />

      {/* Linked ERP Trips Strip (Mandatory Section) */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Route size={16} className="text-indigo-600" />
              <span>Assigned ERP Trips ({erpTrips.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Commercial journeys associated with this {isDriver ? 'driver' : 'vehicle'}
            </p>
          </div>
        </div>

        {tripsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : erpTrips.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No ERP trips recorded for this {isDriver ? 'driver' : 'vehicle'}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {erpTrips.slice(0, 6).map((t) => {
              const fin = tripFinances[t._id];
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTripModalId(t._id)}
                  className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-indigo-50/60 hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-indigo-700 group-hover:underline flex items-center gap-1">
                      <Route size={12} />
                      {t.tripNumber || `TRIP-${t._id.slice(-6).toUpperCase()}`}
                    </span>
                    <Badge
                      className={`text-[10px] ${TRIP_STATE_COLORS[t.state] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {TRIP_STATE_LABELS[t.state] || t.state || 'PLACED'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-700 font-medium truncate">
                    {t.fromLocation && t.toLocation
                      ? `${t.fromLocation} → ${t.toLocation}`
                      : 'Route unassigned'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-1.5 border-t border-gray-200/60">
                    <span>{formatDate(t.tripDate || t.createdAt)}</span>
                    {fin?.revenue != null ? (
                      <span className="font-semibold text-emerald-700">
                        Rev: {formatCurrency(fin.revenue)}
                      </span>
                    ) : (
                      <span>{t.totalKm ? formatKm(t.totalKm) : ''}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Breakdown Cards */}
      <LedgerBreakdownCards
        summary={summary}
        isDriver={isDriver}
        vehicles={filterOptions.vehicles}
        drivers={filterOptions.drivers}
      />

      {/* Transactions Table with Trip & Receipt links */}
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
    </PageShell>
  );
};

export default LedgerDetailView;
