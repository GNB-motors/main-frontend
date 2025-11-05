import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getOverview = async (businessRefId, { startDate, endDate } = {}, token) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const qs = params.toString();

    const url = `${API_BASE_URL}/api/v1/overview/${businessRefId}${qs ? `?${qs}` : ''}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Could not fetch overview data.' };
  }
};

export const OverviewService = {
  getOverview,
};
