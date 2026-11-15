import { describe, it, expect } from 'vitest';
import {
  predictedEvidenceLines,
  predictedTimeText,
  fillTimeInfo,
  fillTimeFromDraft,
  fillTimeText,
  matchedRiseText,
  dateTextHasYear,
} from './predictedTime';

describe('predictedTimeText', () => {
  it('shows the predicted time in plain words with its source', () => {
    const at = new Date('2026-11-12T13:10:00.000Z'); // 6:40 pm IST
    expect(predictedTimeText({ at, source: 'SENSOR_RISE' })).toBe(
      'Predicted 12 Nov, 6:40 pm (tank rise)'
    );
  });

  it('names a GPS based prediction', () => {
    const at = new Date('2026-11-12T13:10:00.000Z');
    expect(predictedTimeText({ at, source: 'GPS_AT_PUMP' })).toBe(
      'Predicted 12 Nov, 6:40 pm (GPS at pump)'
    );
  });

  it('names both sources when they agree', () => {
    const at = new Date('2026-11-12T13:10:00.000Z');
    expect(predictedTimeText({ at, source: 'BOTH' })).toBe(
      'Predicted 12 Nov, 6:40 pm (tank rise and GPS at pump)'
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
    ).toBe('Predicted 12 Nov, 6:40 pm (tank rise, likely truck)');
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

import { suggestedLitres, severalRisesText } from './predictedTime';

describe('tank-rise match words', () => {
  it('says how sure the match is', () => {
    const at = new Date('2026-11-09T14:41:00.000Z');
    expect(predictedTimeText({ at, source: 'SENSOR_RISE', confidence: 'HIGH' })).toBe(
      'Predicted 9 Nov, 8:11 pm (tank rise, two clues agree)'
    );
  });

  it('shows the matcher lines and the odometer note', () => {
    const lines = predictedEvidenceLines({
      plainLines: ['Tank rose 218 L at 8:11 pm on 9 Nov.'],
      odometerNote: 'The odometer on the photo is higher than the truck’s own odometer.',
      sensor: { at: '2026-11-09T14:41:00.000Z', litres: 218 },
    });
    expect(lines).toEqual([
      'Tank rose 218 L at 8:11 pm on 9 Nov.',
      'The odometer on the photo is higher than the truck’s own odometer.',
    ]);
  });

  it('suggests the litres of the match', () => {
    expect(suggestedLitres({ litres: 218 })).toBe(218);
    expect(suggestedLitres({ evidence: { litresSuggestion: { litres: 150.5 } } })).toBe(150.5);
    expect(suggestedLitres({ litres: null })).toBeNull();
  });

  it('asks a person to pick when several rises fit', () => {
    expect(
      severalRisesText({ at: null, evidence: { status: 'several', candidates: [{}, {}, {}] } })
    ).toBe('Several tank rises fit — choose one.');
    expect(severalRisesText({ at: '2026-11-09T14:41:00.000Z', evidence: { status: 'several' } })).toBe('');
  });
});

describe('the fill time of a photo', () => {
  it('shows the time and where it came from', () => {
    const info = fillTimeInfo({ value: '2026-11-12T13:10:00.000Z', source: 'stamp' });
    expect(info.value).toBe('12 Nov, 6:40 pm');
    expect(info.source).toBe('Photo stamp');
    expect(info.sourceKnown).toBe(true);
    expect(info.missing).toBe(false);
  });

  it('says when the source was not recorded', () => {
    const info = fillTimeInfo({ value: '2026-11-12T13:10:00.000Z' });
    expect(info.source).toBe('Source not recorded');
    expect(info.sourceKnown).toBe(false);
  });

  it('says plainly when there is no fill time', () => {
    expect(fillTimeInfo(null).missing).toBe(true);
    expect(fillTimeInfo({ value: null }).missing).toBe(true);
    expect(fillTimeInfo({ value: 'not-a-date' }).missing).toBe(true);
    expect(fillTimeText(null)).toBe('Fill time not read from the photo.');
  });

  it('shows the fill time in plain words', () => {
    expect(fillTimeText({ value: '2026-11-12T13:10:00.000Z', source: 'printed' })).toBe(
      '12 Nov, 6:40 pm'
    );
  });

  it('knows when a date carries a year', () => {
    expect(dateTextHasYear('12 Nov 2026, 6:40 pm')).toBe(true);
    expect(dateTextHasYear('12 Nov, 6:40 pm')).toBe(false);
    expect(dateTextHasYear('')).toBe(false);
  });

  it('uses the printed bill date when the photo gave no fill time, never the received time', () => {
    const info = fillTimeFromDraft({
      time: null,
      billDatetime: '2026-11-12T13:10:00.000Z',
      createdAt: '2026-11-20T10:00:00.000Z',
    });
    expect(info.value).toBe('12 Nov, 6:40 pm');
    expect(info.source).toBe('Printed bill');
    expect(info.missing).toBe(false);
  });

  it('shows a dash for the half of a matched rise that was not measured', () => {
    expect(matchedRiseText({})).toBe('Matched tank rise: — · —');
    expect(matchedRiseText({ at: '2026-11-12T13:10:00.000Z', litres: 100 })).toBe(
      'Matched tank rise: 12 Nov, 6:40 pm · 100 L',
    );
  });
});

describe('fillTimeFromDraft year confirmation', () => {
  it('a time the server decided (stamp) has its year confirmed', () => {
    const info = fillTimeFromDraft({ time: { value: '2026-11-13T10:27:00.000Z', source: 'stamp' } });
    expect(info.yearConfirmed).toBe(true);
  });
  it('a printed bill date with no decided time leaves the year unconfirmed', () => {
    const info = fillTimeFromDraft({ time: null, billDatetime: '2026-11-13T10:27:00.000Z' });
    expect(info.source).toBe('Printed bill');
    expect(info.yearConfirmed).toBe(false);
  });
});
