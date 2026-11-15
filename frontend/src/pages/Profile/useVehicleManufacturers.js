import { useEffect, useState } from 'react';
import { VehicleService } from './VehicleService.js';
export default function useVehicleManufacturers() {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    VehicleService.getManufacturerOptions({ signal: controller.signal })
      .then((options) => {
        if (!controller.signal.aborted) {
          setManufacturers(options);
          setError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  return {
    manufacturers,
    metadataError: error,
    metadataLoading: loading,
    retryMetadata: () => setAttempt((value) => value + 1),
  };
}
