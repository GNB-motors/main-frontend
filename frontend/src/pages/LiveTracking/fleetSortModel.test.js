import { describe, it, expect } from 'vitest';
import { sortFleet } from './fleetSortModel';

const truck = (plate, status, ago) => ({ id: plate, plate, status, ago });

describe('sortFleet', () => {
  const fleet = [
    truck('DARK1', 'offline', 600),
    truck('MOVE1', 'moving', 2),
    truck('STOP1', 'stopped', 30),
    truck('MOVE2', 'moving', 1),
  ];

  it('keeps the usual live order when there are no red alert badges', () => {
    expect(sortFleet(fleet).map((v) => v.plate)).toEqual(['MOVE2', 'MOVE1', 'STOP1', 'DARK1']);
  });

  it('does not reorder the input', () => {
    sortFleet(fleet, { alertCounts: new Map([['DARK1', 1]]) });
    expect(fleet.map((v) => v.plate)).toEqual(['DARK1', 'MOVE1', 'STOP1', 'MOVE2']);
  });

  it('automatically puts red-badge trucks first in All', () => {
    const alertCounts = new Map([['DARK1', 1]]);
    expect(sortFleet(fleet, { alertCounts }).map((v) => v.plate)).toEqual([
      'DARK1',
      'MOVE2',
      'MOVE1',
      'STOP1',
    ]);
  });

  it('keeps the live order within each group regardless of alert count', () => {
    const alertCounts = new Map([
      ['DARK1', 9],
      ['MOVE1', 1],
    ]);
    expect(sortFleet(fleet, { alertCounts }).map((v) => v.plate)).toEqual([
      'MOVE1',
      'DARK1',
      'MOVE2',
      'STOP1',
    ]);
  });

  it('keeps the usual live order outside All', () => {
    const alertCounts = new Map([['DARK1', 1]]);
    expect(sortFleet(fleet, { filter: 'gps', alertCounts }).map((v) => v.plate)).toEqual([
      'MOVE2',
      'MOVE1',
      'STOP1',
      'DARK1',
    ]);
  });

  it('matches the badge plate normalization', () => {
    const list = [truck('mh 12 ab 1', 'offline', 600), truck('X2', 'moving', 0)];
    const order = sortFleet(list, { alertCounts: new Map([['MH12AB1', 2]]) });
    expect(order[0].plate).toBe('mh 12 ab 1');
  });
});
