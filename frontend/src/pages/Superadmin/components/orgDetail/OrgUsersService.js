import apiClient from '../../../../utils/axiosConfig';
import ApiError from '../../../../errors/ApiError';

const PAGE_LIMIT = 50;

/**
 * The accounts of one organisation (SUPER_ADMIN).
 *
 * The list endpoint answers with { status, data: [...rows], meta: { page, limit,
 * total, pages } } — the rows ARE the data array, the meta is its sibling.
 * The password reset needs a reason for the audit trail, so the call carries
 * X-Audit-Reason.
 */
export const OrgUsersService = {
  listOrgUsers: async (orgId, params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get(`/api/admin/organizations/${orgId}/users`, {
        params: { page: 1, limit: PAGE_LIMIT, ...params },
        signal,
      });
      const body = response.data ?? {};
      const rows = Array.isArray(body.data) ? body.data : [];
      return {
        rows,
        meta: body.meta ?? { page: 1, limit: PAGE_LIMIT, total: 0, pages: 1 },
      };
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Reset one account's password.
   * @param {string} userId
   * @param {{mode:'set', password:string, signOut:boolean}|{mode:'email'}} body
   */
  resetUserPassword: async (userId, body) => {
    try {
      const response = await apiClient.post(`/api/admin/users/${userId}/password`, body, {
        headers: { 'X-Audit-Reason': 'password reset from org page' },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      throw ApiError.from(error);
    }
  },
};

export default OrgUsersService;
