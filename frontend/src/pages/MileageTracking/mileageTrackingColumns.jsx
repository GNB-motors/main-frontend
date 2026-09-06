import { formatMileageDate } from './mileageTrackingLogic';
import { HealthStatusBadge, AvgMileageCell, ViewLogsButton } from './mileageTrackingCells';

/** Column defs for the Mileage Tracking fleet-overview table. */
export function buildMileageTrackingColumns({ onOpenVehicle }) {
  return [
    { key: 'vehicle', label: 'Vehicle Number', render: (v) => v.vehicleNumber || 'Unknown' },
    { key: 'trips', label: 'Completed Trips', render: (v) => v.completedTrips },
    {
      key: 'avgMileage',
      label: 'Average Mileage (km/L)',
      render: (v) => <AvgMileageCell value={v.avgMileage} />,
    },
    { key: 'lastOdometer', label: 'Last Odometer', render: (v) => v.lastOdometer || '-' },
    {
      key: 'lastRefuel',
      label: 'Last Refuel Date',
      render: (v) => <span className="date-text">{formatMileageDate(v.lastRefuelDate)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <HealthStatusBadge status={v.healthStatus} />,
    },
    {
      key: 'actions',
      label: '',
      render: (v) => (
        <ViewLogsButton
          onClick={(e) => {
            e.stopPropagation();
            onOpenVehicle(v.vehicleId);
          }}
        />
      ),
    },
  ];
}
