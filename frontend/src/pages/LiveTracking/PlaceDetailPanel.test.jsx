import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlaceDetailPanel from './PlaceDetailPanel.jsx';

const place = {
  id: 'site:s1',
  name: 'Kolaghat Plant',
  type: 'PLANT',
  lat: 22.5,
  lng: 88.3,
  radiusM: 300,
  polygon: null,
  subtitle: 'Kolaghat',
};

describe('Place detail in the Places tab', () => {
  it('lists the trucks inside the place, opens one, and links to Place Hub', () => {
    const onPick = vi.fn();
    render(
      <MemoryRouter>
        <PlaceDetailPanel
          place={place}
          vehicles={[
            {
              id: 'v1',
              plate: 'WB01AB1234',
              status: 'idling',
              hasFix: true,
              hasGpsFix: true,
              lat: 22.5,
              lng: 88.3,
              ago: 4,
            },
            {
              id: 'v2',
              plate: 'WB02CD5678',
              status: 'moving',
              hasFix: true,
              hasGpsFix: true,
              lat: 23.5,
              lng: 88.3,
            },
            {
              id: 'offline',
              plate: 'OFFLINE',
              status: 'offline',
              hasFix: true,
              hasGpsFix: false,
              lat: 22.5,
              lng: 88.3,
            },
          ]}
          onBack={() => {}}
          onPickVehicle={onPick}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Vehicles here now · 1/)).toBeTruthy();
    expect(screen.queryByText('OFFLINE')).toBeNull();
    expect(screen.getByText('Last report 4 min ago')).toBeTruthy();
    expect(screen.queryByText('here 4 min')).toBeNull();
    fireEvent.click(screen.getByText('WB01AB1234'));
    expect(onPick).toHaveBeenCalledWith('v1');
    // The redesign moves place editing behind one plain link (F1.7).
    expect(screen.getByText('Manage places →').getAttribute('href')).toBe('/place-hub');
  });

  it('renders nothing open when no place is picked', () => {
    const { container } = render(
      <MemoryRouter>
        <PlaceDetailPanel place={null} vehicles={[]} onBack={() => {}} onPickVehicle={() => {}} />
      </MemoryRouter>,
    );
    expect(container.querySelector('.railview--detail.open')).toBeNull();
  });
});
