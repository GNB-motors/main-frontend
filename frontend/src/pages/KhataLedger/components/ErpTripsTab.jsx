import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Route,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Truck,
  User,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KhataKpiGrid from './KhataKpiGrid';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import KhataLedgerService from '../KhataLedgerService';
import ErpTripDetailModal from './ErpTripDetailModal';
import { useActiveBranch } from '../../../contexts/BranchContext';
import logger from '../../../utils/logger.js';
import {
  formatCurrency,
  formatDate,
  formatKm,
  formatCostPerKm,
  getProfitabilityStatus,
  TRIP_STATE_LABELS,
  TRIP_STATE_COLORS,
  getDriverName,
  getVehicleLabel,
} from '../utils';

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Latest First' },
  { value: 'profit_desc', label: 'Highest Profit' },
  { value: 'profit_asc', label: 'Lowest Profit (Loss-making)' },
  { value: 'cost_desc', label: 'Highest Cost' },
  { value: 'revenue_desc', label: 'Highest Revenue' },
  { value: 'cost_km_desc', label: 'Highest Cost/KM' },
];

const ErpTripsTab = ({ vehicles = [], drivers = [] }) => {
  const { branchId, activeBranch } = useActiveBranch();
  const [trips, setTrips] = useState([]);
  const [tripFinances, setTripFinances] = useState({});
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filters & Search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [profitabilityFilter, setProfitabilityFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showFilters, setShowFilters] = useState(false);

  // Selected Trip modal
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTrips = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (branchId) params.branchId = branchId;
        if (search) params.search = search;
        if (statusFilter) params.state = statusFilter;
        if (vehicleFilter) params.vehicleId = vehicleFilter;
        if (driverFilter) params.driverId = driverFilter;

        const res = await KhataLedgerService.getErpTrips(params);
        const tripList = res.data || res.results || (Array.isArray(res) ? res : []);
        setTrips(tripList);
        setMeta({
          page: res.meta?.page || page,
          totalPages: res.meta?.totalPages || 1,
          total: res.meta?.total || tripList.length,
        });

        // Concurrently fetch financial snapshots for the visible page of trips
        const finances = {};
        await Promise.allSettled(
          tripList.map(async (t) => {
            try {
              const fin = await KhataLedgerService.getErpTripFinance(t._id);
              if (fin?.margin) {
                finances[t._id] = fin.margin;
              }
            } catch {
              // Non-critical; individual margin errors gracefully ignored
            }
          }),
        );
        setTripFinances(finances);
      } catch (err) {
        logger.error('Failed to load ERP Trips:', err);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    },
    [branchId, search, statusFilter, vehicleFilter, driverFilter],
  );

  useEffect(() => {
    fetchTrips(1);
  }, [fetchTrips]);

  // Compute enriched trip rows with financial figures
  const enrichedTrips = useMemo(() => {
    return trips.map((t) => {
      const margin = tripFinances[t._id];
      const revenue = margin?.revenue != null ? margin.revenue : 0;
      const cost = margin?.cost != null ? margin.cost : 0;
      const profit = revenue - cost;
      const distance = t.totalKm || null;
      const costPerKm = distance && distance > 0 && cost > 0 ? cost / distance : null;
      const profitStatus = getProfitabilityStatus(revenue, cost);

      return {
        ...t,
        revenue,
        cost,
        profit,
        distance,
        costPerKm,
        profitStatus,
      };
    });
  }, [trips, tripFinances]);

  // Client-side profitability filter and sorting
  const processedTrips = useMemo(() => {
    let result = [...enrichedTrips];

    // Filter by profitability
    if (profitabilityFilter === 'PROFITABLE') {
      result = result.filter((t) => t.profit > 0);
    } else if (profitabilityFilter === 'LOSS_MAKING') {
      result = result.filter((t) => t.profit < 0);
    } else if (profitabilityFilter === 'UNBILLED') {
      result = result.filter((t) => t.revenue === 0);
    }

    // Sort
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
  }, [enrichedTrips, profitabilityFilter, sortBy]);

  // Summary Metrics across loaded page
  const pageTotals = useMemo(() => {
    let totalRev = 0;
    let totalCost = 0;
    let profitableCount = 0;
    let lossCount = 0;

    processedTrips.forEach((t) => {
      totalRev += t.revenue;
      totalCost += t.cost;
      if (t.profit > 0) profitableCount++;
      if (t.profit < 0) lossCount++;
    });

    return {
      totalRevenue: totalRev,
      totalCost,
      netProfit: totalRev - totalCost,
      profitableCount,
      lossCount,
    };
  }, [processedTrips]);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setProfitabilityFilter('ALL');
    setVehicleFilter('');
    setDriverFilter('');
    setSortBy('date_desc');
  };

  return (
    <div className="space-y-5">
      {/* Header & Subtitle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">ERP Trips Ledger</h2>
            <Badge
              variant="outline"
              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {activeBranch ? activeBranch.name : 'All Locations'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Commercial trips connected to revenue, advances, fuel and operating margin
          </p>
        </div>

        <button
          onClick={() => fetchTrips(meta.page)}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Trips
        </button>
      </div>

      <KhataKpiGrid
        loading={loading}
        items={[
          {
            label: 'Trip Revenue',
            value: formatCurrency(pageTotals.totalRevenue),
            sub: 'Sale bills for shown trips',
          },
          {
            label: 'Trip Expenses',
            value: formatCurrency(pageTotals.totalCost),
            sub: 'Advances, fuel & hire costs',
          },
          {
            label: 'Net Margin',
            icon: pageTotals.netProfit < 0 ? TrendingDown : TrendingUp,
            value: formatCurrency(pageTotals.netProfit),
            sub: 'Revenue minus costs',
            status:
              pageTotals.netProfit < 0
                ? 'Loss-making'
                : pageTotals.netProfit > 0
                  ? 'Profitable'
                  : 'Break-even',
            tone:
              pageTotals.netProfit < 0 ? 'critical' : pageTotals.netProfit > 0 ? 'ok' : 'neutral',
          },
          {
            label: 'Trip Health',
            value: `${pageTotals.profitableCount} profitable`,
            sub: `${processedTrips.length} trips loaded`,
            status: pageTotals.lossCount > 0 ? `${pageTotals.lossCount} loss-making` : null,
            tone: 'critical',
          },
        ]}
      />

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: 240 }}>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                aria-label="Search trips"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Search by trip number, vehicle, driver, route..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={15} className="text-gray-400" />
              <select
                aria-label="Sort trips"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Filters button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                showFilters ||
                statusFilter ||
                profitabilityFilter !== 'ALL' ||
                vehicleFilter ||
                driverFilter
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={15} />
              Filters
            </button>
          </div>

          {/* Expanded Filter Row */}
          {showFilters && (
            <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <label
                  htmlFor="erp-filter-status"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Trip Status
                </label>
                <select
                  id="erp-filter-status"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PLANNED">Planned</option>
                  <option value="PLACED">Placed</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="erp-filter-profitability"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Profitability
                </label>
                <select
                  id="erp-filter-profitability"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white"
                  value={profitabilityFilter}
                  onChange={(e) => setProfitabilityFilter(e.target.value)}
                >
                  <option value="ALL">All Financial Outcomes</option>
                  <option value="PROFITABLE">Profitable Only</option>
                  <option value="LOSS_MAKING">Loss-making Only</option>
                  <option value="UNBILLED">Unbilled (Revenue ₹0)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="erp-filter-vehicle"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Vehicle
                </label>
                <select
                  id="erp-filter-vehicle"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white"
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
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
                <label
                  htmlFor="erp-filter-driver"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Driver
                </label>
                <select
                  id="erp-filter-driver"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white"
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                >
                  <option value="">All Drivers</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {getDriverName(d)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Trips Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : processedTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <Route size={42} className="opacity-30 text-indigo-600" />
              <p className="text-base font-semibold text-gray-800">No ERP Trips found</p>
              <p className="text-xs text-gray-500 max-w-sm">
                No trips matching your active location or filter criteria. Try adjusting your search
                or filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-[130px]">Trip Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Profit / Loss</TableHead>
                    <TableHead className="text-right">Cost / KM</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedTrips.map((trip) => {
                    const isLoss = trip.profit < 0;
                    return (
                      <TableRow
                        key={trip._id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isLoss ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* Trip Number */}
                        <TableCell className="font-semibold whitespace-nowrap">
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                            title="Click to view full financial breakdown"
                          >
                            <span>
                              {trip.tripNumber || `TRIP-${trip._id.slice(-6).toUpperCase()}`}
                            </span>
                          </button>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="whitespace-nowrap text-xs text-gray-600">
                          {formatDate(trip.tripDate || trip.createdAt)}
                        </TableCell>

                        {/* Route */}
                        <TableCell>
                          <span className="text-xs font-medium text-gray-800 block">
                            {trip.fromLocation && trip.toLocation
                              ? `${trip.fromLocation} → ${trip.toLocation}`
                              : trip.fromLocation || trip.toLocation || '-'}
                          </span>
                          {trip.material && (
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                              {trip.material}
                            </span>
                          )}
                        </TableCell>

                        {/* Vehicle */}
                        <TableCell className="text-xs">
                          <span className="flex items-center gap-1 font-medium text-gray-800">
                            <Truck size={13} className="text-gray-400" />
                            {trip.vehicleNumber ||
                              (trip.vehicleId && getVehicleLabel(trip.vehicleId)) ||
                              '-'}
                          </span>
                        </TableCell>

                        {/* Driver */}
                        <TableCell className="text-xs">
                          <span className="flex items-center gap-1 text-gray-700">
                            <User size={13} className="text-gray-400" />
                            {(trip.driverId && getDriverName(trip.driverId)) || '-'}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            className={`text-[11px] font-semibold ${
                              TRIP_STATE_COLORS[trip.state] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {TRIP_STATE_LABELS[trip.state] || trip.state || 'PLACED'}
                          </Badge>
                        </TableCell>

                        {/* Revenue */}
                        <TableCell className="text-right font-medium text-blue-900 text-xs">
                          {formatCurrency(trip.revenue)}
                        </TableCell>

                        {/* Total Cost */}
                        <TableCell className="text-right font-medium text-amber-900 text-xs">
                          {formatCurrency(trip.cost)}
                        </TableCell>

                        {/* Profit / Loss */}
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-xs font-bold ${
                                trip.profit >= 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700 font-extrabold'
                              }`}
                            >
                              {formatCurrency(trip.profit)}
                            </span>
                            <Badge
                              className={`text-[10px] px-1 py-0 mt-0.5 ${trip.profitStatus.color}`}
                            >
                              {trip.profitStatus.label}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Cost / KM */}
                        <TableCell className="text-right text-xs whitespace-nowrap text-purple-900">
                          {trip.costPerKm ? (
                            <div>
                              <span className="font-semibold">
                                {formatCostPerKm(trip.cost, trip.distance)}
                              </span>
                              <span className="text-[10px] text-gray-500 block">
                                {formatKm(trip.distance)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px]">Unavailable</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-center">
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            title="Open Trip Financial Details"
                          >
                            <ExternalLink size={12} />
                            Details
                          </button>
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
                Page {meta.page} of {meta.totalPages} ({meta.total} trips total)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchTrips(meta.page - 1)}
                  className="rounded-lg border bg-white p-2 text-sm disabled:opacity-40"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchTrips(meta.page + 1)}
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

      {/* Financial Details Modal for Trip */}
      {selectedTrip && (
        <ErpTripDetailModal
          isOpen={Boolean(selectedTrip)}
          onClose={() => setSelectedTrip(null)}
          tripId={selectedTrip._id}
          initialTripData={selectedTrip}
        />
      )}
    </div>
  );
};

export default ErpTripsTab;
