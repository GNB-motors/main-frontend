import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import DeliveryRoutes from './DeliveryRoutes';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import { getUserRole } from '../../../utils/session';
vi.mock('../../../utils/session', () => ({ getUserRole: vi.fn(), getPref: () => null }));
vi.mock('./PlaceIntelligenceService', () => ({
  default: {
    listLegs: vi.fn(),
    listSites: vi.fn(),
    listDeliveryLegs: vi.fn(),
    getDeliveryLeg: vi.fn(),
    reviewDeliveryLeg: vi.fn(),
  },
}));
const leg = {
  _id: 'leg1',
  fromName: 'Plant',
  toName: 'Town',
  n: 4,
  trucks: 2,
  km: { p50: 105, p90: 115 },
  sap: { sapKm: 100 },
  review: 'NEEDS_REVIEW',
};
beforeEach(() => {
  vi.clearAllMocks();
  getUserRole.mockReturnValue('OWNER');
  PlaceIntelligenceService.listLegs.mockResolvedValue({ records: [] });
  PlaceIntelligenceService.listSites.mockResolvedValue({ records: [] });
  PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue({ records: [leg], total: 55 });
  PlaceIntelligenceService.getDeliveryLeg.mockResolvedValue({
    ...leg,
    samples: [{ autoTripId: 'trip1', registrationNumber: 'TRUCK1', km: 105 }],
  });
  PlaceIntelligenceService.reviewDeliveryLeg.mockResolvedValue({ ok: true });
});
const mount = (url = '/place-hub?tab=deliveries') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <DeliveryRoutes version={1} />
    </MemoryRouter>,
  );
it('filters deliveries and resets pagination', async () => {
  mount();
  await screen.findByRole('button', { name: 'Plant → Town' });
  expect(screen.getByText('Within 10%')).toBeTruthy();
  expect(PlaceIntelligenceService.listLegs).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Next Page' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Needs review' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, review: 'NEEDS_REVIEW' }),
      expect.anything(),
    ),
  );
});
it('opens linked leg samples and submits review with an optional note', async () => {
  mount('/place-hub?tab=deliveries&leg=leg1');
  expect((await screen.findByRole('link', { name: 'TRUCK1' })).getAttribute('href')).toBe(
    '/auto-trips/trip1',
  );
  fireEvent.change(screen.getByLabelText('Review note (optional)'), {
    target: { value: 'Confirmed delivery' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.reviewDeliveryLeg).toHaveBeenCalledWith(
      { id: 'leg1', status: 'ACCEPTED', note: 'Confirmed delivery' },
      expect.anything(),
    ),
  );
});
it('uses the server SAP verdict at a decimal tolerance boundary', async () => {
  PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue({
    rows: [
      {
        ...leg,
        km: { p50: 110.00000000000001 },
        sap: { sapKm: 100, tolerancePct: 10, oneWay: { verdict: 'WITHIN', actualKm: 110 } },
      },
    ],
    total: 1,
  });
  mount();
  expect(await screen.findByText('Within 10%')).toBeTruthy();
});
