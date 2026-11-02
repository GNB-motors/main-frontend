import { VehicleService } from './VehicleService.js';
import { normalizeVehicle } from './vehicleList.js';

// Only exports read successive pages. The table always requests exactly one server page.
async function getMatching({ businessRefId, manufacturer, search, signal, view = 'ALL' }) {
  const limit = 1000;
  const options = { manufacturer, search, signal, view };
  const first = await VehicleService.getAllVehicles(businessRefId, 1, limit, options);
  const all = [...(first.data || [])];
  for (let page = 2; page <= (first.meta?.totalPages || 1); page += 1) {
    const next = await VehicleService.getAllVehicles(businessRefId, page, limit, options);
    all.push(...(next.data || []));
  }
  return all.map(normalizeVehicle);
}

const VehicleListService = {
  getMatching,
  async getPage({ page = 1, limit = 10, view = 'ALL', ...options }) {
    const result = await VehicleService.getAllVehicles(options.businessRefId, page, limit, {
      manufacturer: options.manufacturer,
      search: options.search,
      signal: options.signal,
      view,
    });
    return { ...result, data: (result.data || []).map(normalizeVehicle) };
  },
};

export default VehicleListService;
