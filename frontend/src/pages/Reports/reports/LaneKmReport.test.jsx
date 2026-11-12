import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import LaneKmReport from './LaneKmReport';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../../utils/session';
vi.mock('../../../contexts/FeatureFlagsContext', () => ({ useFeatureFlags: vi.fn() }));
vi.mock('../../../utils/session', () => ({ getUserRole: vi.fn() }));
vi.mock('../../Sap/SapRoutes', () => ({ default: () => <p>Legacy SAP access</p> }));
function Destination() {
  return <p>{useLocation().search}</p>;
}
function mount(query) {
  return render(
    <MemoryRouter initialEntries={['/reports?report=laneKm' + query]}>
      <Routes>
        <Route path="/reports" element={<LaneKmReport />} />
        <Route path="/place-hub" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  getUserRole.mockReturnValue('OWNER');
  useFeatureFlags.mockReturnValue({ ready: true, isEnabled: () => true });
});
it('moves old SAP settings links to Routes while preserving their intent', async () => {
  mount('&sapTab=settings');
  expect(
    await screen.findByText('?tab=routes&routeView=deliveries&sapTab=settings'),
  ).toBeInTheDocument();
});
it('preserves monthly analysis intent', async () => {
  mount('&sapTab=month');
  expect(
    await screen.findByText('?tab=routes&routeView=deliveries&sapTab=month'),
  ).toBeInTheDocument();
});
it('preserves existing SAP access for organizations without the route feature', async () => {
  useFeatureFlags.mockReturnValue({ ready: true, isEnabled: (key) => key === 'sapV2' });
  mount('');
  expect(await screen.findByText('Legacy SAP access')).toBeInTheDocument();
});
