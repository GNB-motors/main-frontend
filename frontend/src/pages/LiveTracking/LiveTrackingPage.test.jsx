import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const { seen, pending } = vi.hoisted(() => ({
  seen: { signals: {} },
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
    getAssignments: vi.fn((_params, { signal } = {}) => {
      seen.signals.assignments = signal;
      return pending();
    }),
  },
}));

import LiveTrackingPage from './LiveTrackingPage';

describe('LiveTrackingPage master data', () => {
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
