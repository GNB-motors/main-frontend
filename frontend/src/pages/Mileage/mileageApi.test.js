import { expect, it, vi } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import { MileageApi } from './mileageApi';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('../../schemas/validate', () => ({ parseSafe: (_name, _loader, body) => body }));

it('asks for the exact selected IST month, rather than a days count anchored to today', async () => {
  const body = { kmPerLitre: { fleet: { kmPerL: 4 } } };
  apiClient.get.mockResolvedValue({ data: { status: 'success', data: body } });
  const { signal } = new AbortController();
  expect(
    await MileageApi.rollup({ from: '2026-09-01', to: '2026-09-30', manufacturer: 'TATA' }, signal),
  ).toEqual(body);
  expect(apiClient.get).toHaveBeenCalledWith('/api/mileage-rollup', {
    params: {
      from: '2026-08-31T18:30:00.000Z',
      to: '2026-09-30T18:29:59.999Z',
      manufacturer: 'TATA',
    },
    signal,
  });
});
