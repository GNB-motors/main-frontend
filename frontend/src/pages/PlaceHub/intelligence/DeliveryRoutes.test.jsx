import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import RoutesTab from './RoutesTab';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import { getUserRole } from '../../../utils/session';
const flags = vi.hoisted(() => ({ enabled: false }));
vi.mock('../../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ isEnabled: () => flags.enabled }),
}));
vi.mock('../../../utils/session', () => ({ getUserRole: vi.fn() }));
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
  flags.enabled = false;
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
const mount = (url = '/place-hub?tab=routes') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <RoutesTab version={1} />
    </MemoryRouter>,
  );
it('keeps old routes and never requests deliveries when the flag is off', async () => {
  mount();
  await screen.findByText('No routes learned yet');
  expect(PlaceIntelligenceService.listDeliveryLegs).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Deliveries' })).toBeNull();
});
it('defaults to deliveries, filters and resets pagination, and preserves all movements', async () => {
  flags.enabled = true;
  mount();
  await screen.findByRole('button', { name: 'Plant → Town' });
  expect(screen.getByText('Within 10%')).toBeTruthy();
  expect(PlaceIntelligenceService.listLegs).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
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
  fireEvent.click(screen.getByRole('button', { name: 'All movements' }));
  await screen.findByText('No routes learned yet');
  expect(PlaceIntelligenceService.listLegs).toHaveBeenCalled();
});
it('opens linked leg samples and submits review with an optional note', async () => {
  flags.enabled = true;
  mount('/place-hub?tab=routes&leg=leg1');
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
  flags.enabled = true;
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
