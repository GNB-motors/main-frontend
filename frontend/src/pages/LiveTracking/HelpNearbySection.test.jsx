import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelpNearbySection from './HelpNearbySection';

const nearby = {
  id: 'poi-303',
  kind: 'POI',
  name: 'Buxar Service Centre',
  category: 'HOSPITAL',
  lat: 25.57,
  lng: 83.98,
  radiusM: null,
  layer: 'hospitals',
  phone: '0612422002',
  distanceKm: 4.2,
  brand: null,
};

describe('HelpNearbySection', () => {
  it('shows who can help and how far away they are', () => {
    render(<HelpNearbySection nearbyHelp={[nearby]} />);
    expect(screen.getByText('Buxar Service Centre')).toBeInTheDocument();
    expect(screen.getByText('4.2 km')).toBeInTheDocument();
  });

  it('offers to call the place', () => {
    render(<HelpNearbySection nearbyHelp={[nearby]} />);
    expect(screen.getByRole('link', { name: 'Call Buxar Service Centre' })).toHaveAttribute(
      'href',
      'tel:0612422002',
    );
  });

  it('shows nothing at all when there is no help nearby', () => {
    const { container } = render(<HelpNearbySection nearbyHelp={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
