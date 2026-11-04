import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import useFleetVehicles from './useFleetVehicles.js';

describe('Track telemetry mapping', () => {
  it('uses the live odometer including zero, and never a master value that the list does not carry', () => {
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
    expect(result.current.selectedVehicle.odo).toBe(null);
  });

  it('reads master fields and the driver from the row, and decides offline by fix age', () => {
    const recent = new Date(Date.now() - 5 * 60000).toISOString();
    const { result } = renderHook(() =>
      useFleetVehicles({
        rawPositions: [
          {
            registrationNumber: 'WB11F4762',
            latitude: 22.5,
            longitude: 88.3,
            speed: 35,
            ignition: true,
            eventDateTime: recent,
            vehicle: {
              vehicleId: 'v1',
              model: 'Signa',
              manufacturer: 'Tata',
              chassisNumber: 'MAT1',
              manufactureYear: 2021,
            },
            driver: { state: 'ASSIGNED', name: 'Ravi Kumar' },
            fuel: { value: 245, unit: null },
          },
          {
            registrationNumber: 'WB11F6262',
            latitude: 22.5,
            longitude: 88.3,
            speed: 60,
            state: 'ACTIVE',
            eventDateTime: new Date(Date.now() - 5 * 3600000).toISOString(),
          },
        ],
        vehiclesMeta: {},
        filter: 'all',
        searchQuery: '',
        selectedId: null,
      }),
    );
    const [a, b] = result.current.vehicles;
    expect(a).toMatchObject({
      status: 'moving',
      model: 'Signa',
      manufactureYear: 2021,
      vin: 'MAT1',
      hasGpsFix: true,
    });
    expect(a.driver.name).toBe('Ravi Kumar');
    expect(a.fuelReading).toEqual({ value: 245, unit: null });
    expect(b).toMatchObject({ status: 'offline', speed: null, hasGpsFix: false, hasFix: true });
    expect(result.current.manufacturers).toEqual(['Tata']);
  });
});

it('preserves structured provider readings on the selected row', () => {
  const readings = { def: { pct: { value: 42 } }, odometerKm: { value: 9799 } };
  const { result } = renderHook(() => useFleetVehicles({ rawPositions: [{ registrationNumber: 'WB11S1962', readings }], vehiclesMeta: {}, filter: 'all', searchQuery: '', selectedId: 'live-WB11S1962' }));
  expect(result.current.selectedVehicle.readings).toEqual(readings);
});
