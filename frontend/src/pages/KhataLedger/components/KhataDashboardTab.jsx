import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
  Wrench,
  Receipt,
  Route,
  Clock,
  Gauge,
  Filter,
  RotateCcw,
  Calendar,
  Truck,
  User,
  ExternalLink,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import KhataLedgerService from '../KhataLedgerService';
import ErpTripDetailModal from './ErpTripDetailModal';
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
  getInitialDateRange,
  getVehicleLabel,
  getDriverName,
} from '../utils';

const PIE_COLORS = [
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#10b981',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

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
  const [expenses, setExpenses] = useState([]);
  const [erpTrips, setErpTrips] = useState([]);
  const [tripFinances, setTripFinances] = useState({});
  const [selectedTrip, setSelectedTrip] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const expenseParams = {
        includeTripExpenses: true,
        limit: 1000,
      };
      if (branchId) expenseParams.branchId = branchId;
      if (dateRange.startDate) expenseParams.startDate = dateRange.startDate;
      if (dateRange.endDate) expenseParams.endDate = dateRange.endDate;
      if (vehicleId) expenseParams.vehicleId = vehicleId;
      if (driverId) expenseParams.driverId = driverId;
      if (category) expenseParams.category = category;
      if (tripId) expenseParams.tripId = tripId;

      const tripParams = {
        limit: 100,
      };
      if (branchId) tripParams.branchId = branchId;
      if (vehicleId) tripParams.vehicleId = vehicleId;
      if (driverId) tripParams.driverId = driverId;

      const [expRes, tripRes] = await Promise.all([
        KhataLedgerService.getExpenses(expenseParams).catch(() => ({ results: [] })),
        KhataLedgerService.getErpTrips(tripParams).catch(() => ({ data: [] })),
      ]);

      const loadedExpenses = expRes.results || expRes.data || (Array.isArray(expRes) ? expRes : []);
      const loadedTrips =
        tripRes.data || tripRes.results || (Array.isArray(tripRes) ? tripRes : []);

      setExpenses(loadedExpenses);
      setErpTrips(loadedTrips);

      // Fetch financial summaries for top trips
      const finances = {};
      await Promise.allSettled(
        loadedTrips.slice(0, 30).map(async (t) => {
          try {
            const fin = await KhataLedgerService.getErpTripFinance(t._id);
            if (fin?.margin) finances[t._id] = fin.margin;
          } catch {
            // gracefully ignore
          }
        }),
      );
      setTripFinances(finances);
    } catch (err) {
      logger.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId, dateRange, vehicleId, driverId, category, tripId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Filter expenses by source & status client-side if selected
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    if (source) result = result.filter((e) => e.source === source);
    if (status) result = result.filter((e) => (e.status || 'CONFIRMED') === status);
    return result;
  }, [expenses, source, status]);

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
      const cat = e.category || 'MISCELLANEOUS';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });

    return Object.entries(map)
      .map(([cat, value]) => ({
        name: CATEGORY_LABELS[cat] || cat,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredExpenses]);

  // 2. Source Breakdown Data
  const sourceChartData = useMemo(() => {
    const map = {
      Manual: 0,
      Fuel: 0,
      Maintenance: 0,
      Trip: 0,
    };
    filteredExpenses.forEach((e) => {
      if (e.source === 'FUEL') map.Fuel += Number(e.amount) || 0;
      else if (e.source === 'MAINTENANCE') map.Maintenance += Number(e.amount) || 0;
      else if (e.source === 'TRIP') map.Trip += Number(e.amount) || 0;
      else map.Manual += Number(e.amount) || 0;
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

  return (
    <div className="space-y-6">
      {/* Location & Period Scope Banner */}
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/60 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Financial Control Center</h2>
                <Badge className="bg-indigo-600 text-white text-[11px] font-medium">
                  {activeBranch ? activeBranch.name : 'Enterprise (All Locations)'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                <Calendar size={13} className="text-gray-400" />
                <span>
                  Period: <strong>{periodLabel}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showFilters || vehicleId || driverId || category || source || status
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={14} />
              Filter Scope
            </button>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="mt-4 pt-3 border-t border-indigo-100/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">From Date</label>
              <input
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
              <label className="block text-[11px] font-medium text-gray-600 mb-1">To Date</label>
              <input
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
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Vehicle</label>
              <select
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
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Driver</label>
              <select
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
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Category</label>
              <select
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
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Source</label>
              <select
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
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Status</label>
              <select
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

      {/* 9 Professional Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* 1. Total Cost */}
        <Card className="border-red-100 bg-gradient-to-br from-red-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-red-700 mb-1">
              <span>Total Cost</span>
              <DollarSign size={16} className="text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-950">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.totalCost)}
            </div>
            <p className="text-[11px] text-red-700/80 mt-1">All counted fleet expenditures</p>
          </CardContent>
        </Card>

        {/* 2. Fuel Cost */}
        <Card className="border-orange-100 bg-gradient-to-br from-orange-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-orange-700 mb-1">
              <span>Fuel Cost</span>
              <Fuel size={16} className="text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-950">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.fuelCost)}
            </div>
            <p className="text-[11px] text-orange-700/80 mt-1">
              {kpis.totalCost > 0
                ? `${((kpis.fuelCost / kpis.totalCost) * 100).toFixed(0)}% of total expenditure`
                : 'Direct fuel refills'}
            </p>
          </CardContent>
        </Card>

        {/* 3. Maintenance Cost */}
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-purple-700 mb-1">
              <span>Maintenance</span>
              <Wrench size={16} className="text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-950">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.maintenanceCost)}
            </div>
            <p className="text-[11px] text-purple-700/80 mt-1">Repairs, servicing & tyres</p>
          </CardContent>
        </Card>

        {/* 4. Other Expenses */}
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              <span>Other Expenses</span>
              <Receipt size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-950">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.otherExpenses)}
            </div>
            <p className="text-[11px] text-blue-700/80 mt-1">Tolls, driver food, fines, permits</p>
          </CardContent>
        </Card>

        {/* 5. ERP Trip Expenses */}
        <Card className="border-violet-100 bg-gradient-to-br from-violet-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-violet-700 mb-1">
              <span>ERP Trip Costs</span>
              <Route size={16} className="text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-violet-950">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.tripExpenses)}
            </div>
            <p className="text-[11px] text-violet-700/80 mt-1">Advances and trip charges</p>
          </CardContent>
        </Card>

        {/* 6. Pending Expenses */}
        <Card className="border-amber-100 bg-gradient-to-br from-amber-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
              <span>Pending Review</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-950">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.pendingExpenses)}
            </div>
            <p className="text-[11px] text-amber-700/80 mt-1">Awaiting approval before ledger</p>
          </CardContent>
        </Card>

        {/* 7. Total Revenue */}
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
              <span>Total Revenue</span>
              <TrendingUp size={16} className="text-teal-500" />
            </div>
            <div className="text-2xl font-bold text-teal-950">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.totalRevenue)}
            </div>
            <p className="text-[11px] text-teal-700/80 mt-1">Commercial customer billings</p>
          </CardContent>
        </Card>

        {/* 8. Total Profit */}
        <Card
          className={`shadow-sm bg-gradient-to-br to-white ${
            kpis.totalProfit >= 0
              ? 'border-emerald-200 from-emerald-50/40'
              : 'border-rose-200 from-rose-50/40'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-1">
              <span className={kpis.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                Net Profit
              </span>
              <Badge className={`text-[10px] px-1 py-0 ${kpis.profitStatus.color}`}>
                {kpis.profitStatus.label}
              </Badge>
            </div>
            <div
              className={`text-2xl font-bold flex items-center gap-1 ${
                kpis.totalProfit >= 0 ? 'text-emerald-950' : 'text-rose-950'
              }`}
            >
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  {kpis.totalProfit >= 0 ? (
                    <TrendingUp size={20} className="text-emerald-600" />
                  ) : (
                    <TrendingDown size={20} className="text-rose-600" />
                  )}
                  {formatCurrency(Math.abs(kpis.totalProfit))}
                </>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Revenue minus all expenses</p>
          </CardContent>
        </Card>

        {/* 9. Cost / KM */}
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
              <span>Fleet Cost / KM</span>
              <Gauge size={16} className="text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-950">
              {loading ? <Skeleton className="h-8 w-24" /> : kpis.costPerKmText || 'Unavailable'}
            </div>
            <p className="text-[11px] text-indigo-700/80 mt-1">
              {kpis.totalDistanceKm > 0
                ? `Logged distance: ${formatKm(kpis.totalDistanceKm)}`
                : 'Cost/KM unavailable (no distance recorded)'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Charts Section (Prompt Section 18) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Category Distribution */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <PieChartIcon size={16} className="text-indigo-600" />
                  Expense Distribution by Category
                </h3>
                <p className="text-xs text-gray-500">
                  Breakdown of total spending across categories
                </p>
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : categoryChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                <Layers size={32} className="opacity-30 mb-1" />
                No data available for selected filters
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Source Breakdown */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-600" />
                  Cost by Transaction Source
                </h3>
                <p className="text-xs text-gray-500">
                  Manual vs automated fuel and maintenance logs
                </p>
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : sourceChartData.every((d) => d.cost === 0) ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                <Layers size={32} className="opacity-30 mb-1" />
                No data available for selected filters
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sourceChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                      tickLine={false}
                    />
                    <Tooltip formatter={(v) => [formatCurrency(v), 'Cost']} />
                    <Bar dataKey="cost" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Top Cost Vehicles */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Truck size={16} className="text-indigo-600" />
                  Vehicle Cost Comparison (Top 6)
                </h3>
                <p className="text-xs text-gray-500">
                  Highest expenditure vehicles in the selected period
                </p>
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : vehicleChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                <Layers size={32} className="opacity-30 mb-1" />
                No data available for selected filters
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vehicleChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis
                      type="number"
                      fontSize={11}
                      tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                    />
                    <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(v) => [formatCurrency(v), 'Total Spend']} />
                    <Bar dataKey="cost" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Trip Profitability (Revenue vs Cost) */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Route size={16} className="text-indigo-600" />
                  Trip Financial Intelligence (Revenue vs Cost)
                </h3>
                <p className="text-xs text-gray-500">Real ERP Trip margin comparison</p>
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : tripProfitData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                <Layers size={32} className="opacity-30 mb-1" />
                No trip financial data available for selected filters
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tripProfitData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                      tickLine={false}
                    />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
