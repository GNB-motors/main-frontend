import apiClient from '../../utils/axiosConfig';
import { statusRows } from './ialertAccountsModel.js';

/** GET api/extension/ialert/status → the signed-in user's iALERT links (array). */
export async function fetchIalertStatus(signal) {
  const res = await apiClient.get('api/extension/ialert/status', { signal });
  return statusRows(res.data);
}
