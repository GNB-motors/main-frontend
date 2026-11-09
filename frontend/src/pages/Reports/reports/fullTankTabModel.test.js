import { describe, it, expect } from 'vitest';
import {
  ABOVE_PEERS_NOTE,
  FULL_TANK_WINDOW_DAYS,
  NOT_MEASURED,
  SUMMARY_FIELDS,
  basisText,
  countKmNotMeasured,
  filterTrucks,
  formatCount,
  formatDaysSince,
  formatFullDate,
  formatKmPerL,
  formatKmSince,
  formatLastFull,
  formatMedianGap,
  formatPartialFills,
  hasSummary,
  kmNotMeasuredNote,
  modelNote,
  modelRows,
  readFullTankResponse,
  summaryItems,
} from './fullTankTabModel';

/**
 * The house rule these tests guard: unknown is never 0, and an absent field
 * never prints "undefined". Every rule is checked three ways — the field is
 * null, the field is missing entirely (an older backend), and the field has
 * a real value.
 */

const TRUCK = {
  vehicleId: 'v1',
  registrationNumber: 'WB11A1234',
  model: 'LPT 4830',
  status: 'OPEN',
  lastFullAt: '2026-11-02T06:10:00.000Z',
  lastFullBasis: 'REGISTER_MAIN',
  lastFullOdo: 412345,
  fullCycles: 7,
  otherCycles: 1,
  partialsSinceFull: { count: 1, litres: 80 },
  daysSinceFull: 6.4,
  kmSinceFull: null,
  lastKmPerL: 3.1,
  medianKmPerL: 3.0,
};

describe('the report window and labels', () => {
  it('asks the backend for 90 days', () => {
    expect(FULL_TANK_WINDOW_DAYS).toBe(90);
  });

  it('names the five summary figures', () => {
    expect(SUMMARY_FIELDS.map((f) => f.key)).toEqual([
      'fullCycles',
      'openTabs',
      'noFullYet',
      'fromSlip',
      'fromRegister',
    ]);
    expect(SUMMARY_FIELDS.map((f) => f.label)).toEqual([
      'Full cycles',
      'Open tabs',
      'Trucks with no full tank yet',
      'From slips',
      'From register',
    ]);
  });

  it('reads an unmeasured figure as "—", never as 0', () => {
    expect(NOT_MEASURED).toBe('—');
  });
});

describe('formatCount', () => {
  it('reads a null count as "—"', () => {
    expect(formatCount(null)).toBe('—');
  });

  it('reads an absent count as "—"', () => {
    expect(formatCount(undefined)).toBe('—');
  });

  it('reads a real count as the number, and a real zero as 0', () => {
    expect(formatCount(7)).toBe('7');
    expect(formatCount(0)).toBe('0');
  });
});

describe('formatFullDate', () => {
  it('has no date for a null timestamp', () => {
    expect(formatFullDate(null)).toBeNull();
  });

  it('has no date for an absent timestamp', () => {
    expect(formatFullDate(undefined)).toBeNull();
  });

  it('reads the day in IST', () => {
    expect(formatFullDate('2026-11-02T06:10:00.000Z')).toBe('2 Nov 2026');
  });
});

describe('basisText', () => {
  it('has no basis for an unknown basis', () => {
    expect(basisText(null)).toBeNull();
  });

  it('has no basis for an absent basis', () => {
    expect(basisText(undefined)).toBeNull();
  });

  it('names where the full tank came from', () => {
    expect(basisText('SLIP')).toBe('from slips');
    expect(basisText('REGISTER_MAIN')).toBe('from register rows');
  });
});

describe('formatLastFull', () => {
  it('says the truck has no full tank yet when the backend says so', () => {
    expect(formatLastFull({ status: 'NO_FULL_YET', lastFullAt: null })).toBe('No full tank yet');
  });

  it('reads "—" when the date is absent and no status explains it', () => {
    expect(formatLastFull({ status: 'OPEN' })).toBe('—');
    expect(formatLastFull(undefined)).toBe('—');
  });

  it('reads the day and where it came from', () => {
    expect(formatLastFull(TRUCK)).toBe('2 Nov 2026 · from register rows');
    expect(formatLastFull({ ...TRUCK, lastFullBasis: 'SLIP' })).toBe('2 Nov 2026 · from slips');
  });
});

