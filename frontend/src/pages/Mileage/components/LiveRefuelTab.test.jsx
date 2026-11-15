import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LiveRefuelTab from './LiveRefuelTab';
import { MileageApi } from '../mileageApi';

vi.mock('../mileageApi', () => ({
  MileageApi: { unifiedFeed: vi.fn(), pumpOptions: vi.fn(), savePump: vi.fn() },
}));
vi.mock('../../../utils/session', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserRole: () => 'OWNER',
}));
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: false, loadError: new Error('Offline') }),
  GoogleMap: () => null,
  MarkerF: () => null,
}));

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
    MileageApi.pumpOptions.mockResolvedValue({
      coords: { lat: 22.57, lng: 88.36 },
      savedPumps: [],
      linkedPlace: null,
      bill: { id: 'b1', stationName: 'Gabru Fuel Centre', address: 'NH 14' },
      suggestions: [{ id: 'bill:b1', source: 'BILL', billId: 'b1', name: 'Gabru Fuel Centre' }],
    });
    MileageApi.savePump.mockResolvedValue({
      place: { id: 's1', hubId: 'site:s1', name: 'Gabru Fuel Centre', siteType: 'FUEL_PUMP' },
    });
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

  it('uses a suggested bill name only after explicit save, then refetches', async () => {
    renderTab();
    expect(await screen.findByText('Unknown pump')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save pump' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('Suggested names');
    expect(MileageApi.savePump).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('button', { name: 'Save as new pump' })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Use name' }));
    expect(within(dialog).getByLabelText('Pump name')).toHaveValue('Gabru Fuel Centre');
    expect(MileageApi.savePump).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save as new pump' }));
    await waitFor(() =>
      expect(MileageApi.savePump).toHaveBeenCalledWith('f1', {
        create: true,
        name: 'Gabru Fuel Centre',
        source: 'BILL',
        billId: 'b1',
      }),
    );
    await screen.findByText('Saved pump: Gabru Fuel Centre');
    expect(MileageApi.unifiedFeed).toHaveBeenCalledTimes(2);
  });
  it('preserves an existing pump name when the linked bill disagrees', async () => {
    const place = { id: 's1', hubId: 'site:s1', name: 'My Pump', siteType: 'FUEL_PUMP' };
    MileageApi.unifiedFeed.mockResolvedValue({ data: [fill({ place })], meta: META });
    MileageApi.pumpOptions.mockResolvedValue({
      coords: { lat: 22.57, lng: 88.36 },
      linkedPlace: place,
      savedPumps: [{ ...place, distanceM: 0 }],
      bill: { stationName: 'Different bill name' },
      suggestions: [{ id: 'b', source: 'BILL', name: 'Different bill name' }],
    });
    renderTab();
    fireEvent.click(await screen.findByRole('button', { name: 'View pump' }));
    const input = await screen.findByLabelText('Pump name');
    expect(input).toHaveValue('My Pump');
    expect(input).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: 'Use name' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Use this pump' }));
    await waitFor(() =>
      expect(MileageApi.savePump).toHaveBeenCalledWith('f1', { siteId: 's1', source: 'EXISTING' }),
    );
  });
  it('keeps a typed name and shows the error if the server rejects the save', async () => {
    MileageApi.savePump.mockRejectedValue({
      response: { data: { message: 'A saved pump already covers this location.' } },
    });
    renderTab();
    fireEvent.click(await screen.findByRole('button', { name: 'Save pump' }));
    const input = await screen.findByLabelText('Pump name');
    fireEvent.change(input, { target: { value: 'My new name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save as new pump' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already covers');
    expect(screen.getByLabelText('Pump name')).toHaveValue('My new name');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
