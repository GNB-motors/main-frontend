import { useMemo } from 'react';
import { formatDateRange } from './fuelComparisonReportUtils';
import { VarianceBadge, FlagBadge, DriverCell } from './fuelComparisonReportCells';

export function useFuelComparisonColumns() {
  return useMemo(
    () => [
      {
        key: 'vehicle',
        label: 'Vehicle No.',
        render: (rec) => (
          <div className="cell-primary font-medium">{rec.vehicleId?.registrationNumber || '—'}</div>
        ),
      },
      {
        key: 'driver',
        label: 'Driver',
        render: (rec) => <DriverCell driver={rec.driverId} />,
      },
      {
        key: 'billFuel',
        label: 'Bill Fuel (L)',
        align: 'right',
        render: (rec) => (
          <div className="cell-primary">
            {rec.billFuelConsumed != null ? rec.billFuelConsumed.toFixed(2) : '—'}
          </div>
        ),
      },
      {
        key: 'fleetEdgeFuel',
        label: 'FleetEdge Fuel (L)',
        align: 'right',
        render: (rec) => (
          <div className="cell-primary">
            {rec.fleetEdgeFuelConsumed != null ? rec.fleetEdgeFuelConsumed.toFixed(2) : '—'}
          </div>
        ),
      },
      {
        key: 'variance',
        label: 'Variance',
        align: 'right',
        render: (rec) => (
          <VarianceBadge variance={rec.variance} variancePercent={rec.variancePercent} />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        render: (rec) => <FlagBadge isFlagged={rec.isFlagged} />,
      },
      {
        key: 'dateRange',
        label: 'Date Range',
        render: (rec) => (
          <div className="cell-secondary fuel-date-range">
            {formatDateRange(rec.fromDate, rec.toDate)}
          </div>
        ),
      },
    ],
    [],
  );
}
