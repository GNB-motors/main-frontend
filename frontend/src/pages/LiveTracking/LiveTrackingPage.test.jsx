import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const { seen, pending } = vi.hoisted(() => ({
  seen: { signals: {}, map: null },
  pending: () => new Promise(() => {}),
}));

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: false, loadError: null }),
  GoogleMap: () => null,
  MarkerF: () => null,
  PolylineF: () => null,
}));
vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(pending), post: vi.fn(pending) },
}));
vi.mock('../../hooks/useLivePositions', () => ({
  useLivePositions: () => ({ positions: [], isLoading: false, refresh: vi.fn() }),
}));
vi.mock('../../hooks/useShareLink', () => ({
  useShareLink: () => ({ createAndCopy: vi.fn(), creating: false }),
}));
vi.mock('../../hooks/usePageLayout', () => ({ useFullPageLayout: () => {} }));
vi.mock('../../services/vehicleListService', () => ({
  getVehicleList: vi.fn(({ signal } = {}) => {
    seen.signals.vehicles = signal;
    return pending();
  }),
}));
vi.mock('../../services/DriverVehicleAssignmentService', () => ({
  default: {
    getAllActiveAssignments: vi.fn(({ signal } = {}) => {
      seen.signals.assignments = signal;
      return pending();
    }),
  },
}));

vi.mock('./LiveMapCanvas.jsx', () => ({ default: (props) => { seen.map = props; return null; } }));
vi.mock('./useTrackRoutes.js', () => ({ default: () => ({
  legs: [{ _id: 'route-a', title: 'Plant → Depot', fromSiteId: 'a', toSiteId: 'b', traversals: 4, path: { source: 'NONE' } }],
  lines: [], sites: new Map([['a', { name: 'Plant', lat: 22, lng: 88 }], ['b', { name: 'Depot', lat: 23, lng: 87 }]]),
  isLoading: false, error: null, reload: vi.fn(),
}) }));
import LiveTrackingPage from './LiveTrackingPage';

describe('LiveTrackingPage master data', () => {
  it('opens places from a direct link and returns to the live fleet', () => {
    const view = render(<MemoryRouter initialEntries={['/live-tracking?view=places']}><LiveTrackingPage /></MemoryRouter>);
    expect(screen.getByRole('region', { name: 'Map filters' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Fleet' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toll plazas/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Routes/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Routes' }));
    expect(screen.getByRole('tab', { name: 'Routes' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Routes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Places' }));
    expect(screen.getByRole('tab', { name: 'Places' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Live tracking' }));
    expect(screen.queryByRole('region', { name: 'Map filters' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fleet' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Places & routes' }));
    expect(screen.getByRole('region', { name: 'Map filters' })).toBeInTheDocument();
    view.unmount();
  });
  it('isolates a selected route and restores the overview on back', () => {
    const view = render(<MemoryRouter initialEntries={['/live-tracking?view=places']}><LiveTrackingPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('tab', { name: 'Routes' }));
    fireEvent.click(screen.getByRole('button', { name: /Plant → Depot/ }));
    expect(screen.getByRole('dialog', { name: 'Route detail' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Map filters' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search routes')).not.toBeInTheDocument();
    expect(seen.map.focusedRoute.id).toBe('route-a');
    for (const layer of ['places', 'extraPlaces', 'routeLines', 'reviewItems', 'tollPlazas', 'idlingRows', 'mapVehicles']) {
      expect(seen.map[layer]).toEqual([]);
    }
    fireEvent.click(screen.getByRole('button', { name: 'All routes' }));
    expect(screen.getByRole('button', { name: /Plant → Depot/ })).toBeInTheDocument();
    expect(seen.map.focusedRoute).toBeNull();
    view.unmount();
  });
  // Both loads used to keep running after the user left the page.
  it('aborts the vehicle list and assignment requests on unmount', () => {
    const view = render(
      <MemoryRouter>
        <LiveTrackingPage />
      </MemoryRouter>,
    );
    expect(seen.signals.vehicles?.aborted).toBe(false);
    expect(seen.signals.assignments?.aborted).toBe(false);
    view.unmount();
    expect(seen.signals.vehicles.aborted).toBe(true);
    expect(seen.signals.assignments.aborted).toBe(true);
  });
});
