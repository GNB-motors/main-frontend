import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ReceiptApprovalActions from './ReceiptApprovalActions';
it('requires a review confirmation and shows the edited values before approving', async () => {
  const publish = vi.fn();
  render(
    <ReceiptApprovalActions
      draft={{
        _id: 'receipt1',
        vehicleId: 'truck1',
        vehicleReg: 'OLD',
        time: { value: '2026-11-24T00:00:00Z' },
        litres: 20,
        amount: 1800,
      }}
      edits={{ truckPicked: true, truckPlate: 'WB11T0662', litres: 150, amount: 13500 }}
      isReady
      isChat={false}
      visibleMissing={[]}
      handlePublish={publish}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Approve & Publish' }));
  const dialog = await screen.findByRole('dialog', { name: 'Confirm fuel approval' });
  expect(dialog).toHaveTextContent('WB11T0662');
  expect(dialog).toHaveTextContent('150 L');
  expect(dialog).toHaveTextContent('13500');
  expect(publish).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Back to review' }));
  expect(publish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Approve & Publish' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirm approval' }));
  expect(publish).toHaveBeenCalledOnce();
});
