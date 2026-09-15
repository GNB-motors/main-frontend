import { getVehicleRegistration, getDriverName } from '../../utils/dataFormatters';
import { StatusBadge, DateCell } from './tripManagementCells';

const weightSlipColumns = [
  {
    key: 'vehicle',
    label: 'Vehicle',
    render: (trip) => (
      <span className="font-semibold text-gray-900">
        {getVehicleRegistration(trip.journeyId?.vehicleId || trip.vehicleId) || '-'}
      </span>
    ),
  },
  {
    key: 'driver',
    label: 'Driver',
    render: (trip) => getDriverName(trip.journeyId?.driverId || trip.driverId) || '-',
  },
  {
    key: 'route',
    label: 'Route',
    render: (trip) =>
      trip.routeData?.name ||
      (trip.routeData?.sourceLocation?.city && trip.routeData?.destLocation?.city
        ? `${trip.routeData.sourceLocation.city} → ${trip.routeData.destLocation.city}`
        : '-'),
  },
  { key: 'material', label: 'Material', render: (trip) => trip.materialType || '-' },
  {
    key: 'netWeight',
    label: 'Net Weight',
    render: (trip) => (trip.weights?.netWeight ? `${trip.weights.netWeight} kg` : '-'),
  },
  { key: 'status', label: 'Status', render: (trip) => <StatusBadge status={trip.status} /> },
  { key: 'date', label: 'Date', render: (trip) => <DateCell trip={trip} /> },
];

const refuelColumns = [
  {
    key: 'vehicle',
    label: 'Vehicle',
    render: (trip) => (
      <span className="font-semibold text-gray-900">
        {getVehicleRegistration(trip.journeyId?.vehicleId || trip.vehicleId) || '-'}
      </span>
    ),
  },
  {
    key: 'driver',
    label: 'Driver',
    render: (trip) =>
      trip.driverId?.firstName && trip.driverId?.lastName
        ? `${trip.driverId.firstName} ${trip.driverId.lastName}`
        : '-',
  },
  {
    key: 'tripsCount',
    label: 'Trips Count',
    render: (trip) => trip.journeyFinancials?.totalTrips || trip.weightSlipTrips?.length || 0,
  },
  {
    key: 'totalFuel',
    label: 'Total Fuel',
    render: (trip) =>
      trip.fuelManagement?.totalLiters ? `${trip.fuelManagement.totalLiters.toFixed(2)} L` : '-',
  },
  {
    key: 'revenue',
    label: 'Revenue',
    render: (trip) =>
      trip.journeyFinancials?.totalRevenue
        ? `₹${trip.journeyFinancials.totalRevenue.toFixed(2)}`
        : '-',
  },
  { key: 'status', label: 'Status', render: (trip) => <StatusBadge status={trip.status} /> },
  { key: 'date', label: 'Date', render: (trip) => <DateCell trip={trip} /> },
];

/** Column defs for the active tab — weight-slip trips vs refuel journeys. */
export function buildTripManagementColumns(activeTab) {
  return activeTab === 'trips' ? weightSlipColumns : refuelColumns;
}
