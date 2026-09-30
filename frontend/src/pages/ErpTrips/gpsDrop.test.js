import { describe, it, expect } from 'vitest';
import { dropPrompt, closeDefaults, istDateInput } from './gpsDrop.js';

const trip = (over = {}) => ({
  state: 'DISPATCHED',
  tripClosedAt: null,
  toLocation: 'Dibrugarh',
  dropName: 'Dibrugarh Plant',
  gpsDrop: { arrivedAt: '2026-09-25T13:10:00Z', leftAt: '2026-09-25T14:40:00Z' },
  ...over,
});

describe('dropPrompt', () => {
  it('suggests closing once GPS saw the truck at the drop', () => {
    expect(dropPrompt(trip())).toEqual({
      placeName: 'Dibrugarh Plant',
      arrivedAt: '2026-09-25T13:10:00Z',
      leftAt: '2026-09-25T14:40:00Z',
      stillThere: false,
      stayedMin: 90,
    });
  });

  it('counts the stay up to now while the truck is still there', () => {
    const p = dropPrompt(
      trip({ gpsDrop: { arrivedAt: '2026-09-25T13:10:00Z' } }),
      new Date('2026-09-25T13:55:00Z'),
    );
    expect(p).toMatchObject({ stillThere: true, stayedMin: 45 });
  });

  it('says nothing once the trip is closed, or without a GPS drop', () => {
    expect(dropPrompt(trip({ tripClosedAt: '2026-09-25T15:00:00Z' }))).toBeNull();
    expect(dropPrompt(trip({ state: 'TRIP_CLOSED' }))).toBeNull();
    expect(dropPrompt(trip({ gpsDrop: null }))).toBeNull();
  });
});

describe('closeDefaults', () => {
  it('starts the close form from the GPS drop, in IST', () => {
    // 20:10 IST on 25 Sep; a UTC slice would already say 25 but 23:30 IST would not.
    expect(
      closeDefaults(
        trip({ gpsDrop: { arrivedAt: '2026-09-25T17:00:00Z', leftAt: '2026-09-25T18:30:00Z' } }),
      ),
    ).toEqual({ unloadedAt: '2026-09-26', unloadLocation: 'Dibrugarh Plant', fromGps: true });
  });

  it('falls back to today and the route text without a GPS drop', () => {
    const now = new Date('2026-10-01T06:00:00Z');
    expect(closeDefaults(trip({ gpsDrop: null }), now)).toEqual({
      unloadedAt: istDateInput(now),
      unloadLocation: 'Dibrugarh',
      fromGps: false,
    });
  });
});
