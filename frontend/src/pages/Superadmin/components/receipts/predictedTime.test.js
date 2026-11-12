import { describe, it, expect } from 'vitest';
import { predictedEvidenceLines, predictedTimeText } from './predictedTime';

describe('predictedTimeText', () => {
  it('shows the predicted time in plain words with its source', () => {
    const at = new Date('2026-11-12T13:10:00.000Z'); // 6:40 pm IST
    expect(predictedTimeText({ at, source: 'SENSOR_RISE' })).toBe(
      'Predicted 6:40 pm (tank rise)'
    );
  });

  it('names a GPS based prediction', () => {
    const at = new Date('2026-11-12T13:10:00.000Z');
    expect(predictedTimeText({ at, source: 'GPS_AT_PUMP' })).toBe(
      'Predicted 6:40 pm (GPS at pump)'
    );
  });

  it('names both sources when they agree', () => {
    const at = new Date('2026-11-12T13:10:00.000Z');
    expect(predictedTimeText({ at, source: 'BOTH' })).toBe(
      'Predicted 6:40 pm (tank rise and GPS at pump)'
    );
  });

  it('says nothing when there is no predicted time', () => {
    expect(predictedTimeText(null)).toBe('');
    expect(predictedTimeText(undefined)).toBe('');
    expect(predictedTimeText({ at: null, source: 'SENSOR_RISE' })).toBe('');
    expect(predictedTimeText({ at: 'not-a-date', source: 'SENSOR_RISE' })).toBe('');
  });

  it('says when the truck itself is only likely', () => {
    const at = new Date('2026-11-12T13:10:00.000Z');
    expect(
      predictedTimeText({ at, source: 'SENSOR_RISE', evidence: { truckStatus: 'likely' } }),
    ).toBe('Predicted 6:40 pm (tank rise, likely truck)');
  });

  it('lists how we know, in plain words', () => {
    const lines = predictedEvidenceLines({
      truckStatus: 'likely',
      sensor: { at: '2026-11-12T13:10:00.000Z', litres: 100, pumpName: 'Jhargram Pump' },
      gps: {
        at: '2026-11-12T13:05:00.000Z',
        until: '2026-11-12T13:12:00.000Z',
        fixes: 3,
        radiusM: 500,
        place: { name: 'Jhargram Pump' },
      },
      alsoSeen: {
        source: 'GPS_AT_PUMP',
        at: '2026-11-12T13:05:00.000Z',
        until: '2026-11-12T13:12:00.000Z',
        place: { name: 'Jhargram Pump' },
        why: 'the tank rise was not during that visit at the pump',
      },
    });
    expect(lines[0]).toBe('Tank rise at Jhargram Pump of 100 L at 6:40 pm.');
    expect(lines[1]).toBe('At Jhargram Pump from 6:35 pm to 6:42 pm, 3 readings within 500 m.');
    expect(lines[2]).toMatch(/Also seen/);
    expect(lines[3]).toMatch(/only likely/);
  });

  it('says nothing about evidence that is not there', () => {
    expect(predictedEvidenceLines(null)).toEqual([]);
    expect(predictedEvidenceLines({})).toEqual([]);
  });
});
