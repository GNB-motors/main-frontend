import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, it, expect, beforeEach, describe } from 'vitest';
import DriverHomesView from './DriverHomesView';
import PlaceIntelligenceService from './PlaceIntelligenceService';

vi.mock('./PlaceMiniMap', () => ({ default: () => <div data-testid="mini-map">map</div> }));
vi.mock('./PlaceIntelligenceService', () => ({
  default: { listHomes: vi.fn(), decideHome: vi.fn() },
}));

const home = {
  _id: 'h1',
  driverId: 'driver-abc123',
  placeKey: 'site:xyz',
  orgSiteId: 'xyz',
  lat: 26.57,
  lng: 84.35,
  nights: 3,
  totalNights: 7,
  share: 0.43,
  q10: 0.25,
  distinctWeeks: null,
  status: 'PROPOSED',
};

beforeEach(() => {
  vi.clearAllMocks();
  PlaceIntelligenceService.listHomes.mockResolvedValue({
    items: [home],
    total: 1,
    page: 1,
    limit: 200,
  });
});

describe('DriverHomesView', () => {
  it('opens a modal with the map and facts when a driver is clicked', async () => {
    render(<DriverHomesView version={0} />);
    const trigger = await screen.findByRole('button', { name: /Driver abc123/ });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByTestId('mini-map')).toBeInTheDocument();
    expect(within(dialog).getByText('Overnights')).toBeInTheDocument();
    expect(within(dialog).getByText(/3 \/ 7/)).toBeInTheDocument();
  });
});
