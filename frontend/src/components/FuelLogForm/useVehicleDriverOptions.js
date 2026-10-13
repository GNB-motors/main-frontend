import { useEffect } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import { TripService } from '../../pages/Trip/services';
import { getVehicleList } from '../../services/vehicleListService';

/** Loads the vehicle and driver pickers' options into the form's state. */
const useVehicleDriverOptions = (setVehicles, setDrivers) => {
  const {
    data: depsResponse,
    loading: depsLoading,
    error: depsError,
  } = useApi(async () => {
    const [vehRes, drvRes] = await Promise.all([
      getVehicleList(),
      TripService.getDrivers({ limit: 100 }),
    ]);
    return { vehRes, drvRes };
  }, []);
  useEffect(() => {
    if (!depsResponse) return;
    const { vehRes, drvRes } = depsResponse;
    const vList = vehRes || [];
    setVehicles(
      vList.map((v) => ({
        id: v._id,
        name: v.registrationNumber,
        registration: `${v.vehicleType} - ${v.model || 'N/A'}`,
      })),
    );
    const dList = drvRes?.data || [];
    setDrivers(
      dList.map((d) => ({
        id: d._id,
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        licenseNo: d.licenseNo || 'N/A',
      })),
    );
  }, [depsResponse, setVehicles, setDrivers]);
  useEffect(() => {
    if (depsError) toast.error('Failed to load drivers and vehicles');
  }, [depsError]);
  return depsLoading;
};

export default useVehicleDriverOptions;
