import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  FileText,
  Calendar,
  Truck,
  User,
  Route,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'react-toastify';
import KhataLedgerService from '../KhataLedgerService';
import exportTable from '../../../lib/exportTable';
import { useActiveBranch } from '../../../contexts/BranchContext';
import logger from '../../../utils/logger.js';
import {
  formatCurrency,
  formatDate,
  CATEGORIES,
  CATEGORY_LABELS,
  getInitialDateRange,
  getVehicleLabel,
  getDriverName,
} from '../utils';

const REPORT_TYPES = [
  {
    id: 'TRIP_PROFITABILITY',
    label: 'Trip Profitability Report',
    description: 'Commercial trips revenue, cost, profit margins & Cost/KM',
  },
  {
    id: 'VEHICLE_COST',
    label: 'Vehicle Cost & Cost/KM Report',
    description: 'Total cost per vehicle with distance & fuel consumption',
  },
  {
    id: 'DRIVER_COST',
    label: 'Driver Ledger Report',
    description: 'Total expenses and trip counts per driver',
  },
  {
    id: 'EXPENSE_BREAKDOWN',
    label: 'Expense Category Breakdown',
    description: 'Aggregated expenses grouped by business category',
  },
  {
    id: 'FUEL_REPORT',
    label: 'Fuel Spend & Anomaly Report',
    description: 'Fuel refills with mileage flags and litre rates',
  },
  {
    id: 'MAINTENANCE_REPORT',
    label: 'Maintenance & Service Report',
    description: 'Workshop service, parts, repairs and inspections',
  },
];

