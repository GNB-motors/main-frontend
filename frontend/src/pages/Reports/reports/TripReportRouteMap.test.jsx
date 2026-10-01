import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { encodePolyline6 } from '../../../lib/polyline6';

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true, loadError: null }),
  GoogleMap: ({ children }) => <div data-testid="map">{children}</div>,
  Marker: () => <div data-testid="marker" />,
  PolylineF: ({ options }) => <div data-testid="poly" data-dashed={options.icons ? 'yes' : 'no'} />,
}));
vi.mock('../../LiveTracking/LiveTrackingService.jsx', () => ({
  LiveTrackingService: { getTrail: vi.fn() },
}));
vi.mock('../../../services/RoadService', () => ({ default: { getRoadTrailIfEnabled: vi.fn() } }));

import { LiveTrackingService } from '../../LiveTracking/LiveTrackingService.jsx';
import RoadService from '../../../services/RoadService';
import TripReportRouteMap from './TripReportRouteMap';

beforeEach(() => {
  globalThis.window.google = {
    maps: {
      Size: function Size() {},
      Point: function Point() {},
      LatLngBounds: function LatLngBounds() {
        this.extend = () => {};
      },
      SymbolPath: { CIRCLE: 0 },
    },
  };
});

const trip = { dispatchedAt: '2026-10-01T03:00:00Z', unloadedAt: '2026-10-01T09:00:00Z' };
const points = [0, 1].map((i) => ({
  latitude: 22 + i * 0.01,
  longitude: 88,
  eventDateTime: `2026-10-01T0${4 + i}:00:00Z`,
}));

describe('TripReportRouteMap (plan P4.11)', () => {
  it('draws the road and shows road km when the engine has the trail; never calls Google Directions', async () => {
    LiveTrackingService.getTrail.mockResolvedValue({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue({
      mode: 'MATCHED',
      calibrated: true,
      segments: [
        {
          kind: 'MATCHED',
          t0: 1,
          t1: 2,
          geom: encodePolyline6([
            { lat: 22, lng: 88 },
            { lat: 22.01, lng: 88 },
          ]),
        },
      ],
      distance: { roadM: 1500 },
    });
    render(<TripReportRouteMap startLoc="A" endLoc="B" vehicleReg="WB1" trip={trip} />);
    await waitFor(() => expect(screen.getByText('Road driven')).toBeInTheDocument());
    expect(screen.getByText('1.5 km')).toBeInTheDocument();
    expect(screen.getByText(/on roads/)).toBeInTheDocument();
    expect(screen.getAllByTestId('poly')).toHaveLength(1);
    expect(window.google.maps.DirectionsService).toBeUndefined();
  });

  it('without the engine it keeps the raw trail and labels a straight-line estimate', async () => {
    LiveTrackingService.getTrail.mockResolvedValue({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    render(<TripReportRouteMap startLoc="A" endLoc="B" vehicleReg="WB1" trip={trip} />);
    await waitFor(() => expect(screen.getByText('Actual GPS Trail')).toBeInTheDocument());
    expect(screen.getByText(/straight-line estimate/)).toBeInTheDocument();
  });

  it('no GPS: says so instead of drawing a planned route', async () => {
    LiveTrackingService.getTrail.mockResolvedValue({ points: [] });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    render(<TripReportRouteMap startLoc="A" endLoc="B" vehicleReg="WB1" trip={trip} />);
    await waitFor(() =>
      expect(screen.getByText('No GPS trail for this trip window')).toBeInTheDocument(),
    );
    expect(screen.queryAllByTestId('poly')).toHaveLength(0);
  });
});
