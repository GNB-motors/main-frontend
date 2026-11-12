import { describe, it, expect } from 'vitest';
import { predictedTimeText } from './predictedTime';

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
});
