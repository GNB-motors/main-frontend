import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  AlertCircle,
  RefreshCw,
  Fuel,
  Wrench,
  Receipt,
  Route,
  Clock,
  Gauge,
  Filter,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import KhataLedgerService from '../KhataLedgerService';
import { Badge } from '@/components/ui/badge';
import ErpTripDetailModal from './ErpTripDetailModal';
import KhataKpiGrid from './KhataKpiGrid';
import KhataDashboardCharts from './KhataDashboardCharts';
import NewButton from '@/components/ui/NewButton';
import { useActiveBranch } from '../../../contexts/BranchContext';
import logger from '../../../utils/logger.js';
import {
  formatCurrency,
  formatDate,
  formatCostPerKm,
  formatKm,
  getProfitabilityStatus,
  CATEGORIES,
  CATEGORY_LABELS,
  SOURCE_LABELS,
  getInitialDateRange,
  getVehicleLabel,
  getDriverName,
} from '../utils';

const KhataDashboardTab = ({ vehicles = [], drivers = [] }) => {
  const { branchId, activeBranch } = useActiveBranch();

  // Filters
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [tripId, setTripId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [erpTrips, setErpTrips] = useState([]);
  const [tripFinances, setTripFinances] = useState({});
  const [selectedTrip, setSelectedTrip] = useState(null);

  const fetchDashboardData = useCallback(
    async (signal) => {
      setLoading(true);
      setLoadError(null);
      try {
        const expenseParams = {
          includeTripExpenses: true,
        };
        if (branchId) expenseParams.branchId = branchId;
        if (dateRange.startDate) expenseParams.startDate = dateRange.startDate;
        if (dateRange.endDate) expenseParams.endDate = dateRange.endDate;
        if (vehicleId) expenseParams.vehicleId = vehicleId;
        if (driverId) expenseParams.driverId = driverId;
        if (category) expenseParams.category = category;
        if (tripId) expenseParams.tripId = tripId;
        if (source) expenseParams.source = source;
        if (status) expenseParams.status = status;

        // The shared client supplies X-Branch-Id. The trip list does not accept
        // branchId/driverId query fields, so apply its driver filter after paging.
        const tripParams = {};
        if (vehicleId) tripParams.vehicleId = vehicleId;

        const [loadedExpenses, allTrips] = await Promise.all([
          KhataLedgerService.getDashboardExpenses(expenseParams, { signal }),
          KhataLedgerService.getDashboardTrips(tripParams, { signal }),
        ]);
        if (signal.aborted) return;
        const loadedTrips = allTrips.filter((trip) => {
          if (driverId && String(trip.driverId?._id || trip.driverId) !== driverId) return false;
          const date = new Date(trip.tripDate || trip.createdAt).getTime();
          return (
            Number.isFinite(date) &&
            (!dateRange.startDate || date >= new Date(dateRange.startDate).getTime()) &&
            (!dateRange.endDate || date <= new Date(dateRange.endDate).getTime())
          );
        });

        setExpenses(loadedExpenses);
        setErpTrips(loadedTrips);

        // Fetch financial summaries for top trips
        const finances = {};
        await Promise.allSettled(
          loadedTrips.slice(0, 30).map(async (t) => {
            try {
              const fin = await KhataLedgerService.getErpTripFinance(t._id, { signal });
              if (fin?.margin) finances[t._id] = fin.margin;
            } catch {
              // gracefully ignore
            }
          }),
        );
        if (!signal.aborted) setTripFinances(finances);
      } catch (err) {
        if (!signal.aborted) {
          logger.error('Failed to load dashboard data:', err);
          setLoadError('Could not load the financial overview. Please try again.');
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [branchId, dateRange, vehicleId, driverId, category, tripId, source, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, [fetchDashboardData, refreshKey]);

  const filteredExpenses = expenses;

  // Aggregate Real KPIs
  const kpis = useMemo(() => {
    let totalCost = 0;
    let fuelCost = 0;
    let maintenanceCost = 0;
    let otherExpenses = 0;
    let tripExpenses = 0;
    let pendingExpenses = 0;

    filteredExpenses.forEach((exp) => {
      const amt = Number(exp.amount) || 0;
      totalCost += amt;

      if (exp.source === 'FUEL' || exp.category === 'FUEL') {
        fuelCost += amt;
      } else if (exp.source === 'MAINTENANCE' || ['MAINTENANCE', 'REPAIR'].includes(exp.category)) {
        maintenanceCost += amt;
      } else if (exp.source === 'TRIP' || exp.category === 'TRIP_EXPENSE') {
        tripExpenses += amt;
      } else {
        otherExpenses += amt;
      }

      if (exp.status === 'PENDING') {
        pendingExpenses += amt;
      }
    });

    // ERP Trip Revenue & Profit aggregation from real trip finances
    let totalRevenue = 0;
    let _tripCountedCost = 0;
    let totalDistanceKm = 0;

    erpTrips.forEach((t) => {
      const margin = tripFinances[t._id];
      if (margin) {
        totalRevenue += margin.revenue || 0;
        _tripCountedCost += margin.cost || 0;
      }
      if (t.totalKm && t.totalKm > 0) {
        totalDistanceKm += t.totalKm;
      }
    });

    const totalProfit = totalRevenue - totalCost;
    const profitStatus = getProfitabilityStatus(totalRevenue, totalCost);
    const costPerKmText = formatCostPerKm(totalCost, totalDistanceKm);

    return {
      totalCost,
      fuelCost,
      maintenanceCost,
      otherExpenses,
      tripExpenses,
      pendingExpenses,
      totalRevenue,
      totalProfit,
      profitStatus,
      totalDistanceKm,
      costPerKmText,
      expensesCount: filteredExpenses.length,
      tripCount: erpTrips.length,
    };
  }, [filteredExpenses, erpTrips, tripFinances]);

  // 1. Category Chart Data
  const categoryChartData = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category === 'FUEL_EXPENSE' ? 'FUEL' : e.category || 'MISCELLANEOUS';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });

    return Object.entries(map)
      .map(([cat, value]) => ({
        name: CATEGORY_LABELS[cat] || cat,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // 2. Source Breakdown Data
  const sourceChartData = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((expense) => {
      const name =
        SOURCE_LABELS[expense.source] ||
        (expense.source === 'DETECTED_CROSSING' ? 'Detected tolls' : 'Other');
      map[name] = (map[name] || 0) + (Number(expense.amount) || 0);
    });

    return Object.entries(map).map(([name, cost]) => ({ name, cost }));
  }, [filteredExpenses]);

  // 3. Vehicle Cost Comparison Data
  const vehicleChartData = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      const vLabel =
        e.vehicle?.registrationNumber ||
        e.vehicle?.name ||
        (e.vehicleId ? 'Assigned' : 'Unattributed');
      map[vLabel] = (map[vLabel] || 0) + (Number(e.amount) || 0);
    });

    return Object.entries(map)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  }, [filteredExpenses]);

  // 4. Trip Profitability Data
  const tripProfitData = useMemo(() => {
    return erpTrips
      .filter((t) => tripFinances[t._id])
      .slice(0, 8)
      .map((t) => {
        const m = tripFinances[t._id];
        return {
          name: t.tripNumber || `TRIP-${t._id.slice(-4).toUpperCase()}`,
          Revenue: m.revenue || 0,
          Cost: m.cost || 0,
          Profit: (m.revenue || 0) - (m.cost || 0),
        };
      });
  }, [erpTrips, tripFinances]);

  // Date range formatted label
  const periodLabel = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return 'All Recorded Dates';
    const s = dateRange.startDate ? formatDate(dateRange.startDate) : 'Beginning';
    const e = dateRange.endDate ? formatDate(dateRange.endDate) : 'Today';
    return `${s} – ${e}`;
  }, [dateRange]);

  const handleResetFilters = () => {
    setDateRange(getInitialDateRange());
    setVehicleId('');
    setDriverId('');
    setCategory('');
    setSource('');
    setStatus('');
    setTripId('');
  };

  const financeCount = Object.keys(tripFinances).length;
  const completeFinances = financeCount === erpTrips.length;

  return (
    <div className="space-y-4">
      {/* Location & Period Scope Banner */}
      <div className="khata-scope">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="khata-scope-heading">
                <h2>Financial overview</h2>
                <Badge variant="outline" className="text-[11px] font-medium">
                  {activeBranch ? activeBranch.name : 'Enterprise (All Locations)'}
                </Badge>
              </div>
              <p className="khata-scope-period">
                <Calendar size={13} className="text-gray-400" />
                <span>
                  Period: <strong>{periodLabel}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NewButton
              variant="secondary"
              size="sm"
              prependIcon={<Filter size={14} />}
              selected={Boolean(
                showFilters || vehicleId || driverId || category || source || status || tripId,
              )}
              aria-expanded={showFilters}
              aria-controls="khata-dashboard-filters"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filter Scope
            </NewButton>
            <NewButton
              variant="ghost"
              size="sm"
              prependIcon={<RotateCcw size={13} />}
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              Reset
            </NewButton>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div
            id="khata-dashboard-filters"
            className="khata-filter-fields grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs"
          >
            {/* Start Date */}
            <div>
              <label
                htmlFor="kdt-filter-from"
                className="block text-[11px] font-medium text-gray-600 mb-1"
              >
                From Date
              </label>
              <input
                id="kdt-filter-from"
                aria-label="From date"
                type="date"
                className="w-full rounded-md border border-gray-300 px-2 py-1 bg-white text-xs"
                value={dateRange.startDate ? dateRange.startDate.split('T')[0] : ''}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                  }))
                }
              />
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="kdt-filter-to"
                className="block text-[11px] font-medium text-gray-600 mb-1"
              >
                To Date
              </label>
              <input
                id="kdt-filter-to"
                aria-label="To date"
                type="date"
                className="w-full rounded-md border border-gray-300 px-2 py-1 bg-white text-xs"
                value={dateRange.endDate ? dateRange.endDate.split('T')[0] : ''}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    endDate: e.target.value
                      ? new Date(e.target.value + 'T23:59:59').toISOString()
                      : '',
                  }))
                }
              />
            </div>

            {/* Vehicle */}
            <div>
              <label
                htmlFor="kdt-filter-vehicle"
                className="block text-[11px] font-medium text-gray-600 mb-1"
              >
                Vehicle
              </label>
              <select
                id="kdt-filter-vehicle"
                className="w-full rounded-md border border-gray-300 px-2 py-1 bg-white text-xs"
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

            {/* Driver */}
            <div>
              <label
                htmlFor="kdt-filter-driver"
                className="block text-[11px] font-medium text-gray-600 mb-1"
              >
                Driver
              </label>
              <select
                id="kdt-filter-driver"
                className="w-full rounded-md border border-gray-300 px-2 py-1 bg-white text-xs"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              >
                <option value="">All Drivers</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {getDriverName(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="kdt-filter-category"
                className="block text-[11px] font-medium text-gray-600 mb-1"
              >
                Category
              </label>
              <select
                id="kdt-filter-category"
                className="w-full rounded-md border border-gray-300 px-2 py-1 bg-white text-xs"
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

            {/* Source */}
            <div>
              <label
                htmlFor="kdt-filter-source"
                className="block text-[11px] font-medium text-gray-600 mb-1"
              >
                Source
              </label>
              <select
                id="kdt-filter-source"
                className="w-full rounded-md border border-gray-300 px-2 py-1 bg-white text-xs"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">All Sources</option>
                <option value="MANUAL">Manual</option>
                <option value="FUEL">Fuel Refill</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TRIP">Trip Generated</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="kdt-filter-status"
                className="block text-[11px] font-medium text-gray-600 mb-1"
              >
                Status
              </label>
              <select
                id="kdt-filter-status"
                className="w-full rounded-md border border-gray-300 px-2 py-1 bg-white text-xs"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed / Approved</option>
                <option value="PENDING">Pending Review</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {loadError ? (
        <div className="khata-dashboard-error" role="alert">
          <AlertCircle size={22} aria-hidden="true" />
          <div>
            <strong>Financial overview unavailable</strong>
            <p>{loadError}</p>
          </div>
          <NewButton
            variant="secondary"
            size="sm"
            prependIcon={<RefreshCw size={14} />}
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Try again
          </NewButton>
        </div>
      ) : (
        <>
          <KhataKpiGrid
            headline
            loading={loading}
            columns={3}
            items={[
              {
                label: 'Total Cost',
                icon: IndianRupee,
                value: formatCurrency(kpis.totalCost),
                sub: 'All counted fleet expenditures',
              },
              {
                label: 'Trip Revenue',
                icon: TrendingUp,
                value:
                  financeCount || erpTrips.length === 0
                    ? formatCurrency(kpis.totalRevenue)
                    : 'Unavailable',
                sub: `Finances available for ${financeCount} of ${erpTrips.length} trips`,
              },
              {
                label: 'Net Profit',
                icon: kpis.totalProfit < 0 ? TrendingDown : TrendingUp,
                value: completeFinances ? formatCurrency(kpis.totalProfit) : 'Unavailable',
                sub: completeFinances
                  ? 'Revenue minus all expenses'
                  : 'Some trip finances are unavailable',
                status: completeFinances ? kpis.profitStatus.label : 'Partial data',
                tone:
                  completeFinances && kpis.totalProfit < 0
                    ? 'critical'
                    : completeFinances && kpis.totalProfit > 0
                      ? 'ok'
                      : 'neutral',
              },
            ]}
          />
          <section aria-labelledby="khata-breakdown-heading">
            <div className="khata-section-heading">
              <div>
                <h2 id="khata-breakdown-heading">Expense breakdown</h2>
                <p>Operating costs and entries awaiting review for the selected period.</p>
              </div>
            </div>
            <KhataKpiGrid
              loading={loading}
              columns={3}
              items={[
                {
                  label: 'Fuel Cost',
                  icon: Fuel,
                  value: formatCurrency(kpis.fuelCost),
                  sub:
                    kpis.totalCost > 0
                      ? `${((kpis.fuelCost / kpis.totalCost) * 100).toFixed(0)}% of total expenditure`
                      : 'Direct fuel refills',
                },
                {
                  label: 'Maintenance',
                  icon: Wrench,
                  value: formatCurrency(kpis.maintenanceCost),
                  sub: 'Repairs, servicing & tyres',
                },
                {
                  label: 'Other Expenses',
                  icon: Receipt,
                  value: formatCurrency(kpis.otherExpenses),
                  sub: 'Tolls, driver food, fines, permits',
                },
                {
                  label: 'ERP Trip Costs',
                  icon: Route,
                  value: formatCurrency(kpis.tripExpenses),
                  sub: 'Advances and trip charges',
                },
                {
                  label: 'Pending Review',
                  icon: Clock,
                  value: formatCurrency(kpis.pendingExpenses),
                  sub: 'Awaiting approval before ledger',
                  status: kpis.pendingExpenses > 0 ? 'Needs review' : null,
                  tone: 'warning',
                },
                {
                  label: 'Fleet Cost / KM',
                  icon: Gauge,
                  value: kpis.costPerKmText || 'Unavailable',
                  sub:
                    kpis.totalDistanceKm > 0
                      ? `Logged distance: ${formatKm(kpis.totalDistanceKm)}`
                      : 'No distance recorded',
                },
              ]}
            />
          </section>

          <KhataDashboardCharts
            loading={loading}
            categoryData={categoryChartData}
            sourceData={sourceChartData}
            vehicleData={vehicleChartData}
            tripData={tripProfitData}
          />
        </>
      )}

      {/* Selected Trip Details Modal */}
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

export default KhataDashboardTab;
