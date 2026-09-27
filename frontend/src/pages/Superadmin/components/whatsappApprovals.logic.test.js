import { describe, it, expect } from 'vitest';
import {
  checkList,
  displayStatus,
  lagDaysOf,
  listStats,
  openCount,
  photoOdometerOf,
  searchFilter,
  toCsv,
  vehicleOf,
} from './whatsappApprovals.logic';

const draft = (o = {}) => ({
  _id: 'd1',
  status: 'READY',
  vehicleId: { registrationNumber: 'WB25R9540' },
  plateText: 'WB25R9540',
  litres: 100,
  rate: 100,
  amount: 10000,
  odometerReading: 50000,
  odometerSource: 'PHOTO',
  fuelOcr: { data: { confidence: 96 } },
  billDatetime: '2026-09-20T10:00:00.000Z',
  createdAt: '2026-09-20T12:00:00.000Z',
  ...o,
});

const byId = (cs, id) => cs.find((c) => c.id === id);

describe('checkList', () => {
  it('passes every check on a clean bill', () => {
    const cs = checkList(draft());
    expect(cs.every((c) => c.ok === true)).toBe(true);
    expect(openCount(draft())).toBe(0);
  });

  it('fails the maths check when the total does not match litres x rate', () => {
    const cs = checkList(draft({ amount: 12000 }));
    expect(byId(cs, 'math').ok).toBe(false);
    expect(byId(cs, 'math').value).toContain('2,000');
  });

  it('tolerates rounding under a rupee', () => {
    expect(byId(checkList(draft({ amount: 10000.4 })), 'math').ok).toBe(true);
  });

  it('matches plates ignoring spaces and dashes', () => {
    expect(byId(checkList(draft({ plateText: 'WB-25 R 9540' })), 'plate').ok).toBe(true);
    expect(byId(checkList(draft({ plateText: 'WB25R9999' })), 'plate').ok).toBe(false);
  });

  it('flags a dropped decimal as a 10x odometer', () => {
    const c = byId(
      checkList(draft({ odometerReading: 1041839, odometerOcr: { data: { reading: 104183.9 } } })),
      'odo',
    );
    expect(c.ok).toBe(false);
    expect(c.value).toBe('10×');
    expect(c.ackable).toBe(true);
  });

  it('lets a reviewer acknowledge a warning without changing the data', () => {
    const d = draft({ odometerReading: 1041839, odometerOcr: { data: { reading: 104183.9 } } });
    expect(openCount(d)).toBe(1);
    expect(openCount(d, new Set(['odo']))).toBe(0);
    // the reading itself is untouched — only the reviewer's verdict moved
    expect(d.odometerReading).toBe(1041839);
  });

  it('flags a bill submitted more than three days late', () => {
    const c = byId(
      checkList(
        draft({ billDatetime: '2026-09-01T10:00:00.000Z', createdAt: '2026-09-16T10:00:00.000Z' }),
      ),
      'lag',
    );
    expect(c.ok).toBe(false);
    expect(c.value).toBe('15 d');
  });

  /* A missing input is the sender's gap, not the bill's fault. Counting it as a
     failure would flag most of the queue and train reviewers to ignore flags. */
  it('reports an unjudgeable check as null, and null never counts as a failure', () => {
    const d = draft({
      rate: null,
      plateText: null,
      fuelOcr: null,
      odometerReading: null,
      billDatetime: null,
    });
    const cs = checkList(d);
    expect(cs.every((c) => c.ok === null)).toBe(true);
    expect(openCount(d)).toBe(0);
  });

  it('returns nothing for a missing draft', () => {
    expect(checkList(null)).toEqual([]);
  });
});

describe('photoOdometerOf', () => {
  it('reads the photo reading and rejects junk', () => {
    expect(photoOdometerOf({ odometerOcr: { data: { reading: '104183.9' } } })).toBe(104183.9);
    expect(photoOdometerOf({ odometerOcr: { data: { reading: 0 } } })).toBeNull();
    expect(photoOdometerOf({ odometerOcr: { data: { reading: 'n/a' } } })).toBeNull();
    expect(photoOdometerOf({})).toBeNull();
  });
});

describe('lagDaysOf', () => {
  it('floors to whole days and never goes negative', () => {
    expect(lagDaysOf(draft())).toBe(0);
    expect(lagDaysOf(draft({ createdAt: '2026-09-23T09:00:00.000Z' }))).toBe(2);
    // a bill dated after it arrived is clock skew, not a negative delay
    expect(lagDaysOf(draft({ createdAt: '2026-09-19T10:00:00.000Z' }))).toBe(0);
    expect(lagDaysOf(draft({ billDatetime: null }))).toBeNull();
  });
});

describe('displayStatus', () => {
  it('reads a flagged READY bill as needing review', () => {
    expect(displayStatus(draft())).toBe('READY');
    expect(displayStatus(draft({ amount: 12000 }))).toBe('REVIEW');
  });

  it('leaves a decided bill alone whatever its checks say', () => {
    expect(displayStatus(draft({ status: 'PUBLISHED', amount: 12000 }))).toBe('PUBLISHED');
  });
});

describe('listStats', () => {
  it('separates clean pending bills from flagged ones', () => {
    const items = [
      draft(),
      draft({ _id: 'd2', amount: 12000 }),
      draft({ _id: 'd3', status: 'PUBLISHED' }),
    ];
    const s = listStats(items, { PUBLISHED: 7 });
    expect(s.pendingCount).toBe(2);
    expect(s.cleanCount).toBe(1);
    expect(s.flaggedCount).toBe(1);
    expect(s.pendingValue).toBe(22000);
    expect(s.publishedCount).toBe(7); // the server count wins over the loaded page
  });
});

describe('searchFilter', () => {
  const items = [
    draft({ _id: 'a', stationName: 'IOC Dankuni' }),
    draft({ _id: 'b', vehicleId: { registrationNumber: 'WB11U6021' }, stationName: 'HP Durgapur' }),
  ];
  it('matches vehicle and station, case-insensitively', () => {
    expect(searchFilter(items, 'wb11').map((d) => d._id)).toEqual(['b']);
    expect(searchFilter(items, 'dankuni').map((d) => d._id)).toEqual(['a']);
    expect(searchFilter(items, '')).toHaveLength(2);
  });
});

describe('toCsv', () => {
  it('quotes the free-text columns so a comma cannot shift the row', () => {
    const csv = toCsv([draft({ stationName: 'M/S Sani, NH-60, Birbhum' })]);
    const [head, row] = csv.split('\n');
    expect(head.split(',')).toHaveLength(11);
    expect(row).toContain('"M/S Sani, NH-60, Birbhum"');
  });
});

describe('vehicleOf', () => {
  it('falls back to the raw plate when the vehicle is not linked', () => {
    expect(vehicleOf({ vehicleReg: 'WB99Z0001' })).toBe('WB99Z0001');
    expect(vehicleOf({})).toBe('—');
  });
});
