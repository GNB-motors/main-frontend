import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import DeliveryRoutes from './DeliveryRoutes';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SapService from '../../../services/SapService';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../../utils/session';
vi.mock('../../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: vi.fn(),
}));
vi.mock('../../../services/SapService', () => ({ default: { hint: vi.fn(), setRoute: vi.fn() } }));
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
  fromSiteId: 'plant1',
  toSiteId: 'town1',
  fromName: 'Plant',
  toName: 'Town',
  n: 4,
  trucks: 2,
  km: { p50: 105, p90: 115 },
  sap: {
    sapKm: 100,
    basis: 'ONE_WAY',
    tolerancePct: 10,
    comparison: { sapKm: 100, actualKm: 105, deltaPct: 5, verdict: 'WITHIN' },
  },
  review: 'NEEDS_REVIEW',
};
beforeEach(() => {
  vi.clearAllMocks();
  getUserRole.mockReturnValue('OWNER');
  useFeatureFlags.mockReturnValue({ isEnabled: () => true, ready: true });
  SapService.hint.mockResolvedValue({ shortestOneWayKm: null });
  SapService.setRoute.mockResolvedValue({});
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
  fireEvent.click(await screen.findByRole('button', { name: 'Trips', exact: true }));
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
it("uses the route's own SAP verdict, at a decimal tolerance boundary too", async () => {
  PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue({
    rows: [
      {
        ...leg,
        km: { p50: 110.00000000000001 },
        sap: {
          sapKm: 100,
          basis: 'ONE_WAY',
          tolerancePct: 10,
          comparison: { verdict: 'WITHIN', actualKm: 110 },
        },
      },
    ],
    total: 1,
  });
  mount();
  expect(await screen.findByText('Within 10%')).toBeTruthy();
});

it('saves the selected route SAP and refreshes both the list and detail', async () => {
  mount('/place-hub?tab=routes&routeView=deliveries&delivery=leg1');
  fireEvent.click(await screen.findByRole('button', { name: 'Edit SAP distance' }));
  fireEvent.change(screen.getByLabelText('SAP km'), { target: { value: '150' } });
  const updated = {
    ...leg,
    sap: { ...leg.sap, sapKm: 150, comparison: { verdict: 'UNDER', actualKm: 105, deltaKm: -45 } },
    samples: [],
  };
  SapService.setRoute.mockImplementation(async () => {
    PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue({ rows: [updated], total: 1 });
    PlaceIntelligenceService.getDeliveryLeg.mockResolvedValue(updated);
    return {};
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save SAP', exact: true }));
  await waitFor(() =>
    expect(SapService.setRoute).toHaveBeenCalledWith(
      expect.objectContaining({ fromSiteId: 'plant1', toSiteId: 'town1', sapKm: 150 }),
      expect.anything(),
    ),
  );
  await waitFor(() => expect(screen.getAllByText('150 km').length).toBeGreaterThanOrEqual(2));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('hides SAP management and fields when the organization entitlement is off', async () => {
  useFeatureFlags.mockReturnValue({ isEnabled: (key) => key !== 'sapV2', ready: true });
  mount();
  await screen.findByRole('button', { name: 'Plant → Town' });
  expect(screen.queryByRole('columnheader', { name: 'Agreed SAP' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'New route' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Filter SAP status')).not.toBeInTheDocument();
  expect(SapService.hint).not.toHaveBeenCalled();
});
it('keeps a configured route visible before its first trip', async () => {
  const configured = { ...leg, n: 0, samples: [], km: { p50: null, n: 0 } };
  PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue({ rows: [configured], total: 1 });
  PlaceIntelligenceService.getDeliveryLeg.mockResolvedValue(configured);
  mount('/place-hub?tab=routes&routeView=deliveries&delivery=leg1');
  expect(await screen.findByText('Configured route · no trips yet')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit SAP distance' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Trips', exact: true }));
  expect(
    screen.getByText('No trips yet. This configured route and its SAP remain available.'),
  ).toBeInTheDocument();
});
