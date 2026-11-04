import { describe, it, expect } from 'vitest';
import {
  centreRows,
  pickPrediction,
  pickTyreRow,
  predictionFacts,
  tyreFacts,
} from './serviceInsightsModel';

describe('serviceInsightsModel', () => {
  it('finds the tyre set for this vehicle by registration, punctuation and all', () => {
    const payload = {
      vehicles: [
        { vehicleId: 'veh-2', registrationNumber: 'WB02CD5678', band: 'OK' },
        { vehicleId: 'veh-1', registrationNumber: 'WB 01 AB 1234', band: 'DUE_SOON' },
      ],
    };

    const row = pickTyreRow(payload, { registrationNumber: 'WB01AB1234' });
    expect(row?.vehicleId).toBe('veh-1');
  });

  it('says why a tyre figure is unknown instead of showing a zero', () => {
    const facts = tyreFacts({
      band: 'OK',
      kmRun: 0,
      costPerKmInr: null,
      note: 'no km recorded yet',
      lifeUsedPct: null,
      remainingKm: null,
    });

    expect(facts.costPerKm).toBeNull();
    expect(facts.costPerKmReason).toBe('no km recorded yet');
    expect(facts.lifeUsed).toBeNull();
    expect(facts.lifeUsedReason).toBeTruthy();
  });

  it('keeps an uncosted centre out of the road column and gives the reason', () => {
    const [row] = centreRows([
      {
        id: 'c1',
        name: 'Highway Service Centre',
        cost: {
          roadKm: null,
          roadMinutes: null,
          roadBasis: 'ROAD_ENGINE_UNAVAILABLE',
          detourKm: null,
          detourBasis: 'NO_DESTINATION',
        },
        missingText: ['no road distance — our road engine could not route to it'],
        phone: null,
      },
    ]);

    expect(row.roadKm).toBeNull();
    expect(row.roadReason).toMatch(/road distance unavailable/i);
    expect(row.detourReason).toMatch(/do not know where the truck was headed/i);
    expect(row.reasons.join(' ')).toMatch(/no phone number on file/i);
  });

  it('picks the sweep row for this registration and explains a missing forecast', () => {
    const record = pickPrediction(
      [
        { registrationNumber: 'WB02CD5678', risk: 'OK' },
        { registrationNumber: 'WB01AB1234', risk: 'OVERDUE', daysUntilDue: -4, kmUntilDue: null },
      ],
      'WB01AB1234',
    );
    expect(record?.risk).toBe('OVERDUE');

    const facts = predictionFacts(record);
    expect(facts.days).toBe(-4);
    expect(facts.km).toBeNull();
    expect(facts.kmReason).toBe('no projected service date');

    expect(pickPrediction([], 'WB01AB1234')).toBeNull();
  });
});
