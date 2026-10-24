import { describe, expect, it } from 'vitest';
import { tollLayerPlazas, tollPopupLines } from './tollPlazas';

const plaza = (id, extra = {}) => ({ id, name: `${id} Toll Plaza`, lat: 22, lng: 88, ...extra });

describe('tollLayerPlazas', () => {
  const visited = [plaza('a', { visited: true })];
  const inView = [plaza('a', { visited: true }), plaza('b', { visited: false })];

  it('always shows the visited plazas', () => {
    expect(tollLayerPlazas(visited, inView, false).map((p) => p.id)).toEqual(['a']);
  });
  it('adds the other plazas in view only with the toggle on, never one twice', () => {
    expect(tollLayerPlazas(visited, inView, true).map((p) => [p.id, p.visited])).toEqual([
      ['a', true],
      ['b', false],
    ]);
  });
});

describe('tollPopupLines', () => {
  it('says how the fleet knows the plaza, where it is and what it costs', () => {
    const lines = tollPopupLines(
      plaza('d', {
        visited: true,
        visits: { stops: 2, lastAt: '2026-10-22T05:00:00Z', signals: ['ROUTE', 'STOP'] },
        nhNo: '19',
        state: 'WEST BENGAL',
        source: 'NHAI',
        corroborated: true,
        fares: { multiaxle: 410, axle_4_6: 590, axle_7_plus: null, bus: 210, lcv: 100 },
      }),
    );
    expect(Object.fromEntries(lines)).toEqual({
      'Your trucks': expect.stringMatching(
        /^on a route the fleet drives, stopped here · 2 stops · last /,
      ),
      Road: 'NH 19 · WEST BENGAL',
      Source: 'NHAI · gate confirmed on the map',
      'One way': '3-axle ₹410 · 4–6 axle ₹590 · 2-axle truck ₹210 · LCV ₹100',
    });
  });
  it('an unvisited OSM-only plaza with no fare says so', () => {
    const lines = Object.fromEntries(tollPopupLines(plaza('e', { source: 'OSM', fares: null })));
    expect(lines).toEqual({
      'Your trucks': 'not visited yet',
      Source: 'OpenStreetMap only',
      'One way': 'no fare yet',
    });
  });
});

describe('a fare TollGuru quoted', () => {
  it('is labelled a quote, never passed off as the published tariff', () => {
    const lines = Object.fromEntries(
      tollPopupLines(
        plaza('q', {
          source: 'OSM',
          fares: { multiaxle: null, axle_4_6: 610, source: 'TOLLGURU' },
        }),
      ),
    );
    expect(lines['One way (quote)']).toBe('4–6 axle ₹610');
  });
});

describe('a plaza only TollGuru knows', () => {
  it('says where it was found', () => {
    expect(Object.fromEntries(tollPopupLines(plaza('t', { source: 'TOLLGURU' }))).Source).toBe(
      'Found via TollGuru',
    );
  });
});
