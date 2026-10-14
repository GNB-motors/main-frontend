import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import logger from '../../utils/logger';

const loginUser = async (credentials) => {
  try {
    // A wrong-password 401 is the form's own answer, never a lost session.
    const response = await apiClient.post('/api/auth/login', credentials, {
      skipAuthRedirect: true,
    });

    // Handle new response structure: { status: "success", data: { user, token } }
    if (response.data.status === 'success' && response.data.data) {
      return {
        user: response.data.data.user,
        token: response.data.data.token,
        organization: response.data.data.organization,
      };
    }

    // Fallback for old API structure
    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/**
 * The org a field agent's requests are scoped to. Accounts from before
 * org-scoped field agents have no orgId of their own and take their first
 * membership; without one, every request fails with "X-Org-Id required".
 * `failed` tells "lookup failed" apart from "not linked to any org".
 */
const resolveFieldAgentOrgId = async (ownOrgId) => {
  try {
    const res = await apiClient.get('/api/me/orgs');
    const orgs = res.data?.data || [];
    return { orgId: orgs[0]?.orgId || ownOrgId || null, failed: false };
  } catch (error) {
    logger.warn('LoginPageService', 'Failed to fetch orgs for field agent', error);
    return { orgId: ownOrgId || null, failed: true };
  }
};

export const LoginPageService = {
  loginUser,
  resolveFieldAgentOrgId,
};
