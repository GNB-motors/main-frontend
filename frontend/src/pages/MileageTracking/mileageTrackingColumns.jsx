import { formatMileageDate } from './mileageTrackingLogic';
import { HealthStatusBadge, AvgMileageCell, ViewLogsButton } from './mileageTrackingCells';

/** Column defs for the Mileage Tracking fleet-overview table. */
export function buildMileageTrackingColumns({ onOpenVehicle }) {
  return [
    {
      key: 'vehicle',
      label: 'Vehicle Plate',
      width: '20%',
      render: (v) => (
        <div className="mt-veh-cell">
          <span className="mt-plate-badge mt-mono">{v.vehicleNumber || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'trips',
      label: 'Completed Trips',
      width: '14%',
      align: 'center',
      render: (v) => (
        <span className="mt-mono font-semibold text-slate-700 dark:text-slate-300">
          {v.completedTrips ?? 0}
        </span>
      ),
    },
    {
      key: 'avgMileage',
      label: 'Average Mileage',
      width: '16%',
      align: 'center',
      render: (v) => <AvgMileageCell value={v.avgMileage} />,
    },
    {
      key: 'lastOdometer',
      label: 'Last Odometer',
      width: '16%',
      align: 'center',
      render: (v) => (
        <span className="mt-mono text-slate-700 dark:text-slate-300">
          {v.lastOdometer != null ? `${Number(v.lastOdometer).toLocaleString()} km` : '—'}
        </span>
      ),
    },
    {
      key: 'lastRefuel',
      label: 'Last Refuel Date',
      width: '16%',
      align: 'center',
      render: (v) => (
        <span className="mt-mono text-slate-600 dark:text-slate-400 text-[11.5px]">
          {formatMileageDate(v.lastRefuelDate)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Telemetry Status',
      width: '14%',
      align: 'center',
      render: (v) => <HealthStatusBadge status={v.healthStatus} />,
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'center',
      width: '10%',
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
