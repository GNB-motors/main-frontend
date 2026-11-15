import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

vi.mock('./LocationSwitcher.jsx', () => ({ default: () => null }));
vi.mock('./NotificationBell.jsx', () => ({ default: () => null }));
vi.mock('./FleetLinkIndicator.jsx', () => ({ default: () => null }));
vi.mock('./SupportButton.jsx', () => ({ default: () => null }));
vi.mock('../utils/colorTheme', () => ({ applyThemeToRoot: vi.fn() }));

describe('fuel-entry navigation', () => {
  it('shows a useful title without a second create button on the entry form', () => {
    render(
      <MemoryRouter initialEntries={['/mileage-tracking/new']}>
        <Navbar />
      </MemoryRouter>,
    );
    expect(screen.getByText('Add diesel fill')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Log Fuel/ })).not.toBeInTheDocument();
  });
  it('keeps the create action available on the legacy listing', () => {
    render(
      <MemoryRouter initialEntries={['/mileage-tracking']}>
        <Navbar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /Log Fuel/ })).toBeInTheDocument();
  });
});
