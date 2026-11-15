import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReconciliationTab from './ReconciliationTab';
import { MileageApi } from '../mileageApi';

vi.mock('../mileageApi', () => ({ MileageApi: { billVsTank: vi.fn() } }));
vi.mock('@/components/ui/popover', async () => (await import('../../../test/baseUiStubs')).popover);
const range = { from: '2026-11-01', to: '2026-11-07' };

beforeEach(() => vi.clearAllMocks());

it('shows corrected sensor fill and the backend result, including unavailable comparisons', async () => {
  MileageApi.billVsTank.mockResolvedValue({
    data: {
      records: [
        {
          _id: 'f1',
          vehicleNumber: 'WB11T0662',
          billLitres: 100,
          telemetryLitres: 99,
          rawLitres: 91,
          varianceL: -1,
          status: 'CLEAN',
          billToleranceL: 25,
          billComparable: true,
        },
      ],
    },
    meta: { total: 1 },
  });
  const onOpen = vi.fn();
  render(<ReconciliationTab range={range} onOpenDrawer={onOpen} />);
  expect(await screen.findByText('WB11T0662')).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Corrected sensor fill' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Open bill for WB11T0662' }));
  expect(onOpen).toHaveBeenCalledWith(
    expect.objectContaining({
      result: 'BILL_MATCHES',
      varianceL: -1,
      sensor: expect.objectContaining({ litres: 99, rawLitres: 91 }),
      billCheck: expect.objectContaining({ toleranceL: 25, comparable: true }),
    }),
  );
  MileageApi.billVsTank.mockResolvedValue({
    data: {
      records: [
        { _id: 'f2', vehicleNumber: 'WB11T0663', status: 'UNAVAILABLE', billComparable: false },
      ],
    },
    meta: { total: 1 },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Comparison unavailable' }));
  await waitFor(() =>
    expect(MileageApi.billVsTank).toHaveBeenLastCalledWith(
      range,
      expect.objectContaining({ status: 'unavailable', page: 1 }),
      expect.any(AbortSignal),
    ),
  );
  expect(await screen.findByText('WB11T0663')).toBeInTheDocument();
  expect(screen.queryByText('WB11T0662')).not.toBeInTheDocument();
});
