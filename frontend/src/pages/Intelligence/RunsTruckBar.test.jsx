import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RunsTruckBar from './RunsTruckBar';

const row = {
  registrationNumber: 'WB11L8862',
  loadedKm: 900,
  emptyKm: 300,
  repositionKm: 40,
  totalKm: 1240,
};

describe('RunsTruckBar', () => {
  it('says which truck it is and how far it went', () => {
    render(
      <MemoryRouter>
        <RunsTruckBar row={row} maxKm={1240} from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(screen.getByText('WB11L8862')).toBeInTheDocument();
    expect(screen.getByText('1,240 km')).toBeInTheDocument();
  });

  it('takes the owner to that truck on the map', () => {
    render(
      <MemoryRouter>
        <RunsTruckBar row={row} maxKm={1240} from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('/live-tracking?v=WB11L8862'),
    );
  });

  it('says what the three colours are worth', () => {
    render(
      <MemoryRouter>
        <RunsTruckBar row={row} maxKm={1240} from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', {
        name: 'WB11L8862, 1,240 km in total, 900 km loaded, 300 km empty, 40 km plant to plant',
      }),
    ).toBeInTheDocument();  });
});
