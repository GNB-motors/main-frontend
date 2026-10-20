import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';

/** Public, no auth: lands in the super-admin Enquiries inbox. */
export async function sendEnquiry(payload) {
  try {
    return (await apiClient.post('/api/public/enquiries', payload)).data?.data;
  } catch (error) {
    throw ApiError.from(error, 'Could not send your enquiry');
  }
}
