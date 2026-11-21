import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import KhataLedgerService, {
  ERP_DISABLED_MESSAGE,
  isErpDisabledError,
} from '../KhataLedgerService';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import ErpTripDetailModal from './ErpTripDetailModal';
import KhataKpiGrid from './KhataKpiGrid';
import KhataDashboardCharts from './KhataDashboardCharts';
import { KhataCard, KhataError, KhataField, KhataPill, KhataSectionHead } from './khataUi';
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
  plural,
} from '../utils';

// The only sources /api/expenses returns rows for.
const LISTED_SOURCES = ['MANUAL', 'FUEL', 'DRIVER_BILL', 'DETECTED_CROSSING'];

const KhataDashboardTab = ({ vehicles = [], drivers = [], erpAvailable }) => {
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
  // Organisations without ERP get a 404 on the trip endpoints. That is not the
  // same as "no trips yet", so it gets its own empty state.
  const [erpDisabled, setErpDisabled] = useState(false);

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

        const [loadedExpenses, tripResult] = await Promise.all([
          KhataLedgerService.getDashboardExpenses(expenseParams, { signal }),
          KhataLedgerService.getDashboardTrips(tripParams, { signal }).catch((err) => {
            if (isErpDisabledError(err)) return { disabled: true, trips: [] };
            throw err;
          }),
        ]);
        if (signal.aborted) return;
        const allTrips = Array.isArray(tripResult) ? tripResult : tripResult.trips || [];
        const loadedTrips = allTrips.filter((trip) => {
          if (driverId && String(trip.driverId?._id || trip.driverId) !== driverId) return false;
          const date = new Date(trip.tripDate || trip.createdAt).getTime();
          return (
            Number.isFinite(date) &&
            (!dateRange.startDate || date >= new Date(dateRange.startDate).getTime()) &&
            (!dateRange.endDate || date <= new Date(dateRange.endDate).getTime())
          );
        });

        // Rejected rows (e.g. toll crossings superseded by a later trip) are not spend.
        setExpenses(
          status === 'REJECTED'
            ? loadedExpenses
            : loadedExpenses.filter((expense) => expense.status !== 'REJECTED'),
        );
        setErpTrips(loadedTrips);
        setErpDisabled(tripResult?.disabled === true);

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
    let tollCost = 0;
    let pendingExpenses = 0;

    filteredExpenses.forEach((exp) => {
      const amt = Number(exp.amount) || 0;
      totalCost += amt;

      if (exp.source === 'FUEL' || exp.category === 'FUEL') {
        fuelCost += amt;
      } else if (exp.source === 'MAINTENANCE' || ['MAINTENANCE', 'REPAIR'].includes(exp.category)) {
        maintenanceCost += amt;
      } else if (exp.category === 'TOLL' || exp.source === 'DETECTED_CROSSING') {
        tollCost += amt;
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
      tollCost,
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
      const name = SOURCE_LABELS[expense.source] || 'Other';
      map[name] = (map[name] || 0) + (Number(expense.amount) || 0);
    });

    return Object.entries(map).map(([name, cost]) => ({ name, cost }));
  }, [filteredExpenses]);

  // 3. Vehicle Cost Comparison Data
  const vehicleChartData = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      const id = e.vehicle?._id || e.vehicleId;
      const known = vehicles.find((v) => v._id === id);
      const vLabel =
        e.vehicle?.registrationNumber ||
        known?.registrationNumber ||
        e.vehicle?.name ||
        (id ? 'Vehicle not in list' : 'No vehicle');
      map[vLabel] = (map[vLabel] || 0) + (Number(e.amount) || 0);
    });

    return Object.entries(map)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  }, [filteredExpenses, vehicles]);

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

  const periodLabel = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return 'All dates';
    const start = dateRange.startDate ? formatDate(dateRange.startDate) : 'Beginning';
    const end = dateRange.endDate ? formatDate(dateRange.endDate) : 'Today';
    return `${start} – ${end}`;
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

  // A period with no expense records is unknown, not ₹0 spent.
  const noExpenseRecords = !loading && filteredExpenses.length === 0;
  const NO_RECORDS = 'No expenses recorded for this period';
  const money = (value) => (noExpenseRecords ? '—' : formatCurrency(value));

  const activeFilters = [vehicleId, driverId, category, source, status, tripId].filter(
    Boolean,
  ).length;
  const share = (value) => (kpis.totalCost > 0 ? (value / kpis.totalCost) * 100 : null);
  const shareNote = (value, fallback) =>
    noExpenseRecords
      ? NO_RECORDS
      : kpis.totalCost > 0
        ? `${Math.round((value / kpis.totalCost) * 100)}% of total spend`
        : fallback;

  const profitKnown = !(noExpenseRecords && !erpTrips.length);
  // Trip revenue, profit and cost per km need ERP trips. Until the location has
  // one they are left out rather than shown as dashes. The page asks once; on
  // its own the tab goes by the trips it loaded.
  const showErp = erpAvailable ?? (!erpDisabled && erpTrips.length > 0);

  return (
    <>
      <KhataSectionHead
        title={
          <>
            Financial overview
            <KhataPill>{activeBranch ? activeBranch.name : 'All locations'}</KhataPill>
          </>
        }
        subtitle={
          loading
            ? periodLabel
            : [
                periodLabel,
                noExpenseRecords ? null : plural(kpis.expensesCount, 'expense'),
                showErp ? plural(kpis.tripCount, 'ERP trip') : null,
              ]
                .filter(Boolean)
                .join(' · ')
        }
        actions={
          <>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <button
              type="button"
              className="khata-btn"
              aria-pressed={showFilters}
              aria-expanded={showFilters}
              aria-controls="khata-dashboard-filters"
              onClick={() => setShowFilters(!showFilters)}
            >
              {activeFilters ? `Filters · ${activeFilters}` : 'Filters'}
            </button>
            {activeFilters ? (
              <button
                type="button"
                className="khata-btn khata-btn--ghost"
                onClick={handleResetFilters}
              >
                Clear
              </button>
            ) : null}
          </>
        }
      />
      {showFilters && (
        <KhataCard id="khata-dashboard-filters" title="Filters">
          <div className="khata-filters">
            <KhataField label="Vehicle" htmlFor="kdt-filter-vehicle">
              <SearchableSelect
                id="kdt-filter-vehicle"
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
            <KhataField label="Driver" htmlFor="kdt-filter-driver">
              <SearchableSelect
                id="kdt-filter-driver"
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
            <KhataField label="Category" htmlFor="kdt-filter-category">
              <SearchableSelect
                id="kdt-filter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
            <KhataField label="Source" htmlFor="kdt-filter-source">
              <SearchableSelect
                id="kdt-filter-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">All sources</option>
                {Object.entries(SOURCE_LABELS)
                  .filter(([key]) => LISTED_SOURCES.includes(key))
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </SearchableSelect>
            </KhataField>
            <KhataField label="Status" htmlFor="kdt-filter-status">
              <SearchableSelect
                id="kdt-filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending review</option>
                <option value="REJECTED">Rejected</option>
              </SearchableSelect>
            </KhataField>
          </div>
        </KhataCard>
      )}

      {loadError ? (
        <KhataCard>
          <KhataError
            title="Financial overview unavailable"
            onRetry={() => setRefreshKey((key) => key + 1)}
          >
            {loadError}
          </KhataError>
        </KhataCard>
      ) : (
        <>
          <KhataKpiGrid
            label="Financial overview"
            loading={loading}
            items={
              showErp
                ? [
                    {
                      label: 'Total cost',
                      value: money(kpis.totalCost),
                      sub: noExpenseRecords ? NO_RECORDS : 'Every expense counted in this period',
                    },
                    {
                      label: 'Trip revenue',
                      value: erpDisabled
                        ? '—'
                        : financeCount || erpTrips.length === 0
                          ? formatCurrency(kpis.totalRevenue)
                          : 'Unavailable',
                      sub: erpDisabled
                        ? ERP_DISABLED_MESSAGE
                        : `Finances available for ${financeCount} of ${erpTrips.length} trips`,
                    },
                    {
                      label: 'Net profit',
                      value: !profitKnown
                        ? '—'
                        : completeFinances
                          ? formatCurrency(kpis.totalProfit)
                          : 'Unavailable',
                      sub: !profitKnown
                        ? NO_RECORDS
                        : completeFinances
                          ? 'Revenue minus every expense'
                          : 'Some trip finances are unavailable',
                      status: !profitKnown
                        ? null
                        : completeFinances
                          ? kpis.profitStatus.label
                          : 'Partial data',
                      tone:
                        completeFinances && kpis.totalProfit < 0
                          ? 'bad'
                          : completeFinances && kpis.totalProfit > 0
                            ? 'ok'
                            : 'neutral',
                    },
                  ]
                : [
                    {
                      label: 'Total cost',
                      value: money(kpis.totalCost),
                      sub: noExpenseRecords ? NO_RECORDS : 'Every expense counted in this period',
                    },
                    {
                      label: 'Pending review',
                      value: money(kpis.pendingExpenses),
                      pct: share(kpis.pendingExpenses),
                      sub: noExpenseRecords
                        ? NO_RECORDS
                        : kpis.pendingExpenses > 0
                          ? 'Needs review before it counts'
                          : 'Nothing waiting',
                      noteTone: kpis.pendingExpenses > 0 ? 'warn' : null,
                    },
                    {
                      label: 'Expenses',
                      value: noExpenseRecords ? '—' : kpis.expensesCount.toLocaleString('en-IN'),
                      sub: noExpenseRecords ? NO_RECORDS : 'Entries counted in this period',
                    },
                  ]
            }
          />
          <KhataSectionHead
            title="Expense breakdown"
            subtitle={
              showErp
                ? 'Operating costs and entries waiting for review'
                : 'Where this period’s spend went'
            }
          />
          <KhataKpiGrid
            label="Expense breakdown"
            loading={loading}
            items={[
              {
                label: 'Fuel',
                value: money(kpis.fuelCost),
                pct: share(kpis.fuelCost),
                sub: shareNote(kpis.fuelCost, 'refills'),
              },
              {
                label: 'Tolls',
                value: money(kpis.tollCost),
                pct: share(kpis.tollCost),
                sub: shareNote(kpis.tollCost, 'detected and entered'),
              },
              {
                label: 'Maintenance',
                value: money(kpis.maintenanceCost),
                pct: share(kpis.maintenanceCost),
                sub: shareNote(kpis.maintenanceCost, 'repairs, service, tyres'),
              },
              {
                label: 'Other expenses',
                value: money(kpis.otherExpenses),
                pct: share(kpis.otherExpenses),
                sub: shareNote(kpis.otherExpenses, 'food, fines, permits'),
              },
              ...(showErp
                ? [
                    {
                      label: 'Pending review',
                      value: money(kpis.pendingExpenses),
                      pct: share(kpis.pendingExpenses),
                      sub: noExpenseRecords
                        ? NO_RECORDS
                        : kpis.pendingExpenses > 0
                          ? 'Needs review before it counts'
                          : 'Nothing waiting',
                      noteTone: kpis.pendingExpenses > 0 ? 'warn' : null,
                    },
                    {
                      label: 'Cost per km',
                      value: kpis.costPerKmText || '—',
                      sub:
                        kpis.totalDistanceKm > 0
                          ? `${formatKm(kpis.totalDistanceKm)} on ERP trips`
                          : 'No trip distance recorded',
                    },
                  ]
                : []),
            ]}
          />

          <KhataDashboardCharts
            loading={loading}
            categoryData={categoryChartData}
            sourceData={sourceChartData}
            vehicleData={vehicleChartData}
            tripData={showErp ? tripProfitData : null}
          />
        </>
      )}

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

export default KhataDashboardTab;
