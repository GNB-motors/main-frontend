import apiClient from '../../utils/axiosConfig';

/** Normalise a mobile number to E.164 (+91XXXXXXXXXX for Indian numbers). */
function normaliseMobile(mobile) {
    if (!mobile) return mobile;
    const stripped = mobile.replace(/\s/g, '');
    if (stripped.startsWith('+')) return stripped;
    const digits = stripped.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return stripped;
}

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
                return { data: response.data.data, meta: response.data.meta };
            }
            return { data: response.data, meta: null };
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
                mobileNumber: normaliseMobile(driverData.mobileNumber) || null,
                password: driverData.password || null,
                orgId: businessRefId || undefined,
            };
            // Location is optional free-text (enterprise scope only). Omit it when
            // empty — the create validator accepts a string or nothing, not null.
            if (driverData.location) body.location = driverData.location;
            // Legacy enum role (optional) + the RBAC dual-role selection. Only
            // send what's present so the backend can derive the enum role.
            if (driverData.role) body.role = driverData.role;
            if (driverData.enterpriseRoleId) body.enterpriseRoleId = driverData.enterpriseRoleId;
            if (driverData.branchRoleId) body.branchRoleId = driverData.branchRoleId;
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

            // Increase timeout for bulk operations (up to 500 employees can take time)
            // Estimate: ~100ms per employee = 50 seconds for 500, add buffer = 2 minutes
            const timeout = Math.max(120000, employeesArray.length * 200); // At least 2 minutes, or 200ms per employee

            const response = await apiClient.post(`/api/employees/bulk`, payload, { 
                headers: { 'Content-Type': 'application/json' },
                timeout: timeout
            });
            if (response.data && response.data.status === 'success' && response.data.data) return response.data.data;
            return response.data;
        } catch (error) {
            console.error("API Error bulk adding drivers:", error.response?.data || error.message);
            
            // Handle timeout specifically
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                throw { detail: "Request timed out. The upload may still be processing. Please check the employees list." };
            }
            
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
            if (driverData.mobileNumber !== undefined) body.mobileNumber = normaliseMobile(driverData.mobileNumber);
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

    // --- Import an existing enterprise employee into the active branch ---
    // The active branch travels via the X-Branch-Id header (apiClient interceptor).
    importEmployee: async (employeeId) => {
        try {
            const response = await apiClient.post(`/api/employees/${employeeId}/import`);
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error("API Error importing employee:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable." };
        }
    },

    // --- Deactivate an employee in their current branch (no move) ---
    // Suspends the account and greys them out in this branch's list.
    deactivateEmployee: async (employeeId) => {
        try {
            const response = await apiClient.post(`/api/employees/${employeeId}/deactivate`);
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error("API Error deactivating employee:", error.response?.data || error.message);
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

    // --- Upload Employee Document ---
    uploadDocument: async (entityId, docType, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('entityType', 'USER');
            formData.append('entityId', entityId);
            formData.append('docType', docType);

            const response = await apiClient.post(`/api/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error("API Error uploading document:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Failed to upload document." };
        }
    },

    // --- Get Employee Documents ---
    getEmployeeDocuments: async (employeeId) => {
        try {
            const response = await apiClient.get(`/api/documents?entityType=USER&entityId=${employeeId}`);
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error("API Error fetching documents:", error.response?.data || error.message);
            return [];
        }
    },

    // --- Delete Document (hard delete from DB + S3) ---
    deleteDocument: async (documentId) => {
        try {
            const response = await apiClient.delete(`/api/documents/${documentId}`);
            return response.data;
        } catch (error) {
            console.error("API Error deleting document:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Failed to delete document." };
        }
    },

    // --- Update Document metadata ---
    updateDocument: async (documentId, updateData) => {
        try {
            const response = await apiClient.patch(`/api/documents/${documentId}`, updateData);
            return response.data?.data || response.data;
        } catch (error) {
            console.error("API Error updating document:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Failed to update document." };
        }
    },
};