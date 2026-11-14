import { describe, it, expect } from 'vitest';
import { buildDigestExportRows } from './digestExportRows';
describe('Digest loss export coverage', () => {
  it('exports known amounts with the incomplete notice and keeps unknown amounts empty', () => {
    const rows = buildDigestExportRows({
      actions: [],
      money: {},
      upcoming: [],
      morningBrief: {
        sections: [
          {
            label: 'Idle',
            partial: true,
            coverageNote: 'Some losses are not included.',
            vehicles: [
              { registrationNumber: 'A', rupees: 89900, durationMin: 60 },
              { registrationNumber: 'B', rupees: null, durationMin: 60 },
            ],
          },
        ],
      },
    });
    expect(rows[0].amount).toBe(89900);
    expect(rows[0].detail).toContain('Incomplete: Some losses are not included.');
    expect(rows[1].amount).toBeNull();
  });
});
