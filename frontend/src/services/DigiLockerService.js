import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/**
 * DigiLockerService — read-only access to the backend's DigiLocker
 * verification state.
 *
 * The backend owns the whole consent flow (start -> DigiLocker -> callback).
 * The admin console never initiates verification — a *driver* does that in the
 * DriverApp. This service only reads what came back, so an operator can see
 * which drivers have genuinely consented with the issuer.
 *
 * All endpoints are behind `DIGILOCKER_ENABLED` (default false). When the
 * integration is off the backend answers 503; we surface that as
 * `{ enabled: false }` rather than an error so the badge stays hidden instead
 * of showing a permanent "Not verified".
 */
const getStatus = async (userId, signal) => {
  try {
    const response = await apiClient.get('/api/digilocker/status', { signal });
    return response.data?.data ?? null;
  } catch (error) {
    if (error?.code === 'ERR_CANCELED') throw error;
    if (error?.response?.status === 503) {
      // Integration switched off for this deployment — not an outage.
      return { enabled: false, verified: { DL: false, RC: false } };
    }
    throw ApiError.from(error);
  }
};

export const DigiLockerService = {
  /**
   * Verification status for one driver.
   *
   * NOTE: `/api/digilocker/status` is org-scoped and returns the *calling*
   * user's own row. Reading another driver's status requires the backend to add
   * an admin-scoped variant; until that ships, pass the driver id only for
   * display grouping and treat a mismatched id as unverified.
   */
  getStatus,
};
