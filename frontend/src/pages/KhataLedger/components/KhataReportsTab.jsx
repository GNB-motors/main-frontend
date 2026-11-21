import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'react-toastify';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import exportTable from '../../../lib/exportTable';
import { useActiveBranch } from '../../../contexts/BranchContext';
import logger from '../../../utils/logger.js';
import {
  KhataCard,
  KhataEmpty,
  KhataField,
  KhataPager,
  KhataPill,
  KhataSectionHead,
  KhataTableSkeleton,
} from './khataUi';
import {
  formatCurrency,
  formatDate,
  CATEGORIES,
  getInitialDateRange,
  getVehicleLabel,
  getDriverName,
  plural,
} from '../utils';
import { categoryLabel, tripStateLabel, tripStateTone, tripsInPeriod } from './ledgerDetailLogic';
import './khataDetail.css';

const PAGE_SIZE = 25;
// Trip finances are one request per trip, so only the newest trips get one.
const FINANCE_TRIPS = 50;

const REPORT_TYPES = [
  {
    id: 'TRIP_PROFITABILITY',
    short: 'Trip profit',
    label: 'Trip profitability',
    description: 'Revenue, cost, margin and cost per km of each ERP trip.',
  },
  {
    id: 'VEHICLE_COST',
    short: 'Vehicle cost',
    label: 'Vehicle cost',
    description: 'Fuel, maintenance and other cost of each vehicle.',
  },
  {
    id: 'DRIVER_COST',
    short: 'Driver cost',
    label: 'Driver cost',
    description: 'Fuel, meals, allowances and total spend of each driver.',
  },
  {
    id: 'EXPENSE_BREAKDOWN',
    short: 'Categories',
    label: 'Expense categories',
    description: 'Spend grouped by expense category.',
  },
  {
    id: 'FUEL_REPORT',
    short: 'Fuel',
    label: 'Fuel spend and mileage flags',
    description: 'Each fuel entry, with a flag where the mileage looked wrong.',
  },
  {
    id: 'MAINTENANCE_REPORT',
    short: 'Maintenance',
    label: 'Maintenance and service',
    description: 'Workshop service, parts and repairs.',
  },
];

// The trip list sends a populated object or a bare id; a bare id is looked up in the picker list.
const tripRef = (ref, list) =>
  ref && typeof ref === 'object' ? ref : list.find((item) => item._id === ref);
const nameOr = (name) => (name && name !== '-' ? name : '—');