const KhataReportsTab = ({ vehicles = [], drivers = [] }) => {
  const { branchId, activeBranch } = useActiveBranch();
  const [selectedReport, setSelectedReport] = useState('TRIP_PROFITABILITY');
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [tripFinances, setTripFinances] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const expParams = {
        limit: 1000,
        includeTripExpenses: true,
      };
      if (branchId) expParams.branchId = branchId;
      if (dateRange.startDate) expParams.startDate = dateRange.startDate;
      if (dateRange.endDate) expParams.endDate = dateRange.endDate;
      if (vehicleId) expParams.vehicleId = vehicleId;
      if (driverId) expParams.driverId = driverId;
      if (category) expParams.category = category;

      const tripParams = {
        limit: 200,
      };
      if (branchId) tripParams.branchId = branchId;
      if (vehicleId) tripParams.vehicleId = vehicleId;
      if (driverId) tripParams.driverId = driverId;

      const [expRes, tripRes] = await Promise.all([
        KhataLedgerService.getExpenses(expParams).catch(() => ({ results: [] })),
        KhataLedgerService.getErpTrips(tripParams).catch(() => ({ data: [] })),
      ]);

      const loadedExpenses = expRes.results || expRes.data || (Array.isArray(expRes) ? expRes : []);
      const loadedTrips =
        tripRes.data || tripRes.results || (Array.isArray(tripRes) ? tripRes : []);

      setExpenses(loadedExpenses);
      setTrips(loadedTrips);

      // Load finances for trips
      const finances = {};
      await Promise.allSettled(
        loadedTrips.slice(0, 50).map(async (t) => {
          try {
            const fin = await KhataLedgerService.getErpTripFinance(t._id);
            if (fin?.margin) finances[t._id] = fin.margin;
          } catch {
            // ignore
          }
        }),
      );
      setTripFinances(finances);
    } catch (err) {
      logger.error('Failed to load report data:', err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [branchId, dateRange, vehicleId, driverId, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build Report Data depending on selectedReport
  const reportData = useMemo(() => {
    switch (selectedReport) {
      case 'TRIP_PROFITABILITY': {
        return trips.map((t) => {
          const m = tripFinances[t._id];
          const revenue = m?.revenue != null ? m.revenue : 0;
          const cost = m?.cost != null ? m.cost : 0;
          const profit = revenue - cost;
          const marginPct = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '—';
          const distance = t.totalKm || null;
          const costPerKm =
            distance && distance > 0 && cost > 0 ? (cost / distance).toFixed(2) : '—';

          return {
            tripNumber: t.tripNumber || `TRIP-${t._id.slice(-6).toUpperCase()}`,
            date: formatDate(t.tripDate || t.createdAt),
            route: t.fromLocation && t.toLocation ? `${t.fromLocation} → ${t.toLocation}` : '—',
            vehicle: t.vehicleNumber || (t.vehicleId && getVehicleLabel(t.vehicleId)) || '—',
            driver: (t.driverId && getDriverName(t.driverId)) || '—',
            status: t.state || 'PLACED',
            revenue,
            cost,
            profit,
            marginPct: marginPct !== '—' ? `${marginPct}%` : '—',
            distance: distance ? `${distance} km` : '—',
            costPerKm: costPerKm !== '—' ? `₹${costPerKm}/km` : '—',
          };
        });
      }

      case 'VEHICLE_COST': {
        const vehicleMap = {};
        expenses.forEach((e) => {
          const vKey = e.vehicle?.registrationNumber || e.vehicle?.name || 'Unattributed';
          if (!vehicleMap[vKey]) {
            vehicleMap[vKey] = {
              vehicle: vKey,
              fuelCost: 0,
              maintenanceCost: 0,
              otherCost: 0,
              totalCost: 0,
              count: 0,
            };
          }
          const amt = Number(e.amount) || 0;
          vehicleMap[vKey].totalCost += amt;
          vehicleMap[vKey].count += 1;

          if (e.source === 'FUEL' || e.category === 'FUEL') {
            vehicleMap[vKey].fuelCost += amt;
          } else if (e.source === 'MAINTENANCE' || ['MAINTENANCE', 'REPAIR'].includes(e.category)) {
            vehicleMap[vKey].maintenanceCost += amt;
          } else {
            vehicleMap[vKey].otherCost += amt;
          }
        });
        return Object.values(vehicleMap).sort((a, b) => b.totalCost - a.totalCost);
      }

      case 'DRIVER_COST': {
        const driverMap = {};
        expenses.forEach((e) => {
          const dKey = e.driver ? getDriverName(e.driver) : 'Unassigned';
          if (!driverMap[dKey]) {
            driverMap[dKey] = {
              driver: dKey,
              totalSpend: 0,
              entriesCount: 0,
              fuelSpend: 0,
              mealsAndAllowance: 0,
            };
          }
          const amt = Number(e.amount) || 0;
          driverMap[dKey].totalSpend += amt;
          driverMap[dKey].entriesCount += 1;

          if (e.source === 'FUEL' || e.category === 'FUEL') {
            driverMap[dKey].fuelSpend += amt;
          } else if (['DRIVER_MEAL', 'DRIVER_ALLOWANCE', 'DRIVER_SALARY'].includes(e.category)) {
            driverMap[dKey].mealsAndAllowance += amt;
          }
        });
        return Object.values(driverMap).sort((a, b) => b.totalSpend - a.totalSpend);
      }

      case 'EXPENSE_BREAKDOWN': {
        const catMap = {};
        let grandTotal = 0;
        expenses.forEach((e) => {
          const cat = e.category || 'MISCELLANEOUS';
          const amt = Number(e.amount) || 0;
          grandTotal += amt;
          if (!catMap[cat]) {
            catMap[cat] = { category: CATEGORY_LABELS[cat] || cat, count: 0, totalAmount: 0 };
          }
          catMap[cat].totalAmount += amt;
          catMap[cat].count += 1;
        });

        return Object.values(catMap)
          .map((c) => ({
            ...c,
            pct: grandTotal > 0 ? `${((c.totalAmount / grandTotal) * 100).toFixed(1)}%` : '0%',
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount);
      }

      case 'FUEL_REPORT': {
        return expenses
          .filter((e) => e.source === 'FUEL' || e.category === 'FUEL')
          .map((e) => ({
            date: formatDate(e.expenseDate || e.createdAt),
            vehicle: e.vehicle ? getVehicleLabel(e.vehicle) : '—',
            driver: e.driver ? getDriverName(e.driver) : '—',
            title: e.title,
            description: e.description || '—',
            amount: Number(e.amount) || 0,
            mileageAnomaly: e.mileageFlag
              ? `${e.mileageFlag.actualKmPerL?.toFixed(2)} km/L (flagged)`
              : 'Normal',
          }));
      }

      case 'MAINTENANCE_REPORT': {
        return expenses
          .filter(
            (e) => e.source === 'MAINTENANCE' || ['MAINTENANCE', 'REPAIR'].includes(e.category),
          )
          .map((e) => ({
            date: formatDate(e.expenseDate || e.createdAt),
            vehicle: e.vehicle ? getVehicleLabel(e.vehicle) : '—',
            driver: e.driver ? getDriverName(e.driver) : '—',
            title: e.title,
            category: CATEGORY_LABELS[e.category] || e.category,
            description: e.description || '—',
            amount: Number(e.amount) || 0,
          }));
      }

      default:
        return [];
    }
  }, [selectedReport, expenses, trips, tripFinances]);

  // Columns definition for each report
  const columns = useMemo(() => {
    switch (selectedReport) {
      case 'TRIP_PROFITABILITY':
        return [
          { key: 'tripNumber', label: 'Trip #' },
          { key: 'date', label: 'Date' },
          { key: 'route', label: 'Route' },
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'driver', label: 'Driver' },
          { key: 'status', label: 'Status' },
          { key: 'revenue', label: 'Revenue', type: 'currency' },
          { key: 'cost', label: 'Total Cost', type: 'currency' },
          { key: 'profit', label: 'Profit', type: 'currency' },
          { key: 'marginPct', label: 'Margin' },
          { key: 'costPerKm', label: 'Cost/KM' },
        ];
      case 'VEHICLE_COST':
        return [
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'fuelCost', label: 'Fuel Cost', type: 'currency' },
          { key: 'maintenanceCost', label: 'Maintenance Cost', type: 'currency' },
          { key: 'otherCost', label: 'Other Cost', type: 'currency' },
          { key: 'totalCost', label: 'Total Cost', type: 'currency' },
          { key: 'count', label: 'Entries Count', type: 'number' },
        ];
      case 'DRIVER_COST':
        return [
          { key: 'driver', label: 'Driver' },
          { key: 'fuelSpend', label: 'Fuel Spend', type: 'currency' },
          { key: 'mealsAndAllowance', label: 'Meals / Allowance', type: 'currency' },
          { key: 'totalSpend', label: 'Total Spend', type: 'currency' },
          { key: 'entriesCount', label: 'Entries Count', type: 'number' },
        ];
      case 'EXPENSE_BREAKDOWN':
        return [
          { key: 'category', label: 'Expense Category' },
          { key: 'count', label: 'Transaction Count', type: 'number' },
          { key: 'totalAmount', label: 'Total Amount', type: 'currency' },
          { key: 'pct', label: '% of Spend' },
        ];
      case 'FUEL_REPORT':
        return [
          { key: 'date', label: 'Date' },
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'driver', label: 'Driver' },
          { key: 'title', label: 'Fuel Title' },
          { key: 'description', label: 'Details' },
          { key: 'amount', label: 'Amount', type: 'currency' },
          { key: 'mileageAnomaly', label: 'Mileage Integrity' },
        ];
      case 'MAINTENANCE_REPORT':
        return [
          { key: 'date', label: 'Date' },
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'driver', label: 'Driver' },
          { key: 'title', label: 'Job Title' },
          { key: 'category', label: 'Type' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount', type: 'currency' },
        ];
      default:
        return [];
    }
  }, [selectedReport]);

  const handleExport = async (format = 'xlsx') => {
    if (!reportData.length) {
      toast.warn('No data available to export');
      return;
    }
    setExporting(true);
    try {
      const activeReportObj = REPORT_TYPES.find((r) => r.id === selectedReport);
      const filename = `Khata-${selectedReport.toLowerCase()}-${new Date().toISOString().split('T')[0]}`;
      const meta = {
        filters: [
          { label: 'Location', value: activeBranch ? activeBranch.name : 'All Locations' },
          {
            label: 'Period',
            value: dateRange.startDate
              ? `${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`
              : 'All Dates',
          },
          { label: 'Report', value: activeReportObj?.label || selectedReport },
        ],
        generatedAt: new Date(),
      };

      await exportTable({
        rows: reportData,
        columns,
        filename,
        format,
        meta,
      });
      toast.success(`Exported ${format.toUpperCase()} successfully`);
    } catch (err) {
      logger.error('Export failed:', err);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Financial Reports & Exports</h2>
            <Badge
              variant="outline"
              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {activeBranch ? activeBranch.name : 'All Locations'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Audit-ready export reports with active branch and filter preservation
          </p>
        </div>

        {/* Export Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || loading || reportData.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-40"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting || loading || reportData.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-40"
          >
            <FileSpreadsheet size={15} />
            Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {REPORT_TYPES.map((rep) => {
          const isSelected = selectedReport === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`p-3 text-left rounded-xl border transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <span
                className={`text-xs font-bold block ${isSelected ? 'text-indigo-950' : 'text-gray-800'}`}
              >
                {rep.label.replace(' Report', '')}
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 block">
                {rep.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-gray-500 font-medium mb-1">From Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 bg-white"
                value={dateRange.startDate ? dateRange.startDate.split('T')[0] : ''}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1">To Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 bg-white"
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
            <div>
              <label className="block text-gray-500 font-medium mb-1">Vehicle</label>
              <select
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 bg-white"
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
            <div>
              <label className="block text-gray-500 font-medium mb-1">Driver</label>
              <select
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 bg-white"
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
            <div>
              <label className="block text-gray-500 font-medium mb-1">Category</label>
              <select
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-gray-50/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {REPORT_TYPES.find((r) => r.id === selectedReport)?.label}
              </h3>
              <p className="text-xs text-gray-500">
                {REPORT_TYPES.find((r) => r.id === selectedReport)?.description}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {reportData.length} record{reportData.length === 1 ? '' : 's'}
            </Badge>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              <FileText size={36} className="mx-auto opacity-30 mb-2" />
              No records found for the selected report filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/90 text-xs">
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className={
                          col.type === 'currency' || col.type === 'number' ? 'text-right' : ''
                        }
                      >
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/70 text-xs">
                      {columns.map((col) => {
                        const val = row[col.key];
                        return (
                          <TableCell
                            key={col.key}
                            className={`py-2.5 ${
                              col.type === 'currency' || col.type === 'number'
                                ? 'text-right font-medium'
                                : ''
                            }`}
                          >
                            {col.type === 'currency'
                              ? formatCurrency(val)
                              : val != null
                                ? String(val)
                                : '—'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KhataReportsTab;
