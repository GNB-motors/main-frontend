// DataTable column definitions for TripLedgerReport. Extracted (WS0.7);
// cell markup preserved byte-identically.
import { ChevronRight } from 'lucide-react';
import { formatLedgerCurrency, formatLedgerDate, formatLedgerWeight } from './tripLedger';

export function useTripLedgerColumns() {
  return [
    {
      key: 'tripNumber',
      label: 'Trip No',
      render: (row) => <div className="cell-primary">{row.tripNumber || '-'}</div>,
    },
    {
      key: 'tripDate',
      label: 'Date',
      render: (row) => <div className="cell-primary">{formatLedgerDate(row.tripDate)}</div>,
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (row) => (
        <>
          <div className="cell-primary">{row.driver?.fullName || '-'}</div>
          <div className="cell-secondary">{row.driver?.mobileNumber || ''}</div>
        </>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row) => (
        <>
          <div className="cell-primary">{row.vehicle?.registrationNumber || '-'}</div>
          <div className="cell-secondary">{row.vehicle?.vehicleType || ''}</div>
        </>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (row) => (
        <>
          <div className="cell-primary">{row.route?.name || '-'}</div>
          <div className="cell-secondary">
            {row.route?.distanceKm ? `${row.route.distanceKm} km` : ''}
          </div>
        </>
      ),
    },
    {
      key: 'netWeight',
      label: 'Net Wt',
      align: 'right',
      render: (row) => (
        <div className="cell-primary">{formatLedgerWeight(row.weights?.netWeight)}</div>
      ),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      align: 'right',
      render: (row) => (
        <div className="cell-primary positive">
          {formatLedgerCurrency(row.performance?.totalRevenue)}
        </div>
      ),
    },
    {
      key: 'expense',
      label: 'Expense',
      align: 'right',
      render: (row) => (
        <div className="cell-primary negative">
          {formatLedgerCurrency(row.performance?.totalExpense)}
        </div>
      ),
    },
    {
      key: 'profit',
      label: 'Profit',
      align: 'right',
      render: (row) => (
        <div
          className={`cell-primary ${row.performance?.netProfit >= 0 ? 'positive' : 'negative'}`}
        >
          {formatLedgerCurrency(row.performance?.netProfit)}
        </div>
      ),
    },
    {
      key: 'margin',
      label: 'Margin',
      align: 'right',
      render: (row) => (
        <>
          <span className="date-text">
            {typeof row.performance?.profitMargin === 'number'
              ? `${row.performance.profitMargin.toFixed(1)}%`
              : '-'}
          </span>
          <button className="view-details-btn">
            View details
            <ChevronRight size={14} />
          </button>
        </>
      ),
    },
  ];
}
