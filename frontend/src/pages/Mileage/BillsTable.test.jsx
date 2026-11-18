import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BillsTable from './BillsTable';
import billPhotoService from '../../services/billPhotoService';

vi.mock('../../services/billPhotoService', () => ({
  default: {
    getBillSuggestion: vi.fn(),
    saveBillLinks: vi.fn(),
    listBillCaptures: vi.fn(),
    pairBills: vi.fn(),
    unpairBill: vi.fn(),
  },
}));

const NO_TIME_WORDS =
  "No time on the photo, so we can't tell which truck was at the pump. Pick the truck.";

describe('the bill row shows the date, the time and the reason', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billPhotoService.getBillSuggestion.mockResolvedValue({
      decision: 'ASK',
      askReason: 'NO_PLATE_DIGITS',
      candidates: [],
      why: { code: 'NO_PRINTED_TIME', text: 'the time could not be read', basis: '' },
      photo: { date: '2026-10-01', time: '12:01', timeSource: 'stamp' },
    });
  });

  it('shows the date and the time the photo carries, and where they came from', async () => {
    render(<BillsTable rows={[{ id: 'cap1', ocr: { litres: 180 } }]} />);
    await waitFor(() => expect(screen.getByText(/Time: 12:01/)).toBeInTheDocument());
    expect(screen.getByText(/Date: 1 Oct 2026/)).toBeInTheDocument();
    expect(screen.getByText(/from the photo stamp/)).toBeInTheDocument();
  });

  it('says in plain words that the photo carries no time', async () => {
    render(<BillsTable rows={[{ id: 'cap1', ocr: {} }]} />);
    await waitFor(() => expect(screen.getByText(NO_TIME_WORDS)).toBeInTheDocument());
  });

  it('keeps the date the paper printed when the photo has none of its own', () => {
    billPhotoService.getBillSuggestion.mockResolvedValue({
      decision: 'ASK',
      askReason: 'NO_PLATE_DIGITS',
      candidates: [],
      why: {
        code: 'NEAR_PUMP_AT_STAMP_TIME',
        text: 'The GPS put a truck near this pump.',
        basis: '',
      },
      photo: { date: null, time: null, timeSource: null },
    });
    render(
      <BillsTable
        rows={[
          {
            id: 'cap1',
            ocr: { printedDate: '2026-10-01', printedTime: '12:01' },
            suggestion: {
              decision: 'ASK',
              askReason: 'NO_PLATE_DIGITS',
              candidates: [],
              why: {
                code: 'NEAR_PUMP_AT_STAMP_TIME',
                text: 'The GPS put a truck near this pump.',
                basis: '',
              },
            },
          },
        ]}
      />,
    );
    expect(screen.getByText(/Date: 1 Oct 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Time: 12:01/)).toBeInTheDocument();
    expect(screen.queryByText(/from the photo stamp/)).not.toBeInTheDocument();
  });

  it('says the year is not confirmed when the bill does not give one', async () => {
    billPhotoService.getBillSuggestion.mockResolvedValue({
      decision: 'ASK',
      askReason: 'NO_PLATE_DIGITS',
      candidates: [],
      why: { code: 'NO_PLATE_DIGITS', text: 'the plate could not be read', basis: '' },
      photo: { date: '2 Nov', time: '12:01', timeSource: 'stamp' },
    });
    render(<BillsTable rows={[{ id: 'cap1', ocr: { litres: 180 } }]} />);
    await waitFor(() =>
      expect(screen.getByText('year not confirmed — check the bill')).toBeInTheDocument(),
    );
    expect(screen.getByText('2 Nov')).toBeInTheDocument();
  });
});

