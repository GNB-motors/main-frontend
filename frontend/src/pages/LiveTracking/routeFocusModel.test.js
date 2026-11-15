import { describe, it, expect } from 'vitest';
import { routeFocusModel } from './routeFocusModel.js';
import { encodePolyline6 } from '../../lib/polyline6.js';

const start = { lat: 22, lng: 88 };
const end = { lat: 23, lng: 87 };
const sites = new Map([['a', { ...start, name: 'Plant' }], ['b', { ...end, name: 'Depot' }]]);
const leg = { _id: 'route', title: 'Plant → Depot', fromSiteId: 'a', toSiteId: 'b', path: { source: 'DRIVEN', overviewSegments: [encodePolyline6([start, end])] } };

describe('focused route geometry', () => {
  it('uses detailed geometry for the selected direction and distinct start/end places', () => {
    const mid = { lat: 22.5, lng: 87.7 };
    const model = routeFocusModel(leg, sites, { _id: 'route', path: { source: 'DRIVEN', geomSegments: [encodePolyline6([start, mid, end])] } });
    expect(model.segments).toEqual([[start, mid, end]]);
    expect(model.start).toEqual({ name: 'Plant', position: start });
    expect(model.end).toEqual({ name: 'Depot', position: end });
  });
  it('ignores stale details from a different route', () => {
    expect(routeFocusModel(leg, sites, { _id: 'other', path: { source: 'NONE' } }).segments).toEqual([[start, end]]);
  });
  it('orients reversed geometry from the start place to the end place', () => {
    const reverse = { ...leg, path: { source: 'ENGINE', overviewSegments: [encodePolyline6([end, start])] } };
    expect(routeFocusModel(reverse, sites).segments).toEqual([[start, end]]);
  });
  it('shows endpoints without inventing a road when geometry is absent', () => {
    const model = routeFocusModel({ ...leg, path: { source: 'NONE' } }, sites);
    expect(model.segments).toEqual([]);
    expect(model.source).toBe('NONE');
    expect(model.points).toEqual([start, end]);
  });
});
