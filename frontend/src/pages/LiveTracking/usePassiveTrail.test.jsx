import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ getTrail: vi.fn(), road: vi.fn() }));
vi.mock('./LiveTrackingService.jsx', () => ({ LiveTrackingService: { getTrail: mocks.getTrail } }));
vi.mock('../../services/RoadService.js', () => ({ default: { getRoadTrailIfEnabled: mocks.road } }));
import usePassiveTrail from './usePassiveTrail.js';
const points = [0, 1].map(i => ({ latitude: 22 + i, longitude: 88, eventDateTime: `2026-11-04T10:0${i}:00Z` }));
describe('passive trail selection', () => {
  it('clears immediately on deselection and ignores a late response', async () => {
    let finish;
    mocks.getTrail.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    mocks.road.mockResolvedValue(null);
    const view = renderHook(({ id }) => usePassiveTrail(id, id ? 'WB1' : null, true), { initialProps: { id: 'v1' } });
    await waitFor(() => expect(mocks.getTrail).toHaveBeenCalled());
    view.rerender({ id: null });
    expect(view.result.current).toBeNull();
    finish({ points });
    await Promise.resolve();
    expect(view.result.current).toBeNull();
    expect(mocks.road).not.toHaveBeenCalled();
  });
  it('loads a selection and removes it when disabled for Track mode', async () => {
    mocks.getTrail.mockResolvedValueOnce({ points });
    mocks.road.mockResolvedValue(null);
    const view = renderHook(({ enabled }) => usePassiveTrail('v1', 'WB1', enabled), { initialProps: { enabled: true } });
    await waitFor(() => expect(view.result.current?.points).toHaveLength(2));
    view.rerender({ enabled: false });
    expect(view.result.current).toBeNull();
  });
});
