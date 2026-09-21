import apiClient from '../../utils/axiosConfig';
import ErpDashboardService from '../ErpHome/ErpDashboardService';

const getDashboardSummary = async (params = {}) => {
  const response = await apiClient.get('/api/dashboard/summary', { params });
  return response.data?.data || response.data || {};
};

const getFuelAnalytics = async (params = {}) => {
  const response = await apiClient.get('/api/dashboard/fuel-analytics', { params });
  return response.data?.data || response.data || {};
};

const getFinancials = async (params = {}) => {
  const response = await apiClient.get('/api/dashboard/financials', { params });
  return response.data?.data || response.data || {};
};

/**
 * Fans out to both module dashboards and returns whatever came back.
 *
 * allSettled, not all: the ERP summary endpoint is gated on the `erpMasters`
 * flag specifically, so an org holding only (say) erpBilling gets a 403 there.
 * That must degrade to "ERP panel unavailable" rather than blanking the whole
 * page — the fleet half is still perfectly good.
 */
const valueOf = (result) => (result.status === 'fulfilled' ? result.value : null);

export const CommandCenterService = {
  load: async (params = {}) => {
    const [erp, fleetSummary, fuel, financials] = await Promise.allSettled([
      ErpDashboardService.getSummary(),
      getDashboardSummary(params),
      getFuelAnalytics(params),
      getFinancials(params),
    ]);

    const erpPayload = valueOf(erp);

    return {
      erp: erpPayload?.data ?? erpPayload ?? null,
      erpFailed: erp.status === 'rejected',
      fleet: valueOf(fleetSummary)?.summaryCards ?? null,
      fleetFailed: fleetSummary.status === 'rejected',
      fuel: valueOf(fuel),
      financials: valueOf(financials),
    };
  },
};
