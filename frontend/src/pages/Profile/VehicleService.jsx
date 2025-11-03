import axios from 'axios';

// Get the backend URL from environment variables or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getAllVehicles = async (businessRefId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/vehicles/${businessRefId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the auth token in the header
        },
      }
    );
    // Return the array of vehicles
    return response.data;
  } catch (error) {
    // Rethrow the error so the component can handle it
    throw error.response?.data || { detail: error.message || 'Could not fetch vehicles.' };
  }
};

// Placeholder for Add Vehicle API call
const addVehicle = async (businessRefId, vehicleData, token) => {
  try {
    const response = await axios.post(
        `${API_BASE_URL}/api/v1/vehicles/${businessRefId}`,
        vehicleData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data;
  } catch (error) {
      throw error.response?.data || { detail: error.message || 'Could not add vehicle.' };
  }
};

// Placeholder for Remove Vehicle API call (adjust endpoint if needed based on API design)
const removeVehicle = async (businessRefId, registrationNo, token) => {
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/api/v1/vehicles/${businessRefId}/vehicle/${registrationNo}`, // Assuming deletion by reg_no
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data; // Or handle 204 No Content
    } catch (error) {
        throw error.response?.data || { detail: error.message || 'Could not remove vehicle.' };
    }
};

// Placeholder for Edit Vehicle API call
const updateVehicle = async (businessRefId, registrationNo, vehicleData, token) => {
     try {
         const response = await axios.put(
             `${API_BASE_URL}/api/v1/vehicles/${businessRefId}/vehicle/${registrationNo}`, // Assuming update by reg_no
             vehicleData,
             {
                 headers: {
                     Authorization: `Bearer ${token}`,
                     'Content-Type': 'application/json',
                 },
             }
         );
         return response.data;
     } catch (error) {
         throw error.response?.data || { detail: error.message || 'Could not update vehicle.' };
     }
 };


export const VehicleService = {
  getAllVehicles,
  addVehicle,
  removeVehicle,
  updateVehicle,
};