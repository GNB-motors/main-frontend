import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FuelInsightPage from './FuelInsightPage';

vi.mock('@/hooks/usePageLayout', () => ({ useFullPageLayout: () => {} }));
vi.mock('../Intelligence/IntelligenceFilters', () => ({
  default: ({ showDriver }) => <p>filters driver:{String(showDriver)}</p>,
}));
vi.mock('../Intelligence/IntelligencePeriodPicker', () => ({ default: () => <p>period</p> }));
const tabProbe = (name) => ({
  default: (props) => (
    <p>
      {name} {props.vehicle} {props.from}→{props.to} driver:{String(props.driver)}
    </p>
  ),
});
vi.mock('../Intelligence/IdlingTab', () => tabProbe('idling-tab'));
vi.mock('../Intelligence/FuelRiskTab', () => tabProbe('fuel-tab'));

const renderAt = (tab, url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="*" element={<FuelInsightPage tab={tab} />} />
      </Routes>
    </MemoryRouter>,
  );

describe('FuelInsightPage', () => {
  it('shows the Idling tab with the truck, driver and dates from the URL', async () => {
    renderAt('idling', '/idling?vehicle=WB11S6162&driver=d1&from=2026-11-23&to=2026-11-23');
    expect(screen.getByRole('heading', { name: 'Idling' })).toBeInTheDocument();
    expect(
      await screen.findByText('idling-tab WB11S6162 2026-11-23→2026-11-23 driver:d1'),
    ).toBeInTheDocument();
    expect(screen.getByText('filters driver:true')).toBeInTheDocument();
  });

  it('shows Fuel checks', async () => {
    renderAt('fuel', '/fuel-checks');
    expect(screen.getByRole('heading', { name: 'Fuel checks' })).toBeInTheDocument();
    expect(await screen.findByText(/fuel-tab/)).toBeInTheDocument();
  });
});
