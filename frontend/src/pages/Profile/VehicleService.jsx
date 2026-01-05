import axios from 'axios';

// Get the backend URL from environment variables or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getAllVehicles = async (businessRefId, token) => {
  try {
    // New API: GET /vehicles with optional orgId query param
    const url = `${API_BASE_URL}/api/vehicles${businessRefId ? `?orgId=${businessRefId}` : ''}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Normalize for older and newer response shapes
    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Could not fetch vehicles.' };
  }
};

// Placeholder for Add Vehicle API call
const addVehicle = async (businessRefId, vehicleData, token) => {
  try {
    // Map UI keys (snake_case) to API expected camelCase keys
    const body = {
      registrationNumber: vehicleData.registration_no || vehicleData.registrationNumber,
      chassisNumber: vehicleData.chassis_number || vehicleData.chassisNumber || null,
      model: vehicleData.model || null,
      // Ensure inventory is always an array (backend validation requires an array)
      inventory: vehicleData.inventory || [],
      // include orgId in body for servers that expect org context in payload
      orgId: businessRefId || undefined,
      // Include manufacturer and vehicleCategory if provided (for manual override)
      manufacturer: vehicleData.manufacturer || undefined,
      vehicleCategory: vehicleData.vehicleCategory || undefined,
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/vehicles`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Prefer new response shape
    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Could not add vehicle.' };
  }
};

// Bulk create vehicles
const addBulkVehicles = async (businessRefId, vehiclesArray, options = {}, token) => {
  try {
    // Map each row to API expected shape
    const vehicles = vehiclesArray.map((r) => ({
      registrationNumber: r.registration_no || r.registrationNumber,
      chassisNumber: r.chassis_number || r.chassisNumber || null,
      model: r.model || null,
      // default inventory to empty array when missing/null
      inventory: r.inventory || [],
      // Include manufacturer and vehicleCategory if provided
      manufacturer: r.manufacturer || undefined,
      vehicleCategory: r.vehicleCategory || undefined,
    }));

    const payload = {
      vehicles,
      // pass along options like dry_run/upsert if backend supports
      ...(options.dry_run !== undefined ? { dry_run: !!options.dry_run } : {}),
      ...(options.upsert !== undefined ? { upsert: !!options.upsert } : {}),
      orgId: businessRefId || undefined,
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/vehicles/bulk`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Could not bulk add vehicles.' };
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
const updateVehicle = async (businessRefId, vehicleId, vehicleData, token) => {
   try {
     // Build body mapping only provided fields to API expected camelCase
     const body = {};
     if (vehicleData.registration_no !== undefined) body.registrationNumber = vehicleData.registration_no;
     if (vehicleData.registrationNumber !== undefined) body.registrationNumber = vehicleData.registrationNumber;
     if (vehicleData.vehicle_type !== undefined) body.vehicleType = vehicleData.vehicle_type;
     if (vehicleData.vehicleType !== undefined) body.vehicleType = vehicleData.vehicleType;
     if (vehicleData.chassis_number !== undefined) body.chassisNumber = vehicleData.chassis_number;
     if (vehicleData.chassisNumber !== undefined) body.chassisNumber = vehicleData.chassisNumber;
     if (vehicleData.model !== undefined) body.model = vehicleData.model;
     if (vehicleData.status !== undefined) body.status = vehicleData.status;
     if (vehicleData.inventory !== undefined) body.inventory = vehicleData.inventory;
     // Include manufacturer and vehicleCategory for manual override
     if (vehicleData.manufacturer !== undefined) body.manufacturer = vehicleData.manufacturer;
     if (vehicleData.vehicleCategory !== undefined) body.vehicleCategory = vehicleData.vehicleCategory;
     // Include orgId when provided by caller (some servers expect it)
     if (businessRefId) body.orgId = businessRefId;

     const response = await axios.patch(
       `${API_BASE_URL}/api/vehicles/${vehicleId}`,
       body,
       {
         headers: {
           Authorization: `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
       }
     );

     // Prefer new response shape
     if (response.data && response.data.status === 'success' && response.data.data) {
       return response.data.data;
     }

     return response.data;
   } catch (error) {
     throw error.response?.data || { detail: error.message || 'Could not update vehicle.' };
   }
 };

/**
 * Get correction logs for a specific vehicle
 */
const getVehicleCorrectionLogs = async (vehicleId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/vehicles/${vehicleId}/corrections`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Could not fetch correction logs.' };
  }
};

/**
 * Classify existing unclassified vehicles
 */
const classifyExistingVehicles = async (token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/vehicles/classify-existing`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Could not classify vehicles.' };
  }
};


export const VehicleService = {
  getAllVehicles,
  addVehicle,
  addBulkVehicles,
  removeVehicle,
  updateVehicle,
  getVehicleCorrectionLogs,
  classifyExistingVehicles,
};