describe('formatDaysSince', () => {
  it('reads a null day count as "—"', () => {
    expect(formatDaysSince(null)).toBe('—');
  });

  it('reads an absent day count as "—"', () => {
    expect(formatDaysSince(undefined)).toBe('—');
  });

  it('reads the day count', () => {
    expect(formatDaysSince(6.4)).toBe('6.4');
    expect(formatDaysSince(6)).toBe('6');
  });
});

describe('formatKmSince', () => {
  it('reads a null km count as "—" — never 0', () => {
    expect(formatKmSince(null)).toBe('—');
  });

  it('reads an absent km count as "—"', () => {
    expect(formatKmSince(undefined)).toBe('—');
  });

  it('reads the km count', () => {
    expect(formatKmSince(1234)).toBe('1,234 km');
    expect(formatKmSince(0)).toBe('0 km');
  });
});

describe('formatPartialFills', () => {
  it('reads null partials as "—"', () => {
    expect(formatPartialFills(null)).toBe('—');
  });

  it('reads absent partials as "—"', () => {
    expect(formatPartialFills(undefined)).toBe('—');
  });

  it('reads the count and the litres', () => {
    expect(formatPartialFills({ count: 1, litres: 80 })).toBe('1 fill · 80 L');
    expect(formatPartialFills({ count: 3, litres: 240.5 })).toBe('3 fills · 240.5 L');
    expect(formatPartialFills({ count: 0, litres: 0 })).toBe('0 fills · 0 L');
  });
});

describe('formatKmPerL', () => {
  it('reads a null km/L as "—"', () => {
    expect(formatKmPerL(null)).toBe('—');
  });

  it('reads an absent km/L as "—"', () => {
    expect(formatKmPerL(undefined)).toBe('—');
  });

  it('reads the km/L', () => {
    expect(formatKmPerL(3.1)).toBe('3.1 km/L');
    expect(formatKmPerL(3)).toBe('3 km/L');
  });
});

describe('formatMedianGap', () => {
  it('prints nothing for a null gap — not "—" and not "0%"', () => {
    expect(formatMedianGap(null)).toBe('');
  });

  it('prints nothing for an absent gap', () => {
    expect(formatMedianGap(undefined)).toBe('');
  });

  it('reads the gap as a percentage', () => {
    expect(formatMedianGap(0.16)).toBe('16%');
    expect(formatMedianGap(0)).toBe('0%');
  });
});

describe('modelNote', () => {
  it('says nothing when the model is not above its peers', () => {
    expect(modelNote({ abovePeers: false })).toBe('');
  });

  it('says nothing when there are too few models to compare', () => {
    expect(modelNote({ abovePeers: null })).toBe('');
    expect(modelNote({})).toBe('');
  });

  it('names the ledger gap when the model is above its peers', () => {
    expect(modelNote({ abovePeers: true })).toBe(ABOVE_PEERS_NOTE);
    expect(ABOVE_PEERS_NOTE).toBe('ledger misses more km on this model');
  });
});

describe('readFullTankResponse', () => {
  it('reads an absent payload as an empty report', () => {
    expect(readFullTankResponse(undefined)).toEqual({
      trucks: [],
      summary: {},
      models: [],
      days: null,
    });
  });

  it('reads a payload without the blocks as an empty report', () => {
    expect(readFullTankResponse({})).toEqual({ trucks: [], summary: {}, models: [], days: null });
  });

  it('reads the blocks the backend sent', () => {
    const body = {
      trucks: [TRUCK],
      summary: { fullCycles: 540 },
      models: [{ modelKey: 'LPT 4830' }],
      days: 90,
    };
    expect(readFullTankResponse(body)).toEqual(body);
  });
});

