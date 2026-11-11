import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import DeliveryRoutesPanel from './DeliveryRoutesPanel';
import DeliveryRouteDetail from '../intelligence/DeliveryRouteDetail';
import useDeliveryRouteMap from '../page/useDeliveryRouteMap';
import PlaceIntelligenceService from '../intelligence/PlaceIntelligenceService';
import SapService from '../../../services/SapService';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../../utils/session';

vi.mock('../../../contexts/FeatureFlagsContext', () => ({ useFeatureFlags: vi.fn() }));
vi.mock('../../../services/SapService', () => ({ default: { hint: vi.fn(), setRoute: vi.fn() } }));
vi.mock('../../../utils/session', () => ({ getUserRole: vi.fn(), getPref: () => null }));
vi.mock('../intelligence/PlaceIntelligenceService', () => ({
  default: { listDeliveryLegs: vi.fn(), getDeliveryLeg: vi.fn(), reviewDeliveryLeg: vi.fn() },
}));

const leg = {
  _id: 'leg1',
  fromSiteId: 'plant1',
  toSiteId: 'town1',
  fromName: 'Plant',
  toName: 'Town',
  fromPosition: { lat: 22.5, lng: 88.1 },
  toPosition: { lat: 22.1, lng: 87.6 },
  n: 4,
  trucks: 2,
  km: { p50: 125, p90: 140, n: 4 },
  minutes: { p50: 240 },
  sap: {
    sapKm: 100,
    basis: 'ONE_WAY',
    tolerancePct: 10,
    comparison: { actualKm: 125, deltaKm: 25, verdict: 'OVER' },
  },
  review: 'AUTO',
};
const other = {
  ...leg,
  _id: 'leg2',
  toSiteId: 'port1',
  toName: 'Port',
  n: 40,
  sap: undefined,
};
const page = (rows) => ({
  rows,
  total: rows.length,
  page: 1,
  limit: 200,
  totals: {
    routes: rows.length,
    trips: rows.reduce((a, r) => a + r.n, 0),
    over: rows.filter((r) => r.sap?.comparison?.verdict === 'OVER').length,
    withoutSap: rows.filter((r) => !r.sap).length,
  },
});

function Harness() {
  const [params, setParams] = useSearchParams();
  const d = useDeliveryRouteMap({
    enabled: true,
    version: 0,
    params,
    setParams,
    siteOf: () => null,
  });
  return (
    <>
      <DeliveryRoutesPanel d={d} />
      {d.selected && (
        <DeliveryRouteDetail
          id={d.selected._id}
          leg={d.selected}
          sites={d.sites}
          version="0"
          showSap={d.showSap}
          onChanged={d.refresh}
          onClose={() => d.pick(null)}
        />
      )}
    </>
  );
}
const mount = (url = '/place-hub?tab=routes') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Harness />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  getUserRole.mockReturnValue('OWNER');
  useFeatureFlags.mockReturnValue({ isEnabled: () => true, ready: true });
  SapService.hint.mockResolvedValue({ shortestOneWayKm: null });
  SapService.setRoute.mockResolvedValue({});
  PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue(page([leg, other]));
  PlaceIntelligenceService.getDeliveryLeg.mockResolvedValue({
    ...leg,
    samples: [{ autoTripId: 'trip1', registrationNumber: 'TRUCK1', km: 124 }],
  });
  PlaceIntelligenceService.reviewDeliveryLeg.mockResolvedValue({ ok: true });
});

it('loads every route with its map path, sorted by trips, with SAP verdicts and deltas', async () => {
  mount();
  await screen.findByRole('button', { name: 'Plant → Town' });
  expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenCalledWith(
    expect.objectContaining({ includeMap: true, page: 1, limit: 200 }),
    expect.anything(),
  );
  const rows = screen.getAllByRole('button', { name: /^Plant → / });
  expect(rows.map((r) => r.getAttribute('aria-label'))).toEqual(['Plant → Port', 'Plant → Town']);
  expect(screen.getByText('+25 km over')).toBeInTheDocument();
  expect(screen.getByText('No SAP', { selector: '.ph-delivery-tag' })).toBeInTheDocument();
  expect(screen.getByText('2 routes · 44 trips')).toBeInTheDocument();
});

