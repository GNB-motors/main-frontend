import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import BillsToConfirm from './BillsToConfirm';
import service from '../../services/billPhotoService';
vi.mock('../../services/billPhotoService', () => ({ default: { listBillCaptures: vi.fn(), getBillSuggestion: vi.fn(), getBillPage: vi.fn(), saveBillLinks: vi.fn(), editBillLink: vi.fn(), getBillLinkHistory: vi.fn() } }));
const vehicles = [{ _id: 'a', registrationNumber: 'A' }, { _id: 'b', registrationNumber: 'B' }];
const pending = { id: '1', ocr: { litres: 50, time: '2026-11-01T00:00:00Z', pump: 'Pump' }, suggestion: { decision: 'AUTO', candidates: [{ registrationNumber: 'B', score: 0.2, reasons: ['other'] }, { registrationNumber: 'A', score: 0.9, reasons: ['at pump'] }] }, link: null, thumbnailUrl: null };
const submitted = { ...pending, id: '2', link: { registrationNumber: 'A', by: 'u1', at: '2026-11-01T00:00:00Z', edited: true } };

describe('Bills to confirm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    service.listBillCaptures.mockImplementation(async ({ status }) => ({ captures: [status === 'submitted' ? submitted : pending], total: 1 }));
  });
  it('shows the top prediction, warns on disagreement and submits only after review', async () => {
    service.saveBillLinks.mockResolvedValue({});
    render(<BillsToConfirm uploads={[]} vehicles={vehicles} />);
    expect(await screen.findByText(/A \(Top prediction\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/B — other/));
    expect(screen.getByRole('alert')).toHaveTextContent('at pump');
    fireEvent.click(screen.getByRole('button', { name: 'Review now' }));
    expect(screen.getByText('Review & submit')).toBeInTheDocument();
    expect(screen.getByText(/Litres: 50/)).toBeInTheDocument();
    expect(service.saveBillLinks).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Review later' }));
    expect(service.saveBillLinks).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Review now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(service.saveBillLinks).toHaveBeenCalledWith([{ captureId: '1', registrationNumber: 'B', reason: null }]));
  });
  it('maps 422 errors to the bill without claiming any links were saved', async () => {
    service.saveBillLinks.mockRejectedValue({ status: 422, body: { errors: [{ index: 0, captureId: '1', errors: ['OCR must contain litres'] }] } });
    render(<BillsToConfirm vehicles={vehicles} />);
    await screen.findByText(/A \(Top prediction\)/);
    fireEvent.click(screen.getByRole('button', { name: 'Review now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await within(screen.getByRole('article', { name: 'Bill 1' })).findByText('OCR must contain litres')).toBeInTheDocument();
    expect(screen.getByText(/No bills were submitted/)).toBeInTheDocument();
  });
  it('edits submitted links with a reason, explains 409 and shows history', async () => {
    service.editBillLink.mockRejectedValueOnce({ status: 409 });
    service.getBillLinkHistory.mockResolvedValue({ entries: [{ actorId: 'u2', at: '2026-11-02T00:00:00Z', fromRegistration: 'A', toRegistration: 'B', reason: 'corrected' }] });
    render(<BillsToConfirm vehicles={vehicles} />);
    await screen.findByText(/A \(Top prediction\)/);
    fireEvent.click(screen.getByRole('tab', { name: 'Submitted' }));
    await screen.findByText(/Originally submitted by u1/);
    fireEvent.click(screen.getByRole('button', { name: 'Change truck' }));
    fireEvent.change(screen.getByLabelText('Change truck'), { target: { value: 'B' } });
    expect(screen.getByRole('button', { name: 'Save change' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Reason (required)'), { target: { value: 'corrected' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save change' }));
    expect(await screen.findByText(/attached to a trip, have multiple fuel logs/)).toBeInTheDocument();
    expect(service.editBillLink).toHaveBeenCalledWith('2', { registrationNumber: 'B', reason: 'corrected' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(await screen.findByText('Reason: corrected')).toBeInTheDocument();
    expect(screen.getByText(/By u2/)).toBeInTheDocument();
  });
  it('fetches an authenticated image blob and revokes its URL on unmount', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revoke = URL.revokeObjectURL = vi.fn();
    service.listBillCaptures.mockResolvedValue({ captures: [{ ...pending, thumbnailUrl: '/api/fleet-view/bills/1/pages/0' }], total: 1 });
    service.getBillPage.mockResolvedValue(new Blob(['image']));
    const { unmount } = render(<BillsToConfirm vehicles={vehicles} />);
    expect(await screen.findByAltText('Bill thumbnail')).toHaveAttribute('src', 'blob:test');
    expect(service.getBillPage).toHaveBeenCalledWith('1', 0, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    unmount(); expect(revoke).toHaveBeenCalledWith('blob:test');
    delete URL.createObjectURL; delete URL.revokeObjectURL;
  });
  it('retries a pending suggestion with backoff and stops its timer on unmount', async () => {
    vi.useFakeTimers();
    service.listBillCaptures.mockResolvedValue({ captures: [{ ...pending, suggestion: { decision: 'pending', candidates: [] } }], total: 1 });
    service.getBillSuggestion.mockRejectedValue({ status: 400, message: 'Not classified yet' });
    const view = render(<BillsToConfirm vehicles={vehicles} />);
    await act(async () => {});
    expect(service.getBillSuggestion).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1999); });
    expect(service.getBillSuggestion).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(service.getBillSuggestion).toHaveBeenCalledTimes(2);
    view.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(service.getBillSuggestion).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('saves a correction and refreshes the submitted list', async () => {
    service.getBillLinkHistory.mockResolvedValue({ entries: [] });
    service.editBillLink.mockResolvedValue({ captureId: '2' });
    render(<BillsToConfirm vehicles={vehicles} />);
    await screen.findByText(/A \(Top prediction\)/);
    fireEvent.click(screen.getByRole('tab', { name: 'Submitted' }));
    await screen.findByText(/Originally submitted by u1/);
    fireEvent.click(screen.getByRole('button', { name: 'Change truck' }));
    fireEvent.change(screen.getByLabelText('Change truck'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('Reason (required)'), { target: { value: 'Photo checked' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save change' }));
    await waitFor(() => expect(service.editBillLink).toHaveBeenCalledWith('2', { registrationNumber: 'B', reason: 'Photo checked' }));
    await waitFor(() => expect(service.listBillCaptures.mock.calls.filter(([params]) => params.status === 'submitted').length).toBeGreaterThan(1));
  });

});
