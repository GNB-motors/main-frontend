import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import BulkApproveModal from './BulkApproveModal';

describe('BulkApproveModal', () => {
  it('lists the rows that were skipped because a key field was missing', async () => {
    const handleBulkApprove = vi.fn().mockResolvedValue({
      missing: [
        { id: 'draft-1', name: 'WB01AB1234', missing: ['Truck', 'Fill time'] },
      ],
      successCount: 1,
      failureCount: 0,
    });

    render(
      <BulkApproveModal
        bulkBusy={false}
        setShowBulkApproveModal={vi.fn()}
        selectedIds={new Set(['draft-1', 'draft-2'])}
        totalSelectedLitres={40}
        totalSelectedAmount={3600}
        handleBulkApprove={handleBulkApprove}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirm & Publish/i }));

    expect(await screen.findByText('1 not approved: key field missing')).toBeInTheDocument();
    expect(screen.getByText('WB01AB1234 — Truck, Fill time')).toBeInTheDocument();
    expect(handleBulkApprove).toHaveBeenCalledTimes(1);
  });
});
