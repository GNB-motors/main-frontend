import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';
import AddBillPhotoDialog from './AddBillPhotoDialog';
import billPhotoService from '../../services/billPhotoService';

vi.mock('../../services/billPhotoService', () => ({
  default: { uploadBillPhoto: vi.fn(), getBillSuggestion: vi.fn() },
}));

/**
 * Photographing a diesel slip has to look like the rest of the app, and the
 * owner must be able to see which file they picked before it is sent.
 */

const openDialog = () => render(<AddBillPhotoDialog open onOpenChange={() => {}} />);

describe('Add bill photo dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers a drop zone and keeps the browser picker out of sight', async () => {
    openDialog();
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Drop a bill photo or click to choose')).toBeInTheDocument();
    expect(within(dialog).getByText('JPG, PNG or PDF')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Bill photo')).toHaveClass('sr-only');
  });

  it('names the file the owner picked and lets them take it back', async () => {
    openDialog();
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText('Bill photo');
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'diesel-slip.jpg', { type: 'image/jpeg' })] },
    });
    expect(within(dialog).getByText('diesel-slip.jpg')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Remove diesel-slip.jpg' }));
    expect(within(dialog).queryByText('diesel-slip.jpg')).not.toBeInTheDocument();
  });

  it('keeps Cancel and Upload in the footer, and Upload waits for a file', async () => {
    openDialog();
    const dialog = await screen.findByRole('dialog');
    const footer = dialog.querySelector('.bp-dialog-foot');
    expect(footer).not.toBeNull();
    expect(within(footer).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(footer).getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('does not send anything until the owner presses Upload', async () => {
    openDialog();
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Bill photo'), {
      target: { files: [new File(['x'], 'diesel-slip.jpg', { type: 'image/jpeg' })] },
    });
    expect(billPhotoService.uploadBillPhoto).not.toHaveBeenCalled();

    billPhotoService.uploadBillPhoto.mockResolvedValue({ _id: 'cap1' });
    billPhotoService.getBillSuggestion.mockResolvedValue({ decision: 'AUTO', candidates: [] });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Upload' }));
    });
    await waitFor(() => expect(billPhotoService.uploadBillPhoto).toHaveBeenCalled());
  });
});
