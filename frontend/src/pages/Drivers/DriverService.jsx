import apiClient from '../../utils/axiosConfig';

export const DriverService = {
    // --- Get Available Vehicles ---
    getAvailableVehicles: async (businessRefId, token) => {
        try {
            // New vehicles endpoint: GET /api/vehicles?orgId=<businessRefId>
            // Only include orgId param when provided to avoid serializing null/undefined
            const params = {};
            if (businessRefId) params.orgId = businessRefId;
            const response = await apiClient.get(`/api/vehicles`, { params });
            // Normalize to the expected response shape if necessary in the caller
            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error("API Error fetching vehicles:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Get Employees (drivers/managers) ---
    getAllDrivers: async (businessRefId, params = {}) => {
        try {
            // Build query params: page, limit, search, role, status
            const query = { ...params };
            // Only include orgId when provided
            if (businessRefId) query.orgId = businessRefId;
            const response = await apiClient.get(`/api/employees`, { params: query });
            // Prefer new response shape
            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error("API Error fetching drivers:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Add Driver (single employee) ---
    addDriver: async (businessRefId, driverData) => {
        try {
            // Map name -> firstName/lastName if provided as single name
            let firstName = '';
            let lastName = '';
            if (driverData.name) {
                const parts = driverData.name.trim().split(/\s+/);
                firstName = parts.shift() || '';
                lastName = parts.join(' ') || '';
            }

            const body = {
                firstName: driverData.firstName || firstName || null,
                lastName: driverData.lastName || lastName || null,
                email: driverData.email || null,
                mobileNumber: driverData.mobileNumber || null,
                location: driverData.location || null,
                password: driverData.password || null,
                role: driverData.role || driverData.role || 'DRIVER',
                orgId: businessRefId || undefined,
            };
            // include vehicle assignment if provided
            if (driverData.vehicle_registration_no) {
                body.vehicle_registration_no = driverData.vehicle_registration_no;
            }

            const response = await apiClient.post(`/api/employees`, body);
            if (response.data && response.data.status === 'success' && response.data.data) return response.data.data;
            return response.data;
        } catch (error) {
            console.error("API Error adding driver:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Bulk create drivers/employees ---
    addBulkDrivers: async (employeesArray) => {
        try {
            // employeesArray should already be normalized with clientRowId, firstName, lastName, etc.
            // Backend contract: only send { employees: [...] } - no orgId, dry_run, upsert
            const payload = {
                employees: employeesArray,
            };

            const response = await apiClient.post(`/api/employees/bulk`, payload, { headers: { 'Content-Type': 'application/json' } });
            if (response.data && response.data.status === 'success' && response.data.data) return response.data.data;
            return response.data;
        } catch (error) {
            console.error("API Error bulk adding drivers:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Update Driver (patch by id) ---
    updateDriver: async (businessRefId, driverId, driverData) => {
        try {
            const body = {};
            if (driverData.firstName !== undefined) body.firstName = driverData.firstName;
            if (driverData.lastName !== undefined) body.lastName = driverData.lastName;
            if (driverData.email !== undefined) body.email = driverData.email;
            if (driverData.mobileNumber !== undefined) body.mobileNumber = driverData.mobileNumber;
            if (driverData.location !== undefined) body.location = driverData.location;
            if (driverData.password !== undefined) body.password = driverData.password;
            if (driverData.role !== undefined) body.role = driverData.role;
            if (driverData.status !== undefined) body.status = driverData.status;
            if (driverData.vehicle_registration_no !== undefined) body.vehicle_registration_no = driverData.vehicle_registration_no;
            // include orgId if present
            if (businessRefId) body.orgId = businessRefId;

            const response = await apiClient.patch(`/api/employees/${driverId}`, body);
            if (response.data && response.data.status === 'success' && response.data.data) return response.data.data;
            return response.data;
        } catch (error) {
            console.error("API Error updating driver:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Delete Driver ---
    deleteDriver: async (businessRefId, driverId) => {
        try {
            const response = await apiClient.delete(`/api/employees/${driverId}`, { params: { orgId: businessRefId } });
            return response.status === 204 || (response.data && response.data.status === 'success');
        } catch (error) {
            console.error("API Error deleting driver:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },
};