describe('hasSummary', () => {
  it('is false for a null summary', () => {
    expect(hasSummary(null)).toBe(false);
  });

  it('is false for an empty summary', () => {
    expect(hasSummary({})).toBe(false);
  });

  it('is true when the backend sent a summary', () => {
    expect(hasSummary({ fullCycles: 540 })).toBe(true);
  });
});

describe('summaryItems', () => {
  it('reads a null figure as "—"', () => {
    const items = summaryItems({ fullCycles: null });
    expect(items.find((i) => i.key === 'fullCycles').value).toBe('—');
  });

  it('reads an absent figure as "—"', () => {
    const items = summaryItems({ fullCycles: 540 });
    expect(items.find((i) => i.key === 'openTabs').value).toBe('—');
  });

  it('reads the figures the backend sent', () => {
    const items = summaryItems({
      fullCycles: 540,
      openTabs: 120,
      noFullYet: 6,
      fromSlip: 80,
      fromRegister: 460,
    });
    expect(items.map((i) => i.value)).toEqual(['540', '120', '6', '80', '460']);
  });
});

describe('filterTrucks', () => {
  const trucks = [
    { registrationNumber: 'WB11A1234', model: 'LPT 4830' },
    { registrationNumber: 'WB25R9540', model: 'Tata 407' },
  ];

  it('finds nothing for a search that matches no plate or model', () => {
    expect(filterTrucks(trucks, 'ZZZ')).toEqual([]);
  });

  it('finds nothing for a null or absent search on an empty list', () => {
    expect(filterTrucks(null, 'LPT')).toEqual([]);
  });

  it('finds the trucks whose plate or model matches', () => {
    expect(filterTrucks(trucks, 'WB11')).toHaveLength(1);
    expect(filterTrucks(trucks, 'lpt')).toHaveLength(1);
    expect(filterTrucks(trucks, '')).toHaveLength(2);
  });
});

describe('countKmNotMeasured and kmNotMeasuredNote', () => {
  it('counts nothing when every truck has a measured km', () => {
    expect(countKmNotMeasured([{ kmSinceFull: 120 }])).toBe(0);
  });

  it('counts the trucks whose km was never measured', () => {
    expect(countKmNotMeasured([{ kmSinceFull: null }, { kmSinceFull: 120 }, {}])).toBe(2);
  });

  it('has no note when nothing is missing', () => {
    expect(kmNotMeasuredNote(0)).toBeNull();
    expect(kmNotMeasuredNote(null)).toBeNull();
  });

  it('names the missing km', () => {
    expect(kmNotMeasuredNote(1)).toBe('1 truck without a measured km since the last full tank');
    expect(kmNotMeasuredNote(6)).toBe('6 trucks without a measured km since the last full tank');
  });
});

describe('modelRows', () => {
  it('leaves the gap and the note empty for a null gap', () => {
    const [row] = modelRows([{ modelKey: 'LPT 4830', n: 230, trucks: 50, medianPct: null }]);
    expect(row.gap).toBe('');
    expect(row.note).toBe('');
    expect(row.cycles).toBe(230);
    expect(row.trucks).toBe(50);
  });

  it('leaves the gap and the note empty for an absent gap', () => {
    const [row] = modelRows([{ modelKey: 'LPT 4830', n: 230, trucks: 50 }]);
    expect(row.gap).toBe('');
    expect(row.note).toBe('');
  });

  it('reads the gap and the note the backend sent', () => {
    const [row] = modelRows([
      { modelKey: 'LPT 4830', n: 230, trucks: 50, medianPct: 0.16, abovePeers: true },
    ]);
    expect(row.gap).toBe('16%');
    expect(row.note).toBe(ABOVE_PEERS_NOTE);
  });

  it('has no rows when the backend sent none', () => {
    expect(modelRows(undefined)).toEqual([]);
    expect(modelRows([])).toEqual([]);
  });
});
