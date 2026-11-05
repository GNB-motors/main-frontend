import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LiveRefuelTab from './LiveRefuelTab';
import { MileageApi } from '../mileageApi';

vi.mock('../mileageApi', () => ({ MileageApi: { unifiedFeed: vi.fn() } }));

/**
 * The live fills table is the screen an owner looks at all day. It has to read
 * like a person wrote it: dates the way people say them, money only when a
 * bill is there, and a pump that can be named later.
 */

const RANGE = { from: '2026-10-01', to: '2026-11-04', manufacturer: '' };

const META = {
  total: 1,
  totalPages: 1,
  verified: 0,
  flagged: 0,
  unverified: 1,
  slipOnly: 0,
  sensorGlitch: 0,
};

const fill = (over = {}) => ({
  id: 'f1',
  vehicleNumber: 'WB25V8040',
  vehicleModel: 'Tata 407',
  at: '2026-11-03T22:21:00.000Z',
  verificationStatus: 'UNVERIFIED',
  litres: 120,
  slip: null,
  sensor: { litres: 120, rawLitres: 120, lat: 22.57, lng: 88.36 },
  ...over,
});

const renderTab = () =>
  render(
    <MemoryRouter>
      <LiveRefuelTab range={RANGE} />
    </MemoryRouter>,
  );

const headers = () =>
  Array.from(document.querySelectorAll('thead th')).map((th) => (th.textContent || '').trim());

describe('Live refuel tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MileageApi.unifiedFeed.mockResolvedValue({ data: [fill()], meta: META });
  });

  it('writes the date the way people read it', async () => {
    renderTab();
    expect(await screen.findByText(/^\d{1,2} \w{3}( \d{4})?, \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.queryByText(/2026-11-03T22:21/)).not.toBeInTheDocument();
  });

  it('asks for 25 fills at a time', async () => {
    renderTab();
    await screen.findByText('WB25V8040');
    expect(MileageApi.unifiedFeed).toHaveBeenCalledWith(
      RANGE,
      expect.objectContaining({ page: 1, limit: 25 }),
      expect.anything(),
    );
  });

  it('hides the money columns when no fill on the page has a bill', async () => {
    renderTab();
    await screen.findByText('WB25V8040');
    expect(headers()).not.toContain('Rate');
    expect(headers()).not.toContain('Amount');
    expect(headers()).toContain('Odometer');
  });

  it('keeps the money columns when a bill is there', async () => {
    MileageApi.unifiedFeed.mockResolvedValue({
      data: [
        fill({
          slip: {
            litres: 120,
            rate: 95,
            totalAmount: 11400,
            location: 'IOCL Dankuni',
            odometerReading: 4820,
          },
        }),
      ],
      meta: META,
    });
    renderTab();
    await screen.findByText('WB25V8040');
    expect(headers()).toContain('Rate');
    expect(headers()).toContain('Amount');
  });

  it('names an unknown pump and keeps the coordinates in the tip', async () => {
    renderTab();
    expect(await screen.findByText('Unknown pump')).toBeInTheDocument();
    expect(screen.getByTitle('Coordinates: 22.570, 88.360')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Name this pump' })).toHaveAttribute('href', '/place-hub');
  });
});
