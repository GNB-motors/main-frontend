import { useMemo } from 'react';
import { formatDayText } from './minutesAgoFormat.js';

export default function useSelectedDriver(selectedVehicle, vehiclesMeta, driverAssignments) {
  // Selected vehicle's active driver resolver
  const selectedDriver = useMemo(() => {
    if (!selectedVehicle) return null;
    const cleanPlate = (selectedVehicle.plate || '').toUpperCase().replace(/\s+/g, '');
    const meta = vehiclesMeta[cleanPlate] || vehiclesMeta[selectedVehicle.plate] || {};

    const assignment =
      driverAssignments[cleanPlate] ||
      driverAssignments[selectedVehicle.plate] ||
      (meta._id ? driverAssignments[meta._id] : null);

    if (assignment) {
      const d =
        assignment.driverId && typeof assignment.driverId === 'object' ? assignment.driverId : null;
      return {
        name: d?.name || d?.fullName || assignment.driverName || 'Primary Driver',
        phone: d?.phone || d?.mobileNumber || assignment.driverPhone || null,
        since: assignment.startDate ? formatDayText(assignment.startDate) : null,
      };
    }

    if (meta.assignedDriver) {
      if (typeof meta.assignedDriver === 'object') {
        return {
          name: meta.assignedDriver.name || meta.assignedDriver.fullName || 'Assigned Driver',
          phone: meta.assignedDriver.phone || meta.assignedDriver.mobileNumber || null,
        };
      }
    }

    if (meta.driverName || meta.driver) {
      const d = typeof meta.driver === 'object' ? meta.driver : null;
      return {
        name: meta.driverName || d?.name || d?.fullName || 'Assigned Driver',
        phone: meta.driverPhone || meta.driverMobile || d?.phone || null,
      };
    }

    return null;
  }, [selectedVehicle, vehiclesMeta, driverAssignments]);

  return selectedDriver;
}
