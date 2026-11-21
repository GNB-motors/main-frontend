import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Route } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import KhataKpiGrid from './KhataKpiGrid';
import KhataLedgerService, {
  ERP_DISABLED_MESSAGE,
  isErpDisabledError,
} from '../KhataLedgerService';
import ErpTripDetailModal from './ErpTripDetailModal';
import { ERP_TRIP_STATES, tripStateLabel, tripStateTone } from './erpTripStates';
import {
  KhataCard,
  KhataEmpty,
  KhataError,
  KhataField,
  KhataPager,
  KhataPill,
  KhataSectionHead,
  KhataSearch,
  KhataTableSkeleton,
} from './khataUi';
import logger from '../../../utils/logger.js';
import {
  formatCurrency,
  formatDate,
  formatKm,
  formatCostPerKm,
  getProfitabilityStatus,
  getDriverName,
  getVehicleLabel,
  plural,
} from '../utils';
import './khataTrips.css';

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Latest first' },
  { value: 'profit_desc', label: 'Highest profit' },
  { value: 'profit_asc', label: 'Lowest profit' },
  { value: 'cost_desc', label: 'Highest cost' },
  { value: 'revenue_desc', label: 'Highest revenue' },
  { value: 'cost_km_desc', label: 'Highest cost per km' },
];

const PROFIT_TONES = { PROFITABLE: 'ok', LOSS_MAKING: 'bad' };

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);
const named = (label) => (label && label !== '-' ? label : null);

const tripNumberOf = (trip) => trip.tripNumber || `TRIP-${trip._id.slice(-6).toUpperCase()}`;

