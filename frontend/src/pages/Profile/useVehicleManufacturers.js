import { useEffect, useState } from 'react';
import { VehicleService } from './VehicleService.js';
import { PRIMARY_MANUFACTURERS } from './vehicleManufacturerOptions.js';
export default function useVehicleManufacturers() {
  const [manufacturers, setManufacturers] = useState(PRIMARY_MANUFACTURERS);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    VehicleService.getManufacturerOptions({ signal: controller.signal })
      .then((options) => {
        if (!controller.signal.aborted) {
          setManufacturers(options);
          setError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [attempt]);
  return {
    manufacturers,
    metadataError: error,
    retryMetadata: () => setAttempt((value) => value + 1),
  };
}
