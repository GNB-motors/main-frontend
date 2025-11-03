import apiClient from '../../utils/axiosConfig';

export const DriverService = {
    // --- Get Available Vehicles ---
    getAvailableVehicles: async (businessRefId, token) => {
        try {
            const response = await apiClient.get(`/api/v1/vehicles/${businessRefId}`);
            return response.data; // Expecting a list of vehicles
        } catch (error) {
            console.error("API Error fetching vehicles:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },
    // --- Get All Drivers ---
    getAllDrivers: async (businessRefId, token) => {
        try {
            const response = await apiClient.get(`/api/v1/employees/${businessRefId}`);
            return response.data; // Expecting a list of drivers
        } catch (error) {
            console.error("API Error fetching drivers:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Add Driver ---
    addDriver: async (businessRefId, driverData, token) => {
        try {
            const response = await apiClient.post(
                `/api/v1/employees/${businessRefId}`,
                driverData
            );
            return response.data; // Expecting the newly created driver object
        } catch (error) {
            console.error("API Error adding driver:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Update Driver ---
    updateDriver: async (businessRefId, driverId, driverData, token) => {
        try {
            // Ensure vehicle_registration_no is null if the input is empty string, matching EmployeeUpdate schema
            const payload = { ...driverData };
            if (payload.vehicle_registration_no === '') {
                payload.vehicle_registration_no = null;
            }

            const response = await apiClient.put(
                `/api/v1/employees/${businessRefId}/${driverId}`,
                payload // Send only fields to update (name, role, vehicle_registration_no)
            );
            return response.data; // Expecting the updated driver object
        } catch (error) {
            console.error("API Error updating driver:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Delete Driver ---
    deleteDriver: async (businessRefId, driverId, token) => {
        try {
            const response = await apiClient.delete(
                `/api/v1/employees/${businessRefId}/${driverId}`
            );
            // DELETE usually returns 204 No Content on success
            return response.status === 204;
        } catch (error) {
            console.error("API Error deleting driver:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },
};