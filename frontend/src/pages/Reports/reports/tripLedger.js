/**
 * Pure logic for TripLedgerReport: formatting, option extraction, filtering,
 * pagination, and typed export mapping. Framework-free + unit-tested (rule 21).
 */
import dayjs from 'dayjs';

export const formatLedgerCurrency = (value) => {
  if (typeof value !== 'number') return '-';
  return `₹${value.toLocaleString('en-IN')}`;
};

export const formatLedgerDate = (dateStr) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('DD MMM YYYY');
};

export const formatLedgerWeight = (value) => {
  if (typeof value !== 'number') return '-';
  return `${value.toLocaleString('en-IN')} kg`;
};

/** Compact label for the profit filter button (e.g. ₹-1.0K - ₹250.0K). */
export const formatProfitLabel = (value) => {
  if (value === undefined || value === null) return '';
  if (Math.abs(value) < 1000) return `₹${value}`;
  return `₹${(value / 1000).toFixed(1)}K`;
};

export function extractDriverOptions(employees) {
  return (employees || [])
    .map((emp) => `${emp.firstName || ''} ${emp.lastName || ''}`.trim())
    .filter(Boolean)
    .sort();
}

export function extractVehicleOptions(vehicles) {
  return (vehicles || [])
    .map((vehicle) => vehicle.registrationNumber || '')
    .filter(Boolean)
    .sort();
}

export function extractRouteOptions(rows) {
  const routes = [...new Set((rows || []).map((d) => d.route?.name).filter(Boolean))];
  return routes.sort();
}

/** Client-side filter: driver / vehicle / route equality + profit range window. */
export function filterLedgerRows(
  ledgerData,
  { selectedDriver = 'all', selectedVehicle = 'all', selectedRoute = 'all', profitRange } = {},
) {
  let rows = ledgerData || [];

  if (selectedDriver && selectedDriver !== 'all') {
    rows = rows.filter((row) => row.driver?.fullName === selectedDriver);
  }
  if (selectedVehicle && selectedVehicle !== 'all') {
    rows = rows.filter((row) => row.vehicle?.registrationNumber === selectedVehicle);
  }
  if (selectedRoute && selectedRoute !== 'all') {
    rows = rows.filter((row) => row.route?.name === selectedRoute);
  }

  if (profitRange) {
    rows = rows.filter((row) => {
      const profit = row.performance?.netProfit || 0;
      return profit >= profitRange[0] && profit <= profitRange[1];
    });
  }

  return rows;
}

export function paginateRows(rows, currentPage, itemsPerPage) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return (rows || []).slice(startIndex, startIndex + itemsPerPage);
}

/** Min/max netProfit across rows, or null when there is no data. */
export function computeProfitBounds(rows) {
  if (!rows || rows.length === 0) return null;
  const profits = rows.map((d) => d.performance?.netProfit || 0);
  return { min: Math.min(...profits), max: Math.max(...profits) };
}

/** Pagination window for the shadcn Pagination items (current ± 1, first/last kept). */
export function renderPageItems(currentPage, totalPages) {
  const items = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      items.push(i);
    } else if (items[items.length - 1] !== '...') {
      items.push('...');
    }
  }
  return items;
}

export const LEDGER_EXPORT_COLUMNS = [
  { key: 'tripNumber', label: 'Trip No' },
  { key: 'tripDate', label: 'Date' },
  { key: 'driver', label: 'Driver' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'route', label: 'Route' },
  { key: 'netWeight', label: 'Net Weight (kg)', type: 'number' },
  { key: 'revenue', label: 'Revenue (₹)', type: 'currency' },
  { key: 'expense', label: 'Expense (₹)', type: 'currency' },
  { key: 'profit', label: 'Profit (₹)', type: 'currency' },
  { key: 'margin', label: 'Margin (%)', type: 'number' },
];

export function mapLedgerRowForExport(row) {
  return {
    tripNumber: row.tripNumber || '-',
    tripDate: row.tripDate ? dayjs(row.tripDate).format('DD/MM/YYYY') : '-',
    driver: row.driver?.fullName || '-',
    vehicle: row.vehicle?.registrationNumber || '-',
    route: row.route?.name || '-',
    netWeight: row.weights?.netWeight ?? null,
    revenue: row.performance?.totalRevenue ?? null,
    expense: row.performance?.totalExpense ?? null,
    profit: row.performance?.netProfit ?? null,
    margin:
      typeof row.performance?.profitMargin === 'number'
        ? Number(row.performance.profitMargin.toFixed(2))
        : null,
  };
}

export function ledgerExportMeta({
  selectedDriver = 'all',
  selectedVehicle = 'all',
  selectedRoute = 'all',
  profitRange,
  minProfit,
  maxProfit,
} = {}) {
  const filters = [];
  if (selectedDriver !== 'all') filters.push({ label: 'Driver', value: selectedDriver });
  if (selectedVehicle !== 'all') filters.push({ label: 'Vehicle', value: selectedVehicle });
  if (selectedRoute !== 'all') filters.push({ label: 'Route', value: selectedRoute });
  if (profitRange && !(profitRange[0] === minProfit && profitRange[1] === maxProfit)) {
    filters.push({
      label: 'Profit range',
      value: `${formatProfitLabel(profitRange[0])} - ${formatProfitLabel(profitRange[1])}`,
    });
  }
  return { filters, generatedAt: new Date() };
}
