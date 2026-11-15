import { useMemo } from 'react';
import { formatDate, formatNumber, formatCurrency } from './mileageIntervalReportUtils';
import { AlertCell, MileageCell } from './mileageIntervalReportCells';

export function useMileageIntervalReportColumns() {
  return useMemo(
    () => [
      {
        key: 'startDate',
        label: 'Start Date',
        render: (row) => (
          <div className="cell-primary">{formatDate(row.startDate || row.date)}</div>
        ),
      },
      {
        key: 'endDate',
        label: 'End Date',
        render: (row) => (
          <div className="cell-primary">
            {row.endDate ? (
              formatDate(row.endDate)
            ) : row.intervalStatus === 'ONGOING' ? (
              <span
                style={{
                  display: 'inline-block',
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  padding: '1px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
                title="Active ongoing cycle — closes when vehicle completes its next full-tank refuel"
              >
                Ongoing
              </span>
            ) : (
              '—'
            )}
          </div>
        ),
      },
      {
        key: 'vehicle',
        label: 'Vehicle',
        render: (row) => <div className="cell-primary font-medium">{row.vehicleNumber || '—'}</div>,
      },
      {
        key: 'driver',
        label: 'Driver',
        render: (row) => <div className="cell-primary">{row.driverName || '—'}</div>,
      },
      {
        key: 'pumpLocation',
        label: 'Pump Location',
        render: (row) => <div className="cell-primary">{row.pumpLocation || '—'}</div>,
      },
      {
        key: 'source',
        label: 'Source',
        render: (row) => <div className="cell-primary">{row.source?.name || '—'}</div>,
      },
      {
        key: 'destination',
        label: 'Destination',
        render: (row) => <div className="cell-primary">{row.destination?.name || '—'}</div>,
      },
      {
        key: 'startOdo',
        label: 'Start Odo',
        align: 'right',
        render: (row) => <div className="cell-primary">{formatNumber(row.startOdo)}</div>,
      },
      {
        key: 'endOdo',
        label: 'End Odo',
        align: 'right',
        render: (row) => (
          <div className="cell-primary">
            {row.endOdo != null ? (
              formatNumber(row.endOdo)
            ) : row.intervalStatus === 'ONGOING' ? (
              <span
                style={{ color: '#9ca3af', fontSize: '11px', fontStyle: 'italic' }}
                title="Awaiting closing refuel"
              >
                In progress
              </span>
            ) : (
              '—'
            )}
          </div>
        ),
      },
      {
        key: 'distance',
        label: 'Distance',
        align: 'right',
        render: (row) => (
          <div className="cell-primary">
            {typeof row.distanceKm === 'number' ? `${row.distanceKm.toFixed(1)} km` : '—'}
          </div>
        ),
      },
      {
        key: 'fuel',
        label: 'Fuel (L)',
        align: 'right',
        render: (row) => (
          <div className="cell-primary">
            {typeof row.fuelLiters === 'number' ? row.fuelLiters.toFixed(2) : '—'}
          </div>
        ),
      },
      {
        key: 'mileage',
        label: 'Mileage',
        align: 'right',
        render: (row) => <MileageCell value={row.mileageKmPerL} quality={row.quality} />,
      },
      {
        key: 'def',
        label: 'DEF',
        align: 'right',
        render: (row) => (
          <div className="cell-primary">
            {typeof row.defLiters === 'number' ? `${row.defLiters.toFixed(1)} L` : '—'}
          </div>
        ),
      },
      {
        key: 'cost',
        label: 'Cost',
        align: 'right',
        render: (row) => (
          <div className="cell-primary" style={{ fontWeight: 600 }}>
            {formatCurrency(row.cost)}
          </div>
        ),
      },
      {
        key: 'alert',
        label: 'Alert',
        render: (row) => <AlertCell alert={row.alert} />,
      },
    ],
    [],
  );
}
