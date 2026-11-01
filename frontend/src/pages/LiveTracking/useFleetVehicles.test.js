import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import useFleetVehicles from './useFleetVehicles.js';

describe('Track telemetry mapping', () => {
  it('uses the live odometer before the older fleet-master value, including zero', () => {
    const { result, rerender } = renderHook(
      ({ odometer }) =>
        useFleetVehicles({
          rawPositions: [
            { registrationNumber: 'BR44GB1162', latitude: 25, longitude: 84, odometer },
          ],
          vehiclesMeta: { BR44GB1162: { odometer: 1000 } },
          filter: 'all',
          searchQuery: '',
          selectedId: 'live-BR44GB1162',
        }),
      { initialProps: { odometer: 123456 } },
    );
    expect(result.current.selectedVehicle.odo).toBe(123456);
    rerender({ odometer: 0 });
    expect(result.current.selectedVehicle.odo).toBe(0);
    rerender({ odometer: null });
    expect(result.current.selectedVehicle.odo).toBe(1000);
  });
});
