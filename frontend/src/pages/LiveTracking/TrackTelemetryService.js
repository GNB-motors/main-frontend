import FleetDataService from '../../services/FleetDataService.js';
import { parseSafe } from '../../schemas/validate.js';

const TrackTelemetryService = {
  async getLatest(registrationNumber, signal) {
    // Only the latest reading is displayed; avoid loading a chart's worth of history.
    const data = await FleetDataService.getVehicleHealth(
      registrationNumber,
      { days: 1, limit: 1 },
      signal,
    );
    return parseSafe(
      'trackTelemetrySchema',
      () => import('../../schemas/trackTelemetry.schema.js'),
      data.latest ?? null,
    );
  },
};

export default TrackTelemetryService;
