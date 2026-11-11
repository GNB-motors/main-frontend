import { describe, expect, it } from 'vitest';
import { encodePolyline6 } from '../../lib/polyline6.js';
import { trackRouteModel } from './useTrackRoutes.js';

describe('Track routes', () => {
  it('draws only matched non-plant lanes and counts missing geometry', () => {
    const encoded = encodePolyline6([
      { lat: 22, lng: 88 },
      { lat: 23, lng: 87 },
    ]);
    const leg = (id, source, extra = {}) => ({
      _id: id,
      fromSiteId: 'a',
      toSiteId: 'b',
      traversals: 2,
      path: { source, overviewSegments: source === 'NONE' ? [] : [encoded] },
      ...extra,
    });
    const result = trackRouteModel({
      sites: [
        { _id: 'a', lat: 22, lng: 88 },
        { _id: 'b', lat: 23, lng: 87 },
      ],
      legs: [
        leg('a', 'DRIVEN'),
        leg('b', 'ENGINE'),
        leg('c', 'NONE'),
        leg('d', 'DRIVEN', { inPlant: true }),
      ],
    });
    expect(result.lines.map((line) => line.id)).toEqual(['a', 'b']);
    expect(result.unmatchedCount).toBe(1);
    expect(result.legs.map((leg) => leg._id)).toEqual(['a', 'b', 'c']);
  });
});

// Delivery-route identities and trip counts must not inherit movement counters.
import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import useTrackRoutes, { trackDeliveryModel, loadDeliveryRoutes } from './useTrackRoutes';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService';
vi.mock('../PlaceHub/intelligence/PlaceIntelligenceService', () => ({
  default: { listDeliveryLegs: vi.fn(), routesMap: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());
it('adapts delivery IDs and trip counts without inventing missing road geometry', () => {
  const model = trackDeliveryModel({
    rows: [
      {
        _id: 'delivery1',
        fromSiteId: 'a',
        toSiteId: 'b',
        fromName: 'Factory',
        toName: 'Customer',
        n: 12,
        km: { p50: 123 },
        fromPosition: { lat: 22, lng: 88 },
        toPosition: { lat: 23, lng: 87 },
      },
    ],
  });
  expect(model.legs[0]).toMatchObject({
    _id: 'delivery1',
    title: 'Factory → Customer',
    traversals: 12,
    n: 12,
  });
  expect(model.lines).toEqual([]);
  expect(model.unmatchedCount).toBe(1);
});
it('loads every delivery page rather than silently dropping routes after 200', async () => {
  PlaceIntelligenceService.listDeliveryLegs.mockImplementation(async ({ page }) => ({
    rows: [{ _id: String(page) }],
    total: 401,
  }));
  expect((await loadDeliveryRoutes(new AbortController().signal)).rows).toHaveLength(3);
  expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenCalledTimes(3);
});
it('requests delivery data by default when selected and clears it immediately on a mode switch', async () => {
  let resolveDelivery;
  PlaceIntelligenceService.listDeliveryLegs.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveDelivery = resolve;
      }),
  );
  PlaceIntelligenceService.routesMap.mockResolvedValue({ legs: [], sites: [] });
  const { result, rerender } = renderHook(({ kind }) => useTrackRoutes({ enabled: true, kind }), {
    initialProps: { kind: 'delivery' },
  });
  await waitFor(() => expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenCalled());
  const signal = PlaceIntelligenceService.listDeliveryLegs.mock.calls[0][1].signal;
  expect(PlaceIntelligenceService.routesMap).not.toHaveBeenCalled();
  rerender({ kind: 'movement' });
  expect(signal.aborted).toBe(true);
  await act(async () => resolveDelivery({ rows: [{ _id: 'old-delivery' }], total: 1 }));
  expect(result.current.legs).toEqual([]);
  expect(PlaceIntelligenceService.routesMap).toHaveBeenCalled();
});
