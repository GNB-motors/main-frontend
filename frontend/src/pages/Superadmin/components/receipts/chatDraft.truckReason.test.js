import { describe, it, expect } from 'vitest';
import { truckReasonOf } from './chatDraft';

const detail = 'The message names WB11E5762, which is not in your fleet.';

describe('truckReasonOf', () => {
  it('reads the truck reason from the list of checks the server sends', () => {
    const row = {
      truck: { source: 'market' },
      checks: [
        { name: 'PUMP_MATH', result: 'pass', detail: 'The bill adds up.' },
        { name: 'TRUCK_ONE', result: 'fail', detail },
      ],
    };
    expect(truckReasonOf(row)).toBe(detail);
  });

  it('still reads the keyed shape', () => {
    expect(truckReasonOf({ checks: { TRUCK_ONE: { detail } } })).toBe(detail);
  });

  it('falls back to the truck source, never to a chat source', () => {
    expect(truckReasonOf({ truck: { source: 'market' }, checks: [] })).toBe('market');
    expect(truckReasonOf({ truck: { source: 'CHAT' } })).toBe('');
    expect(truckReasonOf(null)).toBe('');
  });
});
