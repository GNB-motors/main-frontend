import { useApi } from '../../hooks/useApi';
import TripPlanService from '../../services/TripPlanService';
import { driverOptions, placeOptions, vehicleOptions } from './tripForms';

/** Trucks, drivers and confirmed places for the trip dialogs, loaded while one is open. */
export default function useTripPickLists(enabled) {
  const { data, loading } = useApi((signal) => TripPlanService.pickLists({ signal }), [], {
    enabled,
  });
  return {
    loading,
    vehicles: vehicleOptions(data?.vehicles),
    drivers: driverOptions(data?.employees),
    places: placeOptions(data?.sites),
  };
}
