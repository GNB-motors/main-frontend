import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

// The signed-out pages: a 400/401/429 here is the form's own answer, never a
// lost session (the same option the login call uses).
const PUBLIC = { skipAuthRedirect: true };

/** Ask for a reset link for an email address. */
const requestReset = async (email) => {
  try {
    const res = await apiClient.post('/api/auth/password-reset/request', { email }, PUBLIC);
    return res.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/**
 * Is the link still good, and whose is it?
 *
 * The token travels in the BODY, never in the URL: a URL ends up in browser
 * history, proxy logs and referrer headers, a body does not.
 */
const verifyReset = async (token, { signal } = {}) => {
  try {
    const res = await apiClient.post(
      '/api/auth/password-reset/verify',
      { token },
      { ...PUBLIC, signal },
    );
    return res.data?.data ?? { valid: false };
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** Finish the reset with the new password. */
const completeReset = async (token, password) => {
  try {
    const res = await apiClient.post(
      '/api/auth/password-reset/complete',
      { token, password },
      PUBLIC,
    );
    return res.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const PasswordResetService = { requestReset, verifyReset, completeReset };
export default PasswordResetService;