const KhataReportsTab = ({ vehicles = [], drivers = [], erpAvailable }) => {
  const { branchId, activeBranch } = useActiveBranch();
  // The trip report needs ERP trips; it is offered once the location has one.
  const reportTypes = REPORT_TYPES.filter(
    (rep) => rep.id !== 'TRIP_PROFITABILITY' || erpAvailable === true,
  );
  const [chosenReport, setSelectedReport] = useState(() =>
    erpAvailable === true ? 'TRIP_PROFITABILITY' : 'VEHICLE_COST',
  );
  const selectedReport = reportTypes.some((rep) => rep.id === chosenReport)
    ? chosenReport
    : reportTypes[0].id;
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [tripFinances, setTripFinances] = useState({});
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // The expenses endpoint caps a page at 100 rows, so the report reads every
      // page instead of asking for a limit the API rejects.
      const expParams = {
        includeTripExpenses: true,
      };
      if (branchId) expParams.branchId = branchId;
      if (dateRange.startDate) expParams.startDate = dateRange.startDate;
      if (dateRange.endDate) expParams.endDate = dateRange.endDate;
      if (vehicleId) expParams.vehicleId = vehicleId;
      if (driverId) expParams.driverId = driverId;
      if (category) expParams.category = category;

      // The trip endpoint accepts neither branchId nor driverId; the branch comes
      // from the shared X-Branch-Id header and the driver filter is applied below.
      const tripParams = {
        limit: 200,
      };
      if (vehicleId) tripParams.vehicleId = vehicleId;

      const [expRes, tripRes] = await Promise.all([
        KhataLedgerService.getDashboardExpenses(expParams).catch(() => []),
        KhataLedgerService.getErpTrips(tripParams).catch(() => ({ data: [] })),
      ]);

      const loadedExpenses = Array.isArray(expRes)
        ? expRes
        : expRes.results || expRes.data || (Array.isArray(expRes) ? expRes : []);
      const loadedTrips = tripsInPeriod(
        (tripRes.data || tripRes.results || (Array.isArray(tripRes) ? tripRes : [])).filter(
          (t) => !driverId || String(t.driverId?._id || t.driverId) === String(driverId),
        ),
        dateRange,
      );

      setExpenses(loadedExpenses);
      setTrips(loadedTrips);

      // Load finances for trips
      const finances = {};
      await Promise.allSettled(
        loadedTrips.slice(0, FINANCE_TRIPS).map(async (t) => {
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
          // A trip without a finance summary has unknown figures, not zero ones.
          const m = tripFinances[t._id];
          const revenue = m?.revenue != null ? m.revenue : null;
          const cost = m?.cost != null ? m.cost : null;
          const profit = revenue != null && cost != null ? revenue - cost : null;
          const marginPct =
            profit != null && revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '—';
          const distance = t.totalKm || null;
          const costPerKm =
            distance && distance > 0 && cost > 0 ? (cost / distance).toFixed(2) : '—';

          return {
            tripNumber: t.tripNumber || `TRIP-${t._id.slice(-6).toUpperCase()}`,
            date: formatDate(t.tripDate || t.createdAt),
            route: t.fromLocation && t.toLocation ? `${t.fromLocation} → ${t.toLocation}` : '—',
            vehicle: nameOr(t.vehicleNumber || getVehicleLabel(tripRef(t.vehicleId, vehicles))),
            driver: nameOr(getDriverName(tripRef(t.driverId, drivers))),
            status: tripStateLabel(t.state),
            state: t.state,
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
            catMap[cat] = { category: categoryLabel(cat), count: 0, totalAmount: 0 };
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
            category: categoryLabel(e.category),
            description: e.description || '—',
            amount: Number(e.amount) || 0,
          }));
      }

      default:
        return [];
    }
  }, [selectedReport, expenses, trips, tripFinances, vehicles, drivers]);

  // Columns definition for each report
  const columns = useMemo(() => {
    switch (selectedReport) {
      case 'TRIP_PROFITABILITY':
        return [
          { key: 'tripNumber', label: 'Trip' },
          { key: 'date', label: 'Date' },
          { key: 'route', label: 'Route' },
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'driver', label: 'Driver' },
          { key: 'status', label: 'Status' },
          { key: 'revenue', label: 'Revenue', type: 'currency' },
          { key: 'cost', label: 'Total cost', type: 'currency' },
          { key: 'profit', label: 'Profit', type: 'currency' },
          { key: 'marginPct', label: 'Margin', align: 'num' },
          { key: 'costPerKm', label: 'Cost per km', align: 'num' },
        ];
      case 'VEHICLE_COST':
        return [
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'fuelCost', label: 'Fuel cost', type: 'currency' },
          { key: 'maintenanceCost', label: 'Maintenance cost', type: 'currency' },
          { key: 'otherCost', label: 'Other cost', type: 'currency' },
          { key: 'totalCost', label: 'Total cost', type: 'currency' },
          { key: 'count', label: 'Entries', type: 'number' },
        ];
      case 'DRIVER_COST':
        return [
          { key: 'driver', label: 'Driver' },
          { key: 'fuelSpend', label: 'Fuel spend', type: 'currency' },
          { key: 'mealsAndAllowance', label: 'Meals and allowance', type: 'currency' },
          { key: 'totalSpend', label: 'Total spend', type: 'currency' },
          { key: 'entriesCount', label: 'Entries', type: 'number' },
        ];
      case 'EXPENSE_BREAKDOWN':
        return [
          { key: 'category', label: 'Category' },
          { key: 'count', label: 'Entries', type: 'number' },
          { key: 'totalAmount', label: 'Total amount', type: 'currency' },
          { key: 'pct', label: 'Share of spend', align: 'num' },
        ];
      case 'FUEL_REPORT':
        return [
          { key: 'date', label: 'Date' },
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'driver', label: 'Driver' },
          { key: 'title', label: 'Entry' },
          { key: 'description', label: 'Details' },
          { key: 'amount', label: 'Amount', type: 'currency' },
          { key: 'mileageAnomaly', label: 'Mileage check' },
        ];
      case 'MAINTENANCE_REPORT':
        return [
          { key: 'date', label: 'Date' },
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'driver', label: 'Driver' },
          { key: 'title', label: 'Job' },
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
          { label: 'Location', value: activeBranch ? activeBranch.name : 'All locations' },
          {
            label: 'Period',
            value: dateRange.startDate
              ? `${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`
              : 'All dates',
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

  useEffect(() => {
    setPage(1);
  }, [reportData]);

  const activeReport = REPORT_TYPES.find((r) => r.id === selectedReport);
  const totalPages = Math.max(1, Math.ceil(reportData.length / PAGE_SIZE));
  const pageRows = reportData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const cantExport = exporting || loading || reportData.length === 0;

  const renderCell = (col, row) => {
    const val = row[col.key];
    if (col.type === 'currency') return val == null ? '—' : formatCurrency(val);
    if (val == null || val === '') return '—';
    if (selectedReport === 'TRIP_PROFITABILITY' && col.key === 'status') {
      return (
        <KhataPill small tone={tripStateTone(row.state)}>
          {val}
        </KhataPill>
      );
    }
    if (col.key === 'mileageAnomaly') {
      return row.mileageAnomaly === 'Normal' ? (
        <span className="khata-muted">Normal</span>
      ) : (
        <KhataPill small tone="warn">
          {val}
        </KhataPill>
      );
    }
    if (val === '—' || val === 'Unattributed' || val === 'Unassigned') {
      return <span className="khata-muted">{val}</span>;
    }
    return String(val);
  };

  const cellClass = (col, row) => {
    if (col.type === 'currency' || col.type === 'number' || col.align === 'num') {
      return row && col.key === 'profit' && row.profit < 0 ? 'is-num is-negative' : 'is-num';
    }
    if (col.key === 'tripNumber' || col.key === 'vehicle') return 'is-code';
    if (col.key === 'date') return 'is-secondary khata-nowrap';
    if (col.key === 'description') return 'is-secondary';
    return undefined;
  };

  return (
    <div className="khata-reports">
      <KhataSectionHead
        title="Reports"
        subtitle={`Audit-ready exports for ${activeBranch ? activeBranch.name : 'all locations'}, with the filters below.`}
        actions={
          <>
            <button
              type="button"
              className="khata-btn"
              onClick={() => handleExport('csv')}
              disabled={cantExport}
            >
              <Download size={15} aria-hidden="true" />
              Export CSV
            </button>
            <button
              type="button"
              className="khata-btn khata-btn--primary"
              onClick={() => handleExport('xlsx')}
              disabled={cantExport}
            >
              <FileSpreadsheet size={15} aria-hidden="true" />
              Export Excel
            </button>
          </>
        }
      />
      <KhataCard flush aria-label="Report and filters">
        <div className="khata-strip">
          <div className="khata-segment" role="group" aria-label="Report">
            {reportTypes.map((rep) => (
              <button
                key={rep.id}
                type="button"
                aria-pressed={selectedReport === rep.id}
                onClick={() => setSelectedReport(rep.id)}
              >
                {rep.short}
              </button>
            ))}
          </div>
        </div>
        <div className="khata-strip">
          <div className="khata-filters">
            <div className="khata-field">
              <span className="khata-field-label">Period</span>
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
            </div>
            <KhataField label="Vehicle" htmlFor="krt-filter-vehicle">
              <SearchableSelect
                id="krt-filter-vehicle"
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
            <KhataField label="Driver" htmlFor="krt-filter-driver">
              <SearchableSelect
                id="krt-filter-driver"
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
            <KhataField label="Category" htmlFor="krt-filter-category">
              <SearchableSelect
                id="krt-filter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(cat)}
                  </option>
                ))}
              </SearchableSelect>
            </KhataField>
          </div>
        </div>
      </KhataCard>

      <KhataCard
        flush
        title={
          <>
            {activeReport?.label}
            {!loading ? (
              <span className="khata-count">{plural(reportData.length, 'row')}</span>
            ) : null}
          </>
        }
        subtitle={activeReport?.description}
      >
        {selectedReport === 'TRIP_PROFITABILITY' ? (
          <div className="khata-strip">
            <p className="khata-hint">
              ERP trips in this period, from the newest 200. Revenue and cost are loaded for the
              newest {FINANCE_TRIPS}; the rest show —.
            </p>
          </div>
        ) : null}
        {loading ? (
          <KhataTableSkeleton rows={6} />
        ) : reportData.length === 0 ? (
          <KhataEmpty icon={FileText} title="No rows for these filters">
            Pick a wider period or clear a filter.
          </KhataEmpty>
        ) : (
          <Table className="khata-table">
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={
                      col.type === 'currency' || col.type === 'number' || col.align === 'num'
                        ? 'is-num'
                        : undefined
                    }
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row, index) => (
                <TableRow key={(page - 1) * PAGE_SIZE + index}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cellClass(col, row)}>
                      {renderCell(col, row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && reportData.length ? (
          <KhataPager
            summary={plural(reportData.length, 'row')}
            page={page}
            totalPages={totalPages}
            onPage={setPage}
          />
        ) : null}
      </KhataCard>
    </div>
  );
};

export default KhataReportsTab;
