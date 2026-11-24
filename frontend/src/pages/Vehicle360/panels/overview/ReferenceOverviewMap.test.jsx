import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import ReferenceOverviewMap from './ReferenceOverviewMap';

const { options, fit } = vi.hoisted(() => ({ options: vi.fn(), fit: vi.fn() }));
vi.mock('../../../../utils/googleMapsLoader', () => ({
  googleMapsLoaderOptions: { googleMapsApiKey: 'test-key' },
}));
vi.mock('../../../LiveTracking/mapPlotting', () => ({ fitMapToPositions: fit }));
vi.mock('@react-google-maps/api', async () => {
  const { useEffect } = await import('react');
  return {
    useLoadScript: () => ({ isLoaded: true }),
    GoogleMap({ children, onLoad, options: mapOptions }) {
      useEffect(() => {
        onLoad({});
      }, [onLoad]);
      options(mapOptions);
      return <div>{children}</div>;
    },
    MarkerF: ({ title, onClick }) => <button onClick={onClick}>{title}</button>,
    PolylineF: ({ path }) => <output aria-label="Route segment">{path.length}</output>,
  };
});

it('fits the recorded positions, labels stops and breaks the route at a data gap', () => {
  const points = [0, 1, 2, 3].map((hour) => ({
    lat: 23 + hour / 10,
    lng: 88,
    t: `2026-11-24T0${hour}:00:00.000Z`,
  }));
  render(
    <ReferenceOverviewMap
      track={{
        points,
        segments: [{ kind: 'GAP', fromT: points[1].t, toT: points[2].t }],
        stops: [
          { lat: 23.2, lng: 88, place: { id: 'plant', name: 'Dankuni Siding' } },
          { lat: 23.3, lng: 88, place: { locality: 'Panagarh', name: 'Unnamed place' } },
        ],
      }}
    />,
  );
  expect(screen.getAllByLabelText('Route segment').map((line) => line.textContent)).toEqual([
    '2',
    '2',
  ]);
  expect(options.mock.lastCall[0].styles).toEqual(
    expect.arrayContaining([expect.objectContaining({ featureType: 'road.highway' })]),
  );
  expect(fit).toHaveBeenLastCalledWith(
    expect.any(Object),
    expect.arrayContaining([
      { latitude: 23, longitude: 88 },
      { latitude: 23.3, longitude: 88 },
    ]),
  );
  expect(screen.getByRole('button', { name: 'Unnamed stop near Panagarh' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Dankuni Siding' }));
  expect(screen.getAllByText('Dankuni Siding')).toHaveLength(2);
});
