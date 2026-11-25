import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { parseSafe } from '../../schemas/validate.js';

const dataOf = (res) => res.data?.data ?? {};

const call = async (request) => {
  try {
    return dataOf(await request);
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** Org fuel settings: { idleThresholdMin, idleThresholdSource, … }. */
const getFuelSettings = ({ signal } = {}) => call(apiClient.get('/api/fuel-settings', { signal }));

const updateIdleThreshold = (idleThresholdMin) =>
  call(apiClient.patch('/api/fuel-settings', { idleThresholdMin }));

const updateNetFuelKmPerL = (netFuelKmPerL) =>
  call(apiClient.patch('/api/fuel-settings', { netFuelKmPerL }));

/** Scheduled report e-mails: { daily, weekly, recipients, serverEnabled, … }. */
const emailSettings = (data) =>
  parseSafe(
    'emailReportSettingsSchema',
    () => import('../../schemas/reportEmail.schema.js'),
    data,
  );

const getEmailReportSettings = async ({ signal } = {}) =>
  emailSettings(await call(apiClient.get('/api/email-report-settings', { signal })));

const updateEmailReportSettings = async (patch) =>
  emailSettings(await call(apiClient.patch('/api/email-report-settings', patch)));

export const SettingsService = {
  getFuelSettings,
  updateIdleThreshold,
  updateNetFuelKmPerL,
  getEmailReportSettings,
  updateEmailReportSettings,
};
