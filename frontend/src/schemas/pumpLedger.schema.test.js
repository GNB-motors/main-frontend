import { describe, it, expect } from 'vitest';
import { parseWith } from './validate.js';

const parse = (data) => parseWith('pumpLedgerSchema', () => import('./pumpLedger.schema.js'), data);

describe('pumpLedger.schema.js', () => {
  it('accepts the ledger as the API sends it, nulls included', async () => {
    const data = {
      window: { from: '2026-07-11T18:30:00.000Z', to: '2026-10-09T18:29:59.999Z' },
      fuelPriceInrPerL: 95,
      pumps: [
        {
          pump: 'DANKUNI SUPER SER STN DELHI ROAD',
          fills: 11,
          flaggedFills: 4,
          claimedLitres: 3222,
          actualLitres: 2967.5,
          shortfallLitres: 254.5,
          shortfallPct: 7.9,
          estimatedLossInr: 24181,
          lat: null,
          lng: null,
          lastFillAt: '2026-10-01T06:00:00.000Z',
        },
      ],
      disclaimer: 'All ₹ figures are estimates.',
    };
    expect(await parse(data)).toEqual(data);
  });

  it('rejects a pump whose litres are not numbers', async () => {
    await expect(parse({ pumps: [{ pump: 'X', claimedLitres: 'lots' }] })).rejects.toThrow();
  });
});
