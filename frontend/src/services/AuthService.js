import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/**
 * The signed-in user's /api/auth/me payload: profile fields plus
 * `organization` (feature flags, branding) and the active branch's
 * `permissions`. Always resolves to an object — `{}` when the body is empty —
 * so callers can tell "loaded" from "not loaded yet".
 */
const getMe = async ({ signal } = {}) => {
  try {
    const res = await apiClient.get('/api/auth/me', { signal });
    return res.data?.data ?? res.data ?? {};
  } catch (error) {
    throw ApiError.from(error);
  }
};

const AuthService = { getMe };

export default AuthService;
