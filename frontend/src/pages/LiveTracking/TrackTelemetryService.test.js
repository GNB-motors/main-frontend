import { afterEach, describe, expect, it, vi } from 'vitest';
import FleetDataService from '../../services/FleetDataService.js';
import TrackTelemetryService from './TrackTelemetryService.js';

vi.mock('../../services/FleetDataService.js', () => ({ default: { getVehicleHealth: vi.fn() } }));
afterEach(() => vi.resetAllMocks());

describe('Track telemetry reads', () => {
  it('requests only a small history window and preserves the sensor units', async () => {
    FleetDataService.getVehicleHealth.mockResolvedValue({
      latest: { defLevel: 80, defLevelUnit: 'percent', canOdo: 123456 },
    });
    const signal = new AbortController().signal;
    await expect(TrackTelemetryService.getLatest('BR44GB1162', signal)).resolves.toMatchObject({
      defLevel: 80,
      defLevelUnit: 'percent',
    });
    expect(FleetDataService.getVehicleHealth).toHaveBeenCalledWith(
      'BR44GB1162',
      { days: 1, limit: 1 },
      signal,
    );
  });
});
