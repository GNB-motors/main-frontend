import { describe, it, expect } from 'vitest';
import {
  clampSpeed,
  clampDurationMinutes,
  normaliseWindowHours,
  windowRange,
  windowLabel,
  buildQuery,
  placeText,
  eventsExportRows,
  exportMeta,
  SPEED_DEFAULT,
  DURATION_DEFAULT_MINUTES,
} from './overspeedParams';

const NOW = new Date('2026-09-06T12:00:00.000Z');

describe('clampSpeed', () => {
  it('passes valid speeds through, rounded', () => {
    expect(clampSpeed(60)).toBe(60);
    expect(clampSpeed(78.4)).toBe(78);
  });

  it('clamps to the 20–160 API window', () => {
    expect(clampSpeed(5)).toBe(20);
    expect(clampSpeed(400)).toBe(160);
  });

  it('absent is not zero — non-finite falls back to the default', () => {
    expect(clampSpeed(null)).toBe(SPEED_DEFAULT);
    expect(clampSpeed('')).toBe(SPEED_DEFAULT);
    expect(clampSpeed('fast')).toBe(SPEED_DEFAULT);
    expect(clampSpeed(undefined)).toBe(SPEED_DEFAULT);
  });
});

describe('clampDurationMinutes', () => {
  it('passes valid minutes through, rounded', () => {
    expect(clampDurationMinutes(3)).toBe(3);
    expect(clampDurationMinutes(2.6)).toBe(3);
  });

  it('clamps to 1–10 minutes (the 5–600 s API window)', () => {
    expect(clampDurationMinutes(0)).toBe(1);
    expect(clampDurationMinutes(45)).toBe(10);
  });

  it('falls back to the default for absent input', () => {
    expect(clampDurationMinutes(null)).toBe(DURATION_DEFAULT_MINUTES);
    expect(clampDurationMinutes('abc')).toBe(DURATION_DEFAULT_MINUTES);
  });
});

describe('normaliseWindowHours', () => {
  it('accepts only the offered windows, else 24 h', () => {
    expect(normaliseWindowHours(24)).toBe(24);
    expect(normaliseWindowHours(72)).toBe(72);
    expect(normaliseWindowHours(168)).toBe(168);
    expect(normaliseWindowHours(48)).toBe(24);
    expect(normaliseWindowHours('nonsense')).toBe(24);
  });
});

describe('windowRange', () => {
  it('spans the requested hours ending at now', () => {
    expect(windowRange(24, NOW)).toEqual({
      from: '2026-09-05T12:00:00.000Z',
      to: '2026-09-06T12:00:00.000Z',
    });
    expect(windowRange(72, NOW).from).toBe('2026-09-03T12:00:00.000Z');
    expect(windowRange(168, NOW).from).toBe('2026-08-30T12:00:00.000Z');
  });

  it('falls back to 24 h for an unoffered window', () => {
    expect(windowRange(999, NOW).from).toBe('2026-09-05T12:00:00.000Z');
  });
});

describe('windowLabel', () => {
  it('names the offered windows, never a raw number', () => {
    expect(windowLabel(24)).toBe('Last 24 hours');
    expect(windowLabel(72)).toBe('Last 3 days');
    expect(windowLabel(168)).toBe('Last 7 days');
    expect(windowLabel(13)).toBe('Last 24 hours');
  });
});

describe('buildQuery', () => {
  it('maps UI state to API params — minutes become seconds', () => {
    expect(
      buildQuery({ vehicleId: 'v1', speedKmh: 60, durationMin: 3, windowHours: 24 }, NOW),
    ).toEqual({
      vehicleId: 'v1',
      from: '2026-09-05T12:00:00.000Z',
      to: '2026-09-06T12:00:00.000Z',
      speedKmh: 60,
      durationSec: 180,
    });
  });

  it('clamps threshold inputs', () => {
    const q = buildQuery({ vehicleId: 'v1', speedKmh: 500, durationMin: 0, windowHours: 72 });
    expect(q.speedKmh).toBe(160);
    expect(q.durationSec).toBe(60);
  });

  it('returns null without a vehicle — a prompt state, not a 400', () => {
    expect(buildQuery({ vehicleId: '', speedKmh: 60, durationMin: 3, windowHours: 24 })).toBeNull();
    expect(buildQuery({})).toBeNull();
  });
});

describe('placeText', () => {
  it('joins label and sub — "NH-19 · near Dankuni"', () => {
    expect(placeText({ label: 'NH-19', sub: 'near Dankuni' })).toBe('NH-19 · near Dankuni');
    expect(placeText({ label: 'NH-19' })).toBe('NH-19');
  });

  it('never renders a coordinate or an empty string', () => {
    expect(placeText(null)).toBe('Location unavailable');
    expect(placeText({})).toBe('Location unavailable');
    expect(placeText({ label: '  ' })).toBe('Location unavailable');
  });
});

describe('eventsExportRows', () => {
  const places = { '22.6800,88.2800': { label: 'NH-19', sub: 'near Dankuni' } };

  it('maps events to export rows with resolved places', () => {
    const rows = eventsExportRows(
      [
        {
          startAt: '2026-09-06T08:00:00Z',
          maxSpeedKmh: 78.4,
          avgSpeedKmh: 71.2,
          durationSec: 360,
          pingCount: 12,
          startLat: 22.68,
          startLng: 88.28,
        },
      ],
      places,
    );
    expect(rows).toEqual([
      {
        startedAt: '2026-09-06T08:00:00Z',
        maxSpeedKmh: 78.4,
        avgSpeedKmh: 71.2,
        durationMin: 6,
        pingCount: 12,
        place: 'NH-19 · near Dankuni',
      },
    ]);
  });

  it('uses the unavailable label for missing coords or unresolved places', () => {
    const rows = eventsExportRows([{ durationSec: 60 }, { startLat: 22.68, startLng: 88.28 }], {});
    expect(rows[0].place).toBe('Location unavailable');
    expect(rows[1].place).toBe('Location unavailable');
  });

  it('handles null and empty input', () => {
    expect(eventsExportRows(null, {})).toEqual([]);
    expect(eventsExportRows([], {})).toEqual([]);
  });

  it('0 is a value — a zero duration stays 0, not null', () => {
    const rows = eventsExportRows([{ durationSec: 0, pingCount: 0 }], {});
    expect(rows[0].durationMin).toBeNull(); // 0 s is not a measurable duration
    expect(rows[0].pingCount).toBe(0);
  });
});

describe('exportMeta', () => {
  it('carries vehicle, window and both thresholds', () => {
    const meta = exportMeta({
      registrationNumber: 'WB-12-AB-1234',
      windowHours: 72,
      speedKmh: 60,
      durationMin: 3,
    });
    expect(meta).toEqual([
      { label: 'Vehicle', value: 'WB-12-AB-1234' },
      { label: 'Window', value: 'Last 3 days' },
      { label: 'Speed over', value: '60 km/h' },
      { label: 'At least', value: '3 min' },
      { label: 'Scope', value: expect.stringContaining('recomputed from position history') },
    ]);
  });

  it('clamps thresholds and tolerates a missing registration', () => {
    const meta = exportMeta({
      registrationNumber: null,
      windowHours: 24,
      speedKmh: 999,
      durationMin: 99,
    });
    expect(meta.find((m) => m.label === 'Vehicle').value).toBe('—');
    expect(meta.find((m) => m.label === 'Speed over').value).toBe('160 km/h');
    expect(meta.find((m) => m.label === 'At least').value).toBe('10 min');
  });
});
