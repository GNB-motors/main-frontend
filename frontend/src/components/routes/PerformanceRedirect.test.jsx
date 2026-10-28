import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const flagState = vi.hoisted(() => ({ on: false }));

vi.mock('../../contexts/FeatureFlagsContext.jsx', () => ({
  useFeatureFlags: () => ({
    isEnabled: (key) => flagState.on && key === 'performanceSection',
  }),
}));

import PerformanceRedirect from './PerformanceRedirect';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

const renderRedirect = ({ path = '/driving-dna', when } = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <Routes>
        <Route
          path="/driving-dna"
          element={
            <PerformanceRedirect to="/performance?tab=drivers" when={when}>
              <span>old driving dna page</span>
            </PerformanceRedirect>
          }
        />
        <Route
          path="/mileage"
          element={
            <PerformanceRedirect to="/performance?tab=vehicles" when={when}>
              <span>old mileage page</span>
            </PerformanceRedirect>
          }
        />
        <Route path="/performance" element={<span>new performance page</span>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  flagState.on = false;
});

describe('PerformanceRedirect', () => {
  it('leaves the old route untouched while the flag is off', () => {
    renderRedirect();
    expect(screen.getByText('old driving dna page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/driving-dna');
    expect(screen.queryByText('new performance page')).toBeNull();
  });

  it('forwards to the Performance page when the flag is on', async () => {
    flagState.on = true;
    renderRedirect();
    expect(await screen.findByText('new performance page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/performance?tab=drivers');
  });

  it('keeps the old page when the flag is on but the rule does not match', () => {
    flagState.on = true;
    renderRedirect({ path: '/mileage?tab=vehicles', when: (p) => p.get('tab') === 'performance' });
    expect(screen.getByText('old mileage page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/mileage?tab=vehicles');
  });

  it('forwards the mileage route when its own rule matches', async () => {
    flagState.on = true;
    renderRedirect({
      path: '/mileage?tab=performance',
      when: (p) => p.get('tab') === 'performance',
    });
    expect(await screen.findByText('new performance page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/performance?tab=vehicles');
  });
});
