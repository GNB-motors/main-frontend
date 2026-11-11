import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BillReviewModal from './BillReviewModal';
import BillExtractionService from '../../services/BillExtractionService';

vi.mock('../../services/BillExtractionService', () => ({
  default: { getBill: vi.fn(), reviewBill: vi.fn() },
}));

const BASE = {
  createdAt: '2026-10-01T00:00:00.000Z',
  sourceFile: { publicUrl: 'https://example.com/bill.jpg' },
  fields: [{ field: 'grandTotal', value: 4200, status: 'PROPOSED', confidence: 92 }],
  lineItems: [],
};

function renderModal() {
  return render(<BillReviewModal billId="b1" onClose={vi.fn()} onReviewed={vi.fn()} />);
}

describe('service bill review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    BillExtractionService.getBill.mockResolvedValue(BASE);
  });

  it('shows the server guidance when the photo was filed somewhere else', async () => {
    BillExtractionService.getBill.mockResolvedValue({
      ...BASE,
      guidance: {
        status: 'filed_elsewhere',
        message:
          'This looks like a fuel slip, not a service bill. We have saved it as a fuel slip.',
      },
    });
    renderModal();
    expect(
      await screen.findByText(
        'This looks like a fuel slip, not a service bill. We have saved it as a fuel slip.',
      ),
    ).toBeInTheDocument();
  });

  it('asks for a retake when the server could not read the photo', async () => {
    BillExtractionService.getBill.mockResolvedValue({
      ...BASE,
      guidance: { status: 'reupload', message: 'Please retake this photo in better light.' },
    });
    renderModal();
    expect(
      await screen.findByText('Please retake this photo in better light.'),
    ).toBeInTheDocument();
  });

  it('shows no guidance when the server sent none', async () => {
    renderModal();
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
