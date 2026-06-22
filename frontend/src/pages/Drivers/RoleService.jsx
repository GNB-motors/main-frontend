import apiClient from '../../utils/axiosConfig';

/**
 * RoleService — talks to /api/roles (Roles & Permissions / Employee Management Service).
 * Mirrors the response-unwrapping + error-shape conventions used in DriverService.jsx
 * so callers can rely on a single error.detail / error.message pattern app-wide.
 */
export const RoleService = {
    /**
     * Fetch all roles for the logged-in owner/manager's org, plus the
     * permission-module registry (so the UI never hardcodes module names).
     * Seeds the 4 default roles (Owner, Manager, Field Agent, Driver) on the
     * backend automatically on first call — no separate "init" step needed.
     * Returns { roles: [...], modules: [{ key, label }, ...] }
     */
    getRoles: async () => {
        try {
            const response = await apiClient.get('/api/roles');
            if (response.data && response.data.status === 'success') {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('API Error fetching roles:', error.response?.data || error.message);
            throw error.response?.data || { detail: 'Network error or server unavailable.' };
        }
    },

    getRoleById: async (roleId) => {
        try {
            const response = await apiClient.get(`/api/roles/${roleId}`);
            if (response.data && response.data.status === 'success') {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('API Error fetching role:', error.response?.data || error.message);
            throw error.response?.data || { detail: 'Network error or server unavailable.' };
        }
    },

    /**
     * Create a custom role. Only `name` and `permissions` are sent — the
     * backend decides the internal base access level on its own, the Owner
     * never has to think about it.
     * permissions shape: { [moduleKey]: { view: bool, manage: bool } }
     */
    createRole: async (name, baseRole, permissions) => {
        try {
            const response = await apiClient.post('/api/roles', { name, baseRole, permissions });
            if (response.data && response.data.status === 'success') {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('API Error creating role:', error.response?.data || error.message);
            throw error.response?.data || { detail: 'Network error or server unavailable.' };
        }
    },

    /**
     * Update a role's name and/or permissions. Default roles reject a name
     * change (backend-enforced) but accept permission toggle updates.
     */
    updateRole: async (roleId, updates) => {
        try {
            const response = await apiClient.patch(`/api/roles/${roleId}`, updates);
            if (response.data && response.data.status === 'success') {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('API Error updating role:', error.response?.data || error.message);
            throw error.response?.data || { detail: 'Network error or server unavailable.' };
        }
    },

    deleteRole: async (roleId) => {
        try {
            const response = await apiClient.delete(`/api/roles/${roleId}`);
            return response.data;
        } catch (error) {
            console.error('API Error deleting role:', error.response?.data || error.message);
            throw error.response?.data || { detail: 'Network error or server unavailable.' };
        }
    },
};

export default RoleService;
