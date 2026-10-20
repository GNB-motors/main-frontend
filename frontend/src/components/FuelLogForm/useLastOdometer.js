import { useEffect } from 'react';
import useApi from '../../hooks/useApi';
import FuelLogService from '../../services/FuelLogService';
import logger from '../../utils/logger';

/** The selected vehicle's latest fuel log, kept in the form's lastOdometer state. */
const useLastOdometer = (selectedVehicle, setLastOdometer) => {
  const {
    data: odoResponse,
    loading: loadingLastOdometer,
    error: odoError,
  } = useApi(
    // Wrapped so a vehicle with no prior log still yields a truthy result and
    // clears the previous vehicle's reading below.
    (signal) =>
      FuelLogService.getLastOdometer(selectedVehicle.id, { signal }).then((last) => ({ last })),
    [JSON.stringify({ vehicleId: selectedVehicle?.id })],
    { enabled: !!selectedVehicle },
  );
  useEffect(() => {
    if (odoResponse) setLastOdometer(odoResponse.last);
  }, [odoResponse, setLastOdometer]);
  useEffect(() => {
    if (!selectedVehicle) setLastOdometer(null);
  }, [selectedVehicle, setLastOdometer]);
  useEffect(() => {
    if (odoError) logger.warn('FuelLogForm', 'Failed to fetch last odometer', odoError);
  }, [odoError]);
  return loadingLastOdometer;
};

export default useLastOdometer;
