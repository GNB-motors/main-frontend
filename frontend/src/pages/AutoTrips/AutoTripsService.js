import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

/** Employees for the approval pickers: the list, whichever envelope the API sends it in. */
const listEmployees = async (params, { signal } = {}) => {
  try {
    const res = await apiClient.get('/api/employees', { params, signal });
    return Array.isArray(res.data?.data) ? res.data.data : res.data || [];
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const AutoTripsService = { listEmployees };
