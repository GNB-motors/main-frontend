import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
vi.mock('../../utils/session', async (original) => ({ ...await original(), getUserRole: () => 'OWNER' }));
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
vi.mock('./useTrackReviewQueue.js', () => ({ default: () => ({
  items: [{ _id: 'cached-review', centroidLat: 22.5, centroidLng: 88.3 }],
  count: 1, reload: vi.fn(),
}) }));
vi.mock('../../hooks/useLiveIdling.js', () => ({ useLiveIdling: () => ({
  idling: [{ registrationNumber: 'TEST01', lat: 22.5, lng: 88.3 }], error: null,
}) }));
import { writeLayerSelection } from './trackLegendPrefs';
import { defaultLayerSelection } from './trackLegendModel';
import LiveTrackingPage from './LiveTrackingPage';

describe('LiveTrackingPage master data', () => {
  const reviewSite = { _id:'review-1', name:'Place to confirm', status:'PROPOSED', centroidLat:22.5,centroidLng:88.3 };
  const renderPlaces = () => render(<MemoryRouter initialEntries={['/live-tracking?view=places']}><LiveTrackingPage /></MemoryRouter>);

  it('removes cached live layers on every off toggle and restores them when enabled', () => {
    writeLayerSelection(defaultLayerSelection());
    const view = renderPlaces();
    for (const [label, mapProp] of [['Places to confirm', 'reviewItems'], ['Trucks idling now', 'idlingRows']]) {
      const row = screen.getByRole('button', { name: new RegExp(label) });
      expect(row).toHaveClass('lt-place-layer-row');
      expect(row).toHaveAttribute('aria-pressed', 'false');
      expect(seen.map[mapProp]).toEqual([]);
      for (let cycle = 0; cycle < 2; cycle++) {
        fireEvent.click(row);
        expect(row).toHaveAttribute('aria-pressed', 'true');
        expect(row.querySelector('.lt-place-layer-check svg')).not.toBeNull();
        expect(seen.map[mapProp]).toHaveLength(1);
        fireEvent.click(row);
        expect(row).toHaveAttribute('aria-pressed', 'false');
        expect(row.querySelector('.lt-place-layer-check svg')).toBeNull();
        expect(seen.map[mapProp]).toEqual([]);
      }
    }
    view.unmount();
  });

  it('exits place confirmation by back, close and Escape without submitting an answer', () => {
    const view=renderPlaces();
    for(const method of ['back','close','escape']) {
      act(()=>seen.map.onSelectReviewSite(reviewSite));
      expect(screen.getByLabelText('Place confirmation')).toBeInTheDocument();
      if(method==='escape')fireEvent.keyDown(window,{key:'Escape'});
      else fireEvent.click(screen.getByRole('button',{name:method==='back'?'Back to places':'Close place confirmation'}));
      expect(screen.queryByLabelText('Place confirmation')).not.toBeInTheDocument();
    }
    view.unmount();
  });

  it('returns from fence editing to the same place when cancelled', () => {
    const view=renderPlaces();
    act(()=>seen.map.onSelectReviewSite(reviewSite));
    fireEvent.click(screen.getByRole('button',{name:'Edit fence'}));
    expect(screen.getByRole('dialog',{name:'Alert zone here'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Back to place'}));
    expect(screen.queryByRole('dialog',{name:'Alert zone here'})).not.toBeInTheDocument();
    expect(screen.getByLabelText('Place confirmation')).toHaveTextContent('Place to confirm');
    fireEvent.click(screen.getByRole('button',{name:'Edit fence'}));
    fireEvent.keyDown(screen.getByRole('button',{name:'Back to place'}),{key:'Escape'});
    expect(screen.getByLabelText('Place confirmation')).toBeInTheDocument();
    view.unmount();
  });

  it('does not leave a review panel over the route list after switching tabs', () => {
    const view=renderPlaces();
    act(()=>seen.map.onSelectReviewSite(reviewSite));
    fireEvent.click(screen.getByRole('tab',{name:'Routes'}));
    expect(screen.queryByLabelText('Place confirmation')).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:/Plant → Depot/})).toBeInTheDocument();
    view.unmount();
  });
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
