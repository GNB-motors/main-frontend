import { OverviewService } from '../Overview/OverviewService.jsx';
import ErpDashboardService from '../ErpHome/ErpDashboardService';

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
      OverviewService.getDashboardSummary(params),
      OverviewService.getFuelAnalytics(params),
      OverviewService.getFinancials(params),
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
