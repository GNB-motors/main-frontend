import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import FleetLink from './FleetLink';

describe('fleet report shortcuts', () => {
  it('opens the operational trip page instead of the public trips landing page', () => {
    render(
      <MemoryRouter initialEntries={['/digest']}>
        <Routes>
          <Route path="/digest" element={<FleetLink to="/trips">View trips</FleetLink>} />
          <Route path="/auto-trips" element={<h1>Operational trips</h1>} />
          <Route path="/trips" element={<h1>Marketing landing page</h1>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'View trips' }));
    expect(screen.getByRole('heading', { name: 'Operational trips' })).toBeInTheDocument();
    expect(screen.queryByText('Marketing landing page')).not.toBeInTheDocument();
  });

  it('keeps unavailable content readable without a misleading navigation action', () => {
    render(<FleetLink to="/">Fuel consumption</FleetLink>);
    expect(screen.getByText('Fuel consumption')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('removes optional View shortcuts that have no operational destination', () => {
    const { container } = render(
      <FleetLink to="/missing-report" hideUnavailable>
        View
      </FleetLink>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
