import { useEffect } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import { TripService } from '../../pages/Trip/services';
import { getVehicleList } from '../../services/vehicleListService';

/** Loads the vehicle and driver pickers' options into the form's state. */
const useVehicleDriverOptions = () => {
  const {
    data: depsResponse,
    loading: depsLoading,
    error: depsError,
  } = useApi(async (signal) => {
    const [vehRes, drvRes] = await Promise.all([
      getVehicleList({ signal }),
      TripService.getDrivers({ limit: 100 }, { signal }),
    ]);
    return { vehRes, drvRes };
  }, []);
  useEffect(() => {
    if (depsError) toast.error('Failed to load drivers and vehicles');
  }, [depsError]);
  return {
    loading: depsLoading,
    vehicles: (depsResponse?.vehRes || []).map((v) => ({
      id: v._id || v.id,
      name: v.registrationNumber || '',
      registration: `${v.vehicleType || ''} - ${v.model || 'N/A'}`,
    })),
    drivers: (depsResponse?.drvRes?.data || []).map((d) => ({
      id: d._id || d.id,
      name: `${d.firstName} ${d.lastName || ''}`.trim(),
      licenseNo: d.licenseNo || 'N/A',
    })),
  };
};

export default useVehicleDriverOptions;
