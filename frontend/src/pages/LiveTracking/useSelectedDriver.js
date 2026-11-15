import { useMemo } from 'react';
import { formatInIST } from '../../utils/dateUtils';

const NO_NAME = 'Name not recorded';

/**
 * The selected vehicle's driver of record. The positions API now carries it
 * (backend positionsMaster: the single assignment covering now; two covering
 * read UNCLEAR — audit DC-22). The assignment list is only a fallback for an
 * older backend. A missing name is said, never invented (DC-23).
 */
export default function useSelectedDriver(selectedVehicle, vehiclesMeta, driverAssignments) {
  return useMemo(() => {
    if (!selectedVehicle) return null;

    const d = selectedVehicle.driver;
    if (d && d.state) {
      if (d.state === 'UNCLEAR') return { unclear: true, name: null, phone: null, since: null };
      if (d.state !== 'ASSIGNED') return null;
      return {
        name: d.name || NO_NAME,
        phone: d.phone || null,
        since: d.since ? formatInIST(d.since, 'D MMM YYYY') : null,
      };
    }

    const cleanPlate = (selectedVehicle.plate || '').toUpperCase().replace(/\s+/g, '');
    const meta = vehiclesMeta[cleanPlate] || vehiclesMeta[selectedVehicle.plate] || {};
    const assignment =
      driverAssignments[cleanPlate] ||
      driverAssignments[selectedVehicle.plate] ||
      (meta._id ? driverAssignments[meta._id] : null);
    if (!assignment) return null;
    const u =
      assignment.driverId && typeof assignment.driverId === 'object' ? assignment.driverId : null;
    const fullName = [u?.firstName, u?.lastName].filter(Boolean).join(' ');
    return {
      name: u?.name || u?.fullName || fullName || assignment.driverName || NO_NAME,
      phone: u?.phone || u?.mobileNumber || assignment.driverPhone || null,
      since: formatInIST(assignment.startDate, 'D MMM YYYY'),
    };
  }, [selectedVehicle, vehiclesMeta, driverAssignments]);
}
