import { describe, it, expect } from 'vitest';
import {
  NO_USUAL_ROAD_CAPTION,
  costLabel,
  deviationDetailModel,
  stopsDuringRows,
  tripHeader,
} from './deviationDetailModel';

describe('tripHeader', () => {
  it('says which run it was and where it went', () => {
    expect(
      tripHeader({ leg: 'LADEN', pickupName: 'FARAKKA AMBUJA PLANT', dropName: 'DANKUNI SIDING' }),
    ).toBe('On a loaded run · FARAKKA AMBUJA PLANT → DANKUNI SIDING');
  });

  it('names an empty run', () => {
    expect(tripHeader({ leg: 'EMPTY' })).toBe('On an empty run');
  });

  it('is null without a trip, so the screen can hide the line', () => {
    expect(tripHeader(null)).toBeNull();
  });
});

describe('costLabel', () => {
  it('is an em dash when the cost is unknown', () => {
    expect(costLabel(null)).toBe('—');
    expect(costLabel(undefined)).toBe('—');
  });

  it('never shows a zero for an unknown cost', () => {
    expect(costLabel(0)).toBe('₹0');
    expect(costLabel(null)).not.toBe('₹0');
  });

  it('writes the rupees', () => {
    expect(costLabel(1240)).toBe('₹1,240');
  });
});

describe('stopsDuringRows', () => {
  it('keeps the facts: where, when and for how long', () => {
    const rows = stopsDuringRows([
      {
        startAt: '2026-11-01T15:00:00Z',
        endAt: '2026-11-01T15:35:00Z',
        durationMin: 35,
        place: { name: 'Mohania', lat: 24.37, lng: 84.98 },
      },
    ]);
    expect(rows[0].placeName).toBe('Mohania');
    expect(rows[0].durationMin).toBe(35);
  });

  it('copes with no place', () => {
    const rows = stopsDuringRows([
      { startAt: '2026-11-01T15:00:00Z', endAt: '2026-11-01T15:35:00Z', durationMin: 35, place: null },
    ]);
    expect(rows[0].placeName).toBeNull();
  });

  it('is an empty list for an empty list', () => {
    expect(stopsDuringRows([])).toEqual([]);
  });
});

describe('deviationDetailModel', () => {
  const detail = {
    geometry: {
      exitPoint: { lat: 23.9, lng: 85.2, at: '2026-11-01T14:55:00Z' },
      rejoinPoint: { lat: 23.95, lng: 85.3, at: '2026-11-01T15:23:00Z' },
      offRoute: [
        [23.9, 85.2],
        [23.92, 85.25],
        [23.95, 85.3],
      ],
    },
    usualRoute: [
      [23.8, 85.1],
      [23.95, 85.3],
    ],
    trip: { autoTripId: 't1', leg: 'LADEN', pickupName: 'FARAKKA AMBUJA PLANT', dropName: 'DANKUNI SIDING' },
    replay: { label: 'Watch it', to: '/live-tracking?v=WB11L8862&from=x&to=y' },
    stopsDuring: [
      {
        startAt: '2026-11-01T15:00:00Z',
        endAt: '2026-11-01T15:35:00Z',
        durationMin: 35,
        place: { name: 'Mohania', lat: 24.37, lng: 84.98 },
      },
    ],
  };

  it('has the usual road when the API sent one', () => {
    const model = deviationDetailModel(detail, null);
    expect(model.hasUsualRoad).toBe(true);
    expect(model.noUsualRoadCaption).toBeNull();
  });

  it('uses nested road-engine geometry returned by the API', () => {
    const result = deviationDetailModel({ roadEngine: { usualRoute: detail.usualRoute, geometry: detail.geometry } });
    expect(result.hasUsualRoad).toBe(true);
    expect(result.offRoute).toHaveLength(3);
  });

  it('says why the usual road is not drawn when it is missing', () => {
    const model = deviationDetailModel({ ...detail, usualRoute: null }, null);
    expect(model.hasUsualRoad).toBe(false);
    expect(model.noUsualRoadCaption).toBe(NO_USUAL_ROAD_CAPTION);
  });

  it('keeps the off-route part apart from the road as driven', () => {
    const model = deviationDetailModel(detail, null);
    expect(model.offRoute).toHaveLength(3);
    expect(model.exitPoint.lat).toBe(23.9);
    expect(model.rejoinPoint.lat).toBe(23.95);
  });

  it('gives the header and the replay link', () => {
    const model = deviationDetailModel(detail, null);
    expect(model.header).toContain('On a loaded run');
    expect(model.replay.to).toContain('/live-tracking?');
  });

  it('lists the stops while off the usual road', () => {
    const model = deviationDetailModel(detail, null);
    expect(model.stopsDuring).toHaveLength(1);
    expect(model.stopsDuring[0].placeName).toBe('Mohania');
  });

  it('never writes a reason for a stop', () => {
    const model = deviationDetailModel(detail, null);
    const text = JSON.stringify(model.stopsDuring);
    expect(text).not.toMatch(/drink|liquor|theft|suspicious/i);
  });

  it('falls back to the feed row when the new fields are not there', () => {
    const model = deviationDetailModel(null, { startedAt: '2026-11-01T14:55:00Z', durationMin: 28 });
    expect(model.durationMin).toBe(28);
    expect(model.exitAt).toBe('2026-11-01T14:55:00Z');
  });
});
