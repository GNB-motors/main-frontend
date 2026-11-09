import { expect, it, vi } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import { getPlaceQuestions } from '../fleetViewService';
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('../../schemas/validate.js', () => ({ parseSafe: (_name, _loader, body) => body }));
it('passes the place-question period and vehicle through to the backend', async () => {
  apiClient.get.mockResolvedValue({ data: { data: { items: [], total: 0, tripsAffected: 0 } } });
  const { signal } = new AbortController();
  const params = {
    from: '2026-10-31T18:30:00Z',
    to: '2026-11-07T18:29:59.999Z',
    vehicleId: 'v1',
    limit: 200,
  };
  await getPlaceQuestions({ ...params, signal });
  expect(apiClient.get).toHaveBeenCalledWith('/api/fleet-view/places/questions', {
    params,
    signal,
  });
});