it('sends search, review and SAP filters to the list API', async () => {
  mount();
  await screen.findByRole('button', { name: 'Plant → Town' });
  fireEvent.click(screen.getByRole('button', { name: 'Needs review' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenLastCalledWith(
      expect.objectContaining({ review: 'NEEDS_REVIEW' }),
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Over SAP' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenLastCalledWith(
      expect.objectContaining({ review: undefined, sapStatus: 'OVER' }),
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Show rejected routes' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenLastCalledWith(
      expect.objectContaining({ review: 'REJECTED', sapStatus: undefined }),
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Rejected routes, show usual routes' }));
  await waitFor(() =>
    expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenLastCalledWith(
      expect.objectContaining({ review: undefined }),
      expect.anything(),
    ),
  );
  fireEvent.change(screen.getByLabelText('Search deliveries'), { target: { value: 'town' } });
  await waitFor(() =>
    expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'town' }),
      expect.anything(),
    ),
  );
});

it('opens a route in the drawer with trips, links and a review note', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Plant → Town' }));
  expect(await screen.findByText('4 trips · 2 trucks · long trips 140 km')).toBeInTheDocument();
  expect((await screen.findByRole('link', { name: 'TRUCK1' })).getAttribute('href')).toBe(
    '/auto-trips/trip1',
  );
  expect(screen.getByText('+25 km (+25%) versus SAP · 10% tolerance')).toBeInTheDocument();
  expect(screen.getByText('4 trips · 2 trucks · long trips 140 km')).toBeInTheDocument();
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
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByText(/4 trips · 2 trucks/)).not.toBeInTheDocument());
});

it('opens a linked route outside the current filters', async () => {
  PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue(page([other]));
  mount('/place-hub?tab=routes&routeView=deliveries&delivery=leg1');
  expect(await screen.findByText('4 trips · 2 trucks · long trips 140 km')).toBeInTheDocument();
  expect(PlaceIntelligenceService.getDeliveryLeg).toHaveBeenCalledWith('leg1', expect.anything());
});

it('saves the selected route SAP and refreshes both the list and the drawer', async () => {
  mount('/place-hub?tab=routes&routeView=deliveries&delivery=leg1');
  fireEvent.click(await screen.findByRole('button', { name: 'Edit SAP distance' }));
  fireEvent.change(screen.getByLabelText('SAP km'), { target: { value: '150' } });
  const updated = {
    ...leg,
    sap: { ...leg.sap, sapKm: 150, comparison: { verdict: 'UNDER', actualKm: 125, deltaKm: -25 } },
    samples: [],
  };
  SapService.setRoute.mockImplementation(async () => {
    PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue(page([updated, other]));
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
  // Drawer shows the new SAP and the list tag flips from over to under.
  expect(await screen.findByText('150 km')).toBeInTheDocument();
  expect(await screen.findByText('−25 km under')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('hides SAP management and fields when the organization entitlement is off', async () => {
  useFeatureFlags.mockReturnValue({ isEnabled: (key) => key !== 'sapV2', ready: true });
  mount();
  await screen.findByRole('button', { name: 'Plant → Town' });
  expect(screen.queryByRole('button', { name: 'New route' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Over SAP' })).not.toBeInTheDocument();
  expect(screen.queryByText('No SAP')).not.toBeInTheDocument();
  expect(PlaceIntelligenceService.listDeliveryLegs).toHaveBeenCalledWith(
    expect.not.objectContaining({ sapStatus: expect.anything() }),
    expect.anything(),
  );
});

it('keeps a configured route visible before its first trip', async () => {
  const configured = { ...leg, n: 0, trucks: 0, samples: [], km: { p50: null, n: 0 } };
  PlaceIntelligenceService.listDeliveryLegs.mockResolvedValue(page([configured]));
  PlaceIntelligenceService.getDeliveryLeg.mockResolvedValue(configured);
  mount('/place-hub?tab=routes&routeView=deliveries&delivery=leg1');
  expect(await screen.findByText('Awaiting first trip')).toBeInTheDocument();
  expect(await screen.findByText('Configured route · no trips yet')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit SAP distance' })).toBeInTheDocument();
  expect(
    screen.getByText('No trips yet. This configured route and its SAP remain available.'),
  ).toBeInTheDocument();
});
