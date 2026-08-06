import apiClient from '../utils/axiosConfig';

export const FuelPriceService = {
  getMarqueePrices: async () => {
    try {
      const response = await apiClient.get('/fuel-prices/marquee');
      return response.data;
    } catch (error) {
      console.error('Error fetching marquee fuel prices:', error);
      throw error;
    }
  },

  getAllPrices: async () => {
    try {
      const response = await apiClient.get('/fuel-prices');
      return response.data;
    } catch (error) {
      console.error('Error fetching all fuel prices:', error);
      throw error;
    }
  }
};
