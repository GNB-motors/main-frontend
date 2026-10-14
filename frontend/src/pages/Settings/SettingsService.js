import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

const dataOf = (res) => res.data?.data ?? {};

const call = async (request) => {
  try {
    return dataOf(await request);
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** Org fuel settings: { idleThresholdMin, idleThresholdSource, … }. */
const getFuelSettings = ({ signal } = {}) => call(apiClient.get('api/fuel-settings', { signal }));

const updateIdleThreshold = (idleThresholdMin) =>
  call(apiClient.patch('api/fuel-settings', { idleThresholdMin }));

const updateWhatsAppOdometerMode = (odometerMode) =>
  call(apiClient.patch('/api/whatsapp/settings', { odometerMode }));

export const SettingsService = {
  getFuelSettings,
  updateIdleThreshold,
  updateWhatsAppOdometerMode,
};
