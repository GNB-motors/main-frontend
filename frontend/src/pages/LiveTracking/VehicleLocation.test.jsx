import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { resolvePlace } from '../../services/PlaceService';
import VehicleLocation from './VehicleLocation.jsx';

vi.mock('../../services/PlaceService', () => ({ resolvePlace: vi.fn() }));

describe('Track location display', () => {
  it('uses the live address when available without another lookup', () => {
    render(<VehicleLocation vehicle={{ area: 'NH19, Dankuni, West Bengal' }} />);
    expect(screen.getByText('NH19, Dankuni, West Bengal')).toBeInTheDocument();
    expect(resolvePlace).not.toHaveBeenCalled();
  });
  it('resolves a GPS fix to a named place', async () => {
    resolvePlace.mockResolvedValue({ label: 'Near Dankuni', sub: 'West Bengal' });
    render(<VehicleLocation vehicle={{ hasFix: true, lat: 22.67, lng: 88.3 }} />);
    expect(await screen.findByText('Near Dankuni')).toBeInTheDocument();
    expect(screen.getByText('West Bengal')).toBeInTheDocument();
  });
  it('handles missing or invalid GPS coordinates', () => {
    render(<VehicleLocation vehicle={{ hasFix: true, lat: NaN, lng: 88.3 }} />);
    expect(screen.getByText('GPS position unavailable')).toBeInTheDocument();
  });
  it.each([
    ['moving', true],
    ['stopped', true],
    ['moving', false],
    ['stopped', false],
  ])('links an unnamed GPS position for a %s vehicle (showMap=%s)', async (status, showMap) => {
    resolvePlace.mockResolvedValue({
      label: 'Unmapped location',
      sub: 'No known place nearby',
      source: 'UNMAPPED',
    });
    render(
      <VehicleLocation
        vehicle={{ hasFix: true, lat: 22.67, lng: 88.3, status }}
        showMap={showMap}
      />,
    );
    expect(await screen.findByRole('link', { name: 'View current location' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=22.67,88.3',
    );
    expect(screen.queryByText('Unmapped location')).not.toBeInTheDocument();
    expect(screen.queryByText('No known place nearby')).not.toBeInTheDocument();
  });
  it('keeps map access when the name lookup fails', async () => {
    resolvePlace.mockResolvedValue(null);
    render(<VehicleLocation vehicle={{ hasFix: true, lat: 22.67, lng: 88.3 }} showMap />);
    expect(await screen.findByRole('link', { name: 'View current location' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=22.67,88.3',
    );
  });
  it('lets the fallback map link work without activating the fleet card', async () => {
    resolvePlace.mockResolvedValue(null);
    const activateCard = vi.fn();
    render(
      <div role="button" tabIndex={0} onClick={activateCard} onKeyDown={activateCard}>
        <VehicleLocation vehicle={{ hasFix: true, lat: 22.67, lng: 88.3 }} />
      </div>,
    );
    const link = await screen.findByRole('link', { name: 'View current location' });
    fireEvent.click(link);
    fireEvent.keyDown(link, { key: 'Enter' });
    expect(activateCard).not.toHaveBeenCalled();
    expect(link).toHaveAttribute('target', '_blank');
  });
});