const ErpTripsTab = ({ vehicles = [], drivers = [] }) => {
  const [trips, setTrips] = useState([]);
  const [tripFinances, setTripFinances] = useState({});
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  // Organisations without ERP get a 404 on the trip endpoints — that is not
  // "no trips yet", so it gets its own empty state.
  const [erpDisabled, setErpDisabled] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [profitabilityFilter, setProfitabilityFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTrips = useCallback(
    async (page = 1) => {
      setLoading(true);
      setLoadError(null);
      try {
        // The trip list accepts neither branchId nor driverId; the branch comes
        // from the shared X-Branch-Id header and the driver filter is applied below.
        const params = { page, limit: 20 };
        if (search) params.search = search;
        if (statusFilter) params.state = statusFilter;
        if (vehicleFilter) params.vehicleId = vehicleFilter;

        const res = await KhataLedgerService.getErpTrips(params);
        const tripList = res.data || res.results || (Array.isArray(res) ? res : []);
        setTrips(tripList);
        setMeta({
          page: res.meta?.page || page,
          totalPages: res.meta?.totalPages || 1,
          total: res.meta?.total || tripList.length,
        });

        const finances = {};
        await Promise.allSettled(
          tripList.map(async (t) => {
            try {
              const fin = await KhataLedgerService.getErpTripFinance(t._id);
              if (fin?.margin) {
                finances[t._id] = fin.margin;
              }
            } catch {
              // One trip's missing margin leaves that row without figures.
            }
          }),
        );
        setTripFinances(finances);
        setErpDisabled(false);
      } catch (err) {
        logger.error('Failed to load ERP Trips:', err);
        setTrips([]);
        if (isErpDisabledError(err)) setErpDisabled(true);
        else setLoadError(err?.response?.data?.message || err?.message || 'The request failed.');
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, vehicleFilter],
  );

  useEffect(() => {
    fetchTrips(1);
  }, [fetchTrips]);

  const enrichedTrips = useMemo(() => {
    return trips.map((t) => {
      const margin = tripFinances[t._id];
      const revenue = margin?.revenue != null ? margin.revenue : 0;
      const cost = margin?.cost != null ? margin.cost : 0;
      const profit = revenue - cost;
      const distance = t.totalKm || null;
      const costPerKm = distance && distance > 0 && cost > 0 ? cost / distance : null;
      const vehicle = vehicles.find((v) => v._id === idOf(t.vehicleId));
      const driver = drivers.find((d) => d._id === idOf(t.driverId));
      return {
        ...t,
        hasFinance: Boolean(margin),
        revenue,
        cost,
        profit,
        distance,
        costPerKm,
        profitStatus: getProfitabilityStatus(revenue, cost),
        vehicleLabel:
          t.vehicleNumber ||
          named(getVehicleLabel(vehicle)) ||
          (typeof t.vehicleId === 'object' ? named(getVehicleLabel(t.vehicleId)) : null),
        driverLabel:
          named(getDriverName(driver)) ||
          (typeof t.driverId === 'object' ? named(getDriverName(t.driverId)) : null),
      };
    });
  }, [trips, tripFinances, vehicles, drivers]);

  const processedTrips = useMemo(() => {
    let result = [...enrichedTrips];

    if (profitabilityFilter === 'PROFITABLE') {
      result = result.filter((t) => t.profit > 0);
    } else if (profitabilityFilter === 'LOSS_MAKING') {
      result = result.filter((t) => t.profit < 0);
    } else if (profitabilityFilter === 'UNBILLED') {
      result = result.filter((t) => t.revenue === 0);
    }

    // The trip endpoint has no driver filter, so narrow the loaded page here.
    if (driverFilter) {
      result = result.filter((t) => String(t.driverId?._id || t.driverId) === String(driverFilter));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'profit_desc':
          return b.profit - a.profit;
        case 'profit_asc':
          return a.profit - b.profit;
        case 'cost_desc':
          return b.cost - a.cost;
        case 'revenue_desc':
          return b.revenue - a.revenue;
        case 'cost_km_desc':
          return (b.costPerKm || 0) - (a.costPerKm || 0);
        case 'date_desc':
        default:
          return new Date(b.tripDate || b.createdAt) - new Date(a.tripDate || a.createdAt);
      }
    });

    return result;
  }, [enrichedTrips, profitabilityFilter, sortBy, driverFilter]);

  const pageTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let profitableCount = 0;
    let lossCount = 0;
    let withFinance = 0;

    processedTrips.forEach((t) => {
      totalRevenue += t.revenue;
      totalCost += t.cost;
      if (t.hasFinance) withFinance += 1;
      if (t.profit > 0) profitableCount += 1;
      if (t.profit < 0) lossCount += 1;
    });

    return {
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
      profitableCount,
      lossCount,
      withFinance,
    };
  }, [processedTrips]);

  const filtersActive = Boolean(
    search || statusFilter || profitabilityFilter !== 'ALL' || vehicleFilter || driverFilter,
  );

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setProfitabilityFilter('ALL');
    setVehicleFilter('');
    setDriverFilter('');
    setSortBy('date_desc');
  };

  // A page with no trip finances has no revenue or cost to show, not ₹0.
  const noFinances = Boolean(loadError) || pageTotals.withFinance === 0;
  const financeNote = loadError
    ? 'Trips could not be loaded'
    : `Finances for ${pageTotals.withFinance} of ${processedTrips.length} trips`;
  const money = (value) => (noFinances ? '—' : formatCurrency(value));
  const netTone =
    pageTotals.netProfit < 0 ? 'critical' : pageTotals.netProfit > 0 ? 'ok' : 'neutral';

  const title = 'ERP trips';
  const subtitle =
    'Trips with their revenue, advances, fuel and margin. Figures cover the trips on this page.';

  // Without ERP there are no trips to filter or sum, so the tab says that once.
  if (erpDisabled && !loading) {
    return (
      <KhataCard
        flush
        title={title}
        subtitle="Trips with their revenue, advances, fuel and margin."
      >
        <KhataEmpty icon={Route} title={ERP_DISABLED_MESSAGE}>
          Trip revenue, advances and margins show up here once ERP is switched on for your
          organisation. Expenses, drivers and vehicles in the other tabs work without it.
        </KhataEmpty>
      </KhataCard>
    );
  }

  return (
    <>
      <KhataSectionHead
        title={title}
        subtitle={subtitle}
        actions={
          <button
            type="button"
            className="khata-btn"
            onClick={() => fetchTrips(meta.page)}
            disabled={loading}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Refresh
          </button>
        }
      />
      <KhataKpiGrid
        label="ERP trip totals"
        loading={loading}
        items={[
          {
            label: 'Trip revenue',
            value: money(pageTotals.totalRevenue),
            sub: financeNote,
          },
          {
            label: 'Trip costs',
            value: money(pageTotals.totalCost),
            sub: 'Advances, fuel and hire costs',
          },
          {
            label: 'Net margin',
            value: money(pageTotals.netProfit),
            sub: 'Revenue minus costs',
            status: noFinances
              ? null
              : pageTotals.netProfit < 0
                ? 'Loss-making'
                : pageTotals.netProfit > 0
                  ? 'Profitable'
                  : 'Break-even',
            tone: netTone,
          },
          {
            label: 'Trip health',
            value: noFinances ? '—' : `${pageTotals.profitableCount} profitable`,
            sub:
              !noFinances && pageTotals.lossCount > 0
                ? `${pageTotals.lossCount} loss-making · ${plural(processedTrips.length, 'trip')}`
                : plural(processedTrips.length, 'trip'),
            noteTone: !noFinances && pageTotals.lossCount > 0 ? 'bad' : undefined,
          },
        ]}
      />

      <KhataCard
        flush
        title={
          <>
            Trips
            {!loading && !loadError ? (
              <span className="khata-count">{plural(meta.total, 'trip')}</span>
            ) : null}
          </>
        }
        actions={
          <KhataSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search trips"
            label="Search trips by number, vehicle, driver or route"
          />
        }
      >
        <div className="khata-strip">
          <div className="khata-filters">
            <KhataField label="Status" htmlFor="erp-filter-status">
              <SearchableSelect
                id="erp-filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {ERP_TRIP_STATES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
            <KhataField label="Profitability" htmlFor="erp-filter-profitability">
              <SearchableSelect
                id="erp-filter-profitability"
                value={profitabilityFilter}
                onChange={(e) => setProfitabilityFilter(e.target.value)}
              >
                <option value="ALL">All outcomes</option>
                <option value="PROFITABLE">Profitable</option>
                <option value="LOSS_MAKING">Loss-making</option>
                <option value="UNBILLED">Unbilled (no revenue)</option>
              </SearchableSelect>
            </KhataField>
            <KhataField label="Vehicle" htmlFor="erp-filter-vehicle">
              <SearchableSelect
                id="erp-filter-vehicle"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
              >
                <option value="">All vehicles</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {getVehicleLabel(v)}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
            <KhataField label="Driver" htmlFor="erp-filter-driver">
              <SearchableSelect
                id="erp-filter-driver"
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
              >
                <option value="">All drivers</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {getDriverName(d)}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
            <KhataField label="Sort by" htmlFor="erp-sort">
              <SearchableSelect
                id="erp-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
            {filtersActive ? (
              <button
                type="button"
                className="khata-link khata-filters-clear"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <KhataTableSkeleton rows={6} />
        ) : loadError ? (
          <div className="khata-strip">
            <KhataError title="Could not load ERP trips" onRetry={() => fetchTrips(meta.page)}>
              {loadError}
            </KhataError>
          </div>
        ) : processedTrips.length === 0 ? (
          <KhataEmpty
            icon={Route}
            title="No ERP trips found"
            action={
              filtersActive ? (
                <button type="button" className="khata-btn" onClick={handleClearFilters}>
                  Clear filters
                </button>
              ) : null
            }
          >
            No trips match this location or these filters.
          </KhataEmpty>
        ) : (
          <Table className="khata-table">
            <TableHeader>
              <TableRow>
                <TableHead>Trip number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="is-num">Revenue</TableHead>
                <TableHead className="is-num">Total cost</TableHead>
                <TableHead className="is-num">Profit / loss</TableHead>
                <TableHead className="is-num">Cost / km</TableHead>
                <TableHead className="is-end">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedTrips.map((trip) => {
                const tripNumber = tripNumberOf(trip);
                const route =
                  trip.fromLocation && trip.toLocation
                    ? `${trip.fromLocation} → ${trip.toLocation}`
                    : trip.fromLocation || trip.toLocation;
                return (
                  <TableRow key={trip._id}>
                    <TableCell>
                      <button
                        type="button"
                        className="khata-link khata-trip-link"
                        onClick={() => setSelectedTrip(trip)}
                      >
                        {tripNumber}
                      </button>
                    </TableCell>
                    <TableCell className="is-secondary is-date">
                      {formatDate(trip.tripDate || trip.createdAt)}
                    </TableCell>
                    <TableCell>
                      {route ? (
                        <span className="khata-cell-main">{route}</span>
                      ) : (
                        <span className="khata-muted">—</span>
                      )}
                      {trip.material ? (
                        <span className="khata-cell-sub">{trip.material}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="is-code">
                      {trip.vehicleLabel || <span className="khata-muted">—</span>}
                    </TableCell>
                    <TableCell>
                      {trip.driverLabel || <span className="khata-muted">—</span>}
                    </TableCell>
                    <TableCell>
                      <KhataPill tone={tripStateTone(trip.state)}>
                        {tripStateLabel(trip.state)}
                      </KhataPill>
                    </TableCell>
                    <TableCell className="is-num">
                      {trip.hasFinance ? formatCurrency(trip.revenue) : '—'}
                    </TableCell>
                    <TableCell className="is-num">
                      {trip.hasFinance ? formatCurrency(trip.cost) : '—'}
                    </TableCell>
                    <TableCell className="is-num">
                      {trip.hasFinance ? (
                        <span className="khata-num-stack">
                          <span
                            className={
                              trip.profit < 0 ? 'is-loss' : trip.profit > 0 ? 'is-gain' : ''
                            }
                          >
                            {formatCurrency(trip.profit)}
                          </span>
                          <KhataPill tone={PROFIT_TONES[trip.profitStatus.status]} small>
                            {trip.profitStatus.label}
                          </KhataPill>
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="is-num">
                      {trip.costPerKm ? (
                        <>
                          {formatCostPerKm(trip.cost, trip.distance)}
                          <span className="khata-cell-sub">{formatKm(trip.distance)}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="is-end">
                      <button
                        type="button"
                        className="khata-link"
                        onClick={() => setSelectedTrip(trip)}
                        aria-label={`Details for ${tripNumber}`}
                      >
                        Details →
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {!loading && !loadError && processedTrips.length > 0 ? (
          <KhataPager
            summary={
              driverFilter
                ? `${plural(processedTrips.length, 'trip')} for this driver on this page`
                : plural(meta.total, 'trip')
            }
            page={meta.page}
            totalPages={meta.totalPages}
            onPage={fetchTrips}
          />
        ) : null}
      </KhataCard>

      {selectedTrip && (
        <ErpTripDetailModal
          isOpen={Boolean(selectedTrip)}
          onClose={() => setSelectedTrip(null)}
          tripId={selectedTrip._id}
          initialTripData={selectedTrip}
        />
      )}
    </>
  );
};

export default ErpTripsTab;
