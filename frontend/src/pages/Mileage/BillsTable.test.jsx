import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BillsTable from './BillsTable';
import billPhotoService from '../../services/billPhotoService';

vi.mock('../../services/billPhotoService', () => ({
  default: { getBillSuggestion: vi.fn(), saveBillLinks: vi.fn() },
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

  it('keeps a way to pick a truck when the matcher failed', async () => {
    billPhotoService.getBillSuggestion.mockRejectedValue({ response: { status: 403 } });
    render(<BillsTable rows={[{ id: 'cap1', ocr: {} }]} />);
    // The failure is said out loud, and the owner is not left with no way out.
    await waitFor(() => expect(screen.getByText(/Suggestions unavailable/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getAllByText('Truck').length).toBeGreaterThan(0);
  });

  it('says when the truck list could not be loaded and offers a retry', async () => {
    const onRetryVehicles = vi.fn();
    render(
      <BillsTable
        rows={[{ id: 'cap1', ocr: {} }]}
        vehiclesError="The truck list could not be loaded."
        onRetryVehicles={onRetryVehicles}
      />,
    );
    await waitFor(() => expect(screen.getByText(/Truck list unavailable/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /retry trucks/i }));
    expect(onRetryVehicles).toHaveBeenCalled();
  });
});
