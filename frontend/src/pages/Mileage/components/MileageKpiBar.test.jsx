import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import MileageKpiBar from './MileageKpiBar';
import { MileageApi } from '../mileageApi';

vi.mock('../mileageApi', () => ({
  MileageApi: { unifiedFeed: vi.fn(), modelComparison: vi.fn() },
}));

/**
 * The four figures at the top of the hub. A figure that is not there is a dash
 * with a plain reason beside it — never a zero that reads like a finding — and
 * the same wording wherever the tile is shown.
 */

const range = { from: '2026-10-01', to: '2026-10-30', manufacturer: '' };

const meta = (over = {}) => ({
  verified: 0,
  flagged: 0,
  unverified: 0,
  slipOnly: 0,
  totalSpendInr: 0,
  ...over,
});

const tile = (label) => screen.getByRole('region', { name: label });

describe('Mileage KPI bar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MileageApi.unifiedFeed.mockResolvedValue({ data: [], meta: meta() });
    MileageApi.modelComparison.mockResolvedValue({ data: [], meta: {} });
  });

  it('shows a dash and the reason when no bill has been uploaded', async () => {
    MileageApi.unifiedFeed.mockResolvedValue({ data: [], meta: meta({ unverified: 3 }) });
    render(<MileageKpiBar range={range} />);

    const diesel = await screen.findByRole('region', { name: 'Diesel bought' });
    await waitFor(() => expect(within(diesel).getByText('—')).toBeInTheDocument());
    expect(within(diesel).getByText('No bills uploaded in these dates')).toBeInTheDocument();

    const check = tile('Bills to check');
    expect(within(check).getByText('—')).toBeInTheDocument();
    expect(within(check).getByText('No bills to check yet')).toBeInTheDocument();
  });

  it('counts the bills when there are some', async () => {
    MileageApi.unifiedFeed.mockResolvedValue({
      data: [],
      meta: meta({ verified: 4, flagged: 2, unverified: 1, totalSpendInr: 114000 }),
    });
    render(<MileageKpiBar range={range} />);

    const diesel = await screen.findByRole('region', { name: 'Diesel bought' });
    await waitFor(() => expect(within(diesel).getByText('6 bills')).toBeInTheDocument());
  });

  it('uses one wording for the missing fill-to-fill figure on every tab', async () => {
    const first = render(<MileageKpiBar range={range} showFleetKmLHint />);
    expect(await screen.findByText('No full-tank rounds in these dates')).toBeInTheDocument();
    first.unmount();

    render(<MileageKpiBar range={range} showFleetKmL />);
    expect(await screen.findByText('No full-tank rounds in these dates')).toBeInTheDocument();
  });
});
