import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportCardDrawer from './ReportCardDrawer';

const vehicleCard = {
  id: 'WB11F6762',
  subject: 'vehicle',
  name: 'WB11F6762',
  make: 'Tata',
  grade: 'EXCELLENT',
  score: 88,
  headline: 'Best km/L in the fleet this week',
  strengths: [{ key: 'cruise', tone: 'good', label: 'Steady cruise', why: { text: 'Held 60 km/h.' }, link: null }],
  problems: [],
  basis: { text: 'From the truck\'s own reports.', basis: '1,240 km · 9 trips' },
};

const driverCard = {
  id: 'drv-441',
  subject: 'driver',
  name: 'Ramesh Yadav',
  grade: 'GOOD',
  score: 76,
  headline: 'Drives steadily and rarely idles',
  strengths: [{ key: 'gear', tone: 'good', label: 'Right gear', why: { text: 'Changes gear early.' }, link: null }],
  problems: [],
  basis: { text: 'From the driver\'s own trips.', basis: '9 trips' },
};

describe('ReportCardDrawer', () => {
  it('shows the whole card of a truck', () => {
    render(
      <MemoryRouter>
        <ReportCardDrawer card={vehicleCard} open onOpenChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('WB11F6762')).toBeInTheDocument();
    expect(screen.getByText('Best km/L in the fleet this week')).toBeInTheDocument();
    expect(screen.getByText('Steady cruise')).toBeInTheDocument();
    expect(screen.getByText('1,240 km · 9 trips')).toBeInTheDocument();
  });

  it('sends the owner to the map and to the idling of that truck', () => {
    render(
      <MemoryRouter>
        <ReportCardDrawer card={vehicleCard} open onOpenChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'See on map' })).toHaveAttribute(
      'href',
      expect.stringContaining('/live-tracking'),
    );
    expect(screen.getByRole('link', { name: 'See all its idling' })).toHaveAttribute(
      'href',
      '/intelligence?tab=idling&vehicle=WB11F6762',
    );
  });

  it('offers the driver a reward that does not work yet', () => {
    render(
      <MemoryRouter>
        <ReportCardDrawer card={driverCard} open onOpenChange={vi.fn()} />
      </MemoryRouter>,
    );

    const reward = screen.getByRole('button', { name: /Reward this driver/ });
    expect(reward).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('link', { name: 'See on map' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all their idling' })).toHaveAttribute(
      'href',
      '/intelligence?tab=idling&driver=drv-441',
    );
  });

  it('shows nothing when there is no card', () => {
    const { container } = render(
      <MemoryRouter>
        <ReportCardDrawer card={null} open={false} onOpenChange={vi.fn()} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
