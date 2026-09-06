import { describe, it, expect } from 'vitest';
import { serializeTripDraft, parseTripDraft, TRIP_DRAFT_PREF_KEY } from './tripDraft';

describe('serializeTripDraft', () => {
  it('returns null when there is nothing to persist', () => {
    expect(serializeTripDraft({})).toBeNull();
    expect(serializeTripDraft()).toBeNull();
    expect(
      serializeTripDraft({ selectedVehicle: null, selectedDriver: null, journeyData: null }),
    ).toBeNull();
  });

  it('persists only the restorable slice and stamps version + savedAt', () => {
    const raw = serializeTripDraft({
      selectedVehicle: { id: 'v1', name: 'WB 12A 3456' },
      selectedDriver: { id: 'd1', name: 'Ram Singh' },
      journeyData: { mileageData: { startOdometer: 12000 } },
    });
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(1);
    expect(typeof parsed.savedAt).toBe('string');
    expect(parsed.selectedVehicle.id).toBe('v1');
    expect(parsed.selectedDriver.name).toBe('Ram Singh');
    expect(parsed.journeyData.mileageData.startOdometer).toBe(12000);
  });

  it('round-trips through parseTripDraft', () => {
    const vehicle = { id: 'v1', name: 'WB 12A 3456' };
    const driver = { id: 'd1', name: 'Ram Singh' };
    const journey = { fuelData: { litres: 120, rate: 95.5 } };
    const draft = parseTripDraft(
      serializeTripDraft({
        selectedVehicle: vehicle,
        selectedDriver: driver,
        journeyData: journey,
      }),
    );
    expect(draft.selectedVehicle).toEqual(vehicle);
    expect(draft.selectedDriver).toEqual(driver);
    expect(draft.journeyData).toEqual(journey);
  });
});

describe('parseTripDraft', () => {
  it('returns null for empty / non-string input', () => {
    expect(parseTripDraft(null)).toBeNull();
    expect(parseTripDraft(undefined)).toBeNull();
    expect(parseTripDraft('')).toBeNull();
    expect(parseTripDraft(42)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseTripDraft('{not json')).toBeNull();
  });

  it('returns null for non-object payloads', () => {
    expect(parseTripDraft('"a string"')).toBeNull();
    expect(parseTripDraft('[1,2,3]')).toBeNull();
    expect(parseTripDraft('42')).toBeNull();
  });

  it('returns null for a different draft version', () => {
    expect(
      parseTripDraft(JSON.stringify({ version: 2, selectedVehicle: { id: 'v1' } })),
    ).toBeNull();
    expect(parseTripDraft(JSON.stringify({ selectedVehicle: { id: 'v1' } }))).toBeNull();
  });

  it('rejects non-object fields instead of passing them through', () => {
    const draft = parseTripDraft(
      JSON.stringify({
        version: 1,
        savedAt: '2026-09-06T06:00:00.000Z',
        selectedVehicle: 'WB 12A 3456',
        selectedDriver: ['x'],
        journeyData: { fuelData: { litres: 10 } },
      }),
    );
    expect(draft).not.toBeNull();
    expect(draft.selectedVehicle).toBeNull();
    expect(draft.selectedDriver).toBeNull();
    expect(draft.journeyData).toEqual({ fuelData: { litres: 10 } });
    expect(draft.savedAt).toBe('2026-09-06T06:00:00.000Z');
  });

  it('exposes a stable pref key', () => {
    expect(TRIP_DRAFT_PREF_KEY).toBe('gnb:trip-creation-draft');
  });
});
