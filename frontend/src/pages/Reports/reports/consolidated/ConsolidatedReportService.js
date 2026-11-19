import apiClient from '../../../../utils/axiosConfig';

const read = async (endpoint, params, signal) => {
  const response = await apiClient.get(`/api/reports/consolidated/${endpoint}`, { params, signal });
  return response.data.data;
};

const fuelRead = (endpoint, params, signal) => {
  const query = { ...params };
  delete query.groupBy;
  return read(endpoint, query, signal);
};

export const ConsolidatedReportService = {
  dailyFuel: (params, signal) => fuelRead('fuel-mileage/daily', params, signal),
  fullTankCycles: (params, signal) => fuelRead('fuel-mileage/full-tank', params, signal),
  slipIntervals: (params, signal) => fuelRead('fuel-mileage/slip-to-slip', params, signal),
  fuelMileage: (params, signal) => read('fuel-mileage', params, signal),
  fuelDetails: (params, signal) => read('fuel-mileage/details', params, signal),
  tripsRunningCost: (params, signal) => read('trips-running-cost', params, signal),
};