describe('the slip and its odometer photo', () => {
  const slipRow = {
    id: 'row-slip',
    status: 'sent',
    capture: { id: 'cap-slip', docType: 'DIESEL_SLIP', ocr: { litres: 180 } },
  };
  const odometerRow = {
    id: 'row-odo',
    status: 'sent',
    capture: { id: 'cap-odo', docType: 'ODOMETER_PHOTO' },
  };
  const pairedList = {
    captures: [
      {
        id: 'cap-slip',
        kind: 'SLIP',
        pair: {
          role: 'SLIP',
          slipCaptureId: 'cap-slip',
          odometerCaptureId: 'cap-odo',
          state: 'PROPOSED',
          decision: 'AUTO',
          gapMin: 7,
          reasons: ['the odometer photo was taken after the slip'],
          trucks: [{ vehicleId: 'v1', registrationNumber: 'MH12AB1234' }],
          odometerKm: 122704.7,
          odometerKmSource: 'READ',
        },
      },
      {
        id: 'cap-odo',
        kind: 'ODOMETER',
        pair: {
          role: 'ODOMETER',
          slipCaptureId: 'cap-slip',
          odometerCaptureId: 'cap-odo',
          state: 'PROPOSED',
          decision: 'AUTO',
        },
      },
    ],
  };
  const unpairedList = {
    captures: [
      { id: 'cap-slip', kind: 'SLIP', pair: null },
      { id: 'cap-odo', kind: 'ODOMETER', pair: null },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    billPhotoService.getBillSuggestion.mockResolvedValue({
      decision: 'ASK',
      askReason: 'NO_PLATE_DIGITS',
      candidates: [],
      why: { code: 'NO_PLATE_DIGITS', text: 'the plate could not be read', basis: '' },
      photo: { date: '2026-10-01', time: '12:01', timeSource: 'stamp' },
    });
    billPhotoService.listBillCaptures.mockResolvedValue(pairedList);
    billPhotoService.saveBillLinks.mockResolvedValue({});
    billPhotoService.pairBills.mockResolvedValue({});
    billPhotoService.unpairBill.mockResolvedValue({ removed: true });
  });

  it('shows the pair and sends the odometer photo along with the bill', async () => {
    const onSaved = vi.fn();
    render(<BillsTable rows={[slipRow, odometerRow]} via="UPLOAD" onSaved={onSaved} />);

    expect(
      await screen.findByText('Odometer 1,22,704.7 km · 7 min from the slip'),
    ).toBeInTheDocument();
    expect(screen.getByText('the odometer photo was taken after the slip')).toBeInTheDocument();
    expect(screen.getByText('Goes with bill #1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm 1 bills' }));
    await waitFor(() =>
      expect(billPhotoService.saveBillLinks).toHaveBeenCalledWith([
        {
          captureId: 'cap-slip',
          registrationNumber: 'MH12AB1234',
          reason: null,
          via: 'UPLOAD',
          odometerCaptureId: 'cap-odo',
        },
      ]),
    );
    expect(onSaved).toHaveBeenCalledWith(['cap-slip', 'cap-odo']);
  });

  it('never sends an odometer photo as a bill of its own', async () => {
    render(<BillsTable rows={[slipRow, odometerRow]} via="UPLOAD" />);
    await screen.findByText('Goes with bill #1');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm 1 bills' }));
    await waitFor(() => expect(billPhotoService.saveBillLinks).toHaveBeenCalled());
    const links = billPhotoService.saveBillLinks.mock.calls[0][0];
    expect(links.map((link) => link.captureId)).toEqual(['cap-slip']);
  });

  it('takes the odometer photo off the bill when it is not the right one', async () => {
    render(<BillsTable rows={[slipRow, odometerRow]} via="UPLOAD" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Not this one' }));
    await waitFor(() => expect(billPhotoService.unpairBill).toHaveBeenCalledWith('cap-slip'));
  });

  it('matches an odometer photo to a bill of the batch', async () => {
    billPhotoService.listBillCaptures.mockResolvedValue(unpairedList);
    render(<BillsTable rows={[slipRow, odometerRow]} via="UPLOAD" />);
    expect(
      await screen.findByText('Odometer photo, not matched to a bill yet'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox', { name: 'Goes with bill' }));
    fireEvent.click(await screen.findByRole('option', { name: '#1 · 180 L' }));
    await waitFor(() =>
      expect(billPhotoService.pairBills).toHaveBeenCalledWith({
        slipCaptureId: 'cap-slip',
        odometerCaptureId: 'cap-odo',
        verdict: 'pair',
      }),
    );
  });
});
