import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LaneFactsPanel from './LaneFactsPanel';
import TripDashboardService from '../TripDashboardService';
import { TollsService } from '../../../services/TollsService';

vi.mock('../TripDashboardService', () => ({
  default: { getCorridorStats: vi.fn(), getVehicleTours: vi.fn() },
}));
vi.mock('../../../services/TollsService', () => ({
  TollsService: { quote: vi.fn() },
}));

const data = {
  _id: 'trip-1',
  vehicleId: 'veh-1',
  pickupSiteId: { _id: 'site-1', name: 'Plant', centroidLat: 23.1, centroidLng: 85.2 },
  dropSiteId: { _id: 'site-2', name: 'Depot', centroidLat: 24.1, centroidLng: 86.2 },
};

beforeEach(() => {
  vi.clearAllMocks();
  TripDashboardService.getCorridorStats.mockResolvedValue({
    stats: { sampleSize: 12, median: 6.24, p90: 8.94 },
  });
  TripDashboardService.getVehicleTours.mockResolvedValue({ tours: [] });
});

describe('lane, toll and tour on the trip', () => {
  it('shows the usual lane time with one decimal', async () => {
    TollsService.quote.mockResolvedValue({
      boothCount: 2,
      totals: { multiaxle: { singleInr: 900, unknown: 0 } },
    });
    render(<LaneFactsPanel data={data} />);
    expect(await screen.findByText(/Usual on this lane: 6\.2 h \(slow days 8\.9 h\)/)).toBeInTheDocument();
    expect(await screen.findByText('Toll estimate: ₹900 across 2 plazas')).toBeInTheDocument();
  });

  it('says the toll is unavailable when the road engine fails — never ₹0', async () => {
    TollsService.quote.mockRejectedValue(new Error('Road engine is disabled'));
    render(<LaneFactsPanel data={data} />);
    expect(await screen.findByText('Toll estimate unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/₹0/)).not.toBeInTheDocument();
  });

  it('says there is no history when the lane has never been driven', async () => {
    TollsService.quote.mockResolvedValue(null);
    TripDashboardService.getCorridorStats.mockResolvedValue({ stats: { sampleSize: 0, median: null } });
    render(<LaneFactsPanel data={data} />);
    expect(await screen.findByText('No history on this lane yet')).toBeInTheDocument();
  });
});
