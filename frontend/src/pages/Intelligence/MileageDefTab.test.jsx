import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./IntelligenceService', () => ({
  default: { getMileage: vi.fn() },
}));

import IntelligenceService from './IntelligenceService';
import MileageDefTab from './MileageDefTab';

const mileage = {
  items: [
    {
      registrationNumber: 'WB11F6762',
      driverName: 'Ramesh Yadav',
      km: 4200,
      dieselL: 1080,
      kmPerL: 3.9,
      usualKmPerL: 3.6,
      defL: 40,
      defPctOfDiesel: 3.7,
      defBand: { min: 3, max: 6 },
      verdict: 'ADDS_UP',
      verdictWhy: { text: 'The diesel matches the km at this truck’s usual km/L.' },
      source: 'SENSOR_ONLY',
    },
    {
      registrationNumber: 'WB11A1111',
      driverName: null,
      km: 3000,
      dieselL: 1150,
      kmPerL: 2.6,
      usualKmPerL: 3.4,
      defL: 4,
      defPctOfDiesel: 0.4,
      defBand: { min: 3, max: 6 },
      verdict: 'UNEXPLAINED',
      verdictWhy: { text: 'DEF use is far below the normal band.' },
      source: 'SENSOR_ONLY',
    },
  ],
  totals: { km: 7200, dieselL: 2230, defL: 44, kmPerL: 3.2 },
};

describe('MileageDefTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    IntelligenceService.getMileage.mockResolvedValue(mileage);
  });

  it('shows the best and the worst km/L', async () => {
    render(
      <MemoryRouter>
        <MileageDefTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    const best = (await screen.findByText('Best km/L')).closest('section');
    const worst = screen.getByText('Lowest km/L').closest('section');
    expect(within(best).getByText('3.9 km/L')).toBeInTheDocument();
    expect(within(worst).getByText('2.6 km/L')).toBeInTheDocument();
    expect(within(best).getByText('usual 3.6 km/L')).toBeInTheDocument();
  });

  it('shows the DEF readings outside the normal band', async () => {
    render(
      <MemoryRouter>
        <MileageDefTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('DEF use outside the normal band')).toBeInTheDocument();
    expect(screen.getByText('0.4% of diesel')).toBeInTheDocument();
    expect(screen.getByText('normal 3%–6%')).toBeInTheDocument();
    expect(screen.getByText('DEF use is far below the normal band.')).toBeInTheDocument();
  });

  it('says every reading was normal when they all are', async () => {
    IntelligenceService.getMileage.mockResolvedValue({ items: [mileage.items[0]] });

    render(
      <MemoryRouter>
        <MileageDefTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Every DEF reading of this period was inside the normal band.'),
    ).toBeInTheDocument();
  });

  it('ends with a way into the full Mileage page', async () => {
    render(
      <MemoryRouter>
        <MileageDefTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: /Open Mileage/ })).toHaveAttribute(
      'href',
      '/mileage?tab=live&subtab=completed',
    );
  });

  it('says the endpoint is still being built on a 404', async () => {
    IntelligenceService.getMileage.mockRejectedValue({ status: 404 });

    render(
      <MemoryRouter>
        <MileageDefTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/is being built/)).toBeInTheDocument());
  });
});
