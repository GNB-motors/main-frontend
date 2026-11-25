import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import EmailReportDialog from './EmailReportDialog';
import { ReportEmailService } from '../../services/ReportEmailService';

vi.mock('../../services/ReportEmailService', () => ({
  ReportEmailService: { sendServerReport: vi.fn(), sendFile: vi.fn(), getStatus: vi.fn() },
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../utils/session', () => ({ getUserEmail: () => 'Owner@Gnb.com' }));

const server = { report: 'fuel-cycles', params: { from: '2026-09-01', format: 'xlsx' } };

const renderDialog = (props = {}) =>
  render(
    <EmailReportDialog
      label="Oil report"
      server={server}
      onClose={props.onClose || vi.fn()}
      {...props}
    />,
  );

const typeRecipients = (text) => {
  const input = screen.getByLabelText('To');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
  return input;
};

describe('EmailReportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ReportEmailService.sendServerReport.mockResolvedValue({ id: 're_1', status: 'queued' });
    ReportEmailService.sendFile.mockResolvedValue({ id: 're_2', status: 'queued' });
  });

  it('spec 4: pre-fills the viewer\u2019s own address, lowercased', () => {
    renderDialog();
    expect(screen.getByText('owner@gnb.com')).toBeInTheDocument();
  });

  it('spec 4: Enter turns a typed address into a chip', () => {
    renderDialog();
    typeRecipients('driver@gnb.com');
    expect(screen.getByText('driver@gnb.com')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toHaveValue('');
  });

  it('spec 4: an address that is not an address is shown and blocks the send', () => {
    renderDialog();
    typeRecipients('not-an-email');
    expect(screen.getByRole('alert')).toHaveTextContent('Not an email address: not-an-email');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(ReportEmailService.sendServerReport).not.toHaveBeenCalled();
  });

  it('spec 4: more than ten addresses is an error, never a silent drop', () => {
    renderDialog();
    const ten = Array.from({ length: 10 }, (_, i) => `a${i}@gnb.com`).join(' ');
    const input = typeRecipients(ten);
    expect(screen.getByRole('alert')).toHaveTextContent('At most 10 addresses.');
    // Nothing was dropped: the addresses are still there to be seen.
    expect(input).toHaveValue(ten);
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(ReportEmailService.sendServerReport).not.toHaveBeenCalled();
  });

  it('spec 2: server mode sends the report and the params of the download', async () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(ReportEmailService.sendServerReport).toHaveBeenCalledWith({
        report: 'fuel-cycles',
        params: { from: '2026-09-01', format: 'xlsx' },
        to: ['owner@gnb.com'],
        note: undefined,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('spec 3: file mode builds the file and uploads it', async () => {
    const blob = new Blob(['Vehicle,Km\n'], { type: 'text/csv' });
    const buildFile = vi.fn(async () => ({ blob, filename: 'vehicle-report-2026-09-06.xlsx' }));
    renderDialog({ server: null, buildFile, label: 'Vehicle report' });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(buildFile).toHaveBeenCalled());
    expect(ReportEmailService.sendFile).toHaveBeenCalledWith({
      blob,
      filename: 'vehicle-report-2026-09-06.xlsx',
      to: ['owner@gnb.com'],
      reportLabel: 'Vehicle report',
      note: undefined,
    });
  });

  it('spec 2: a rate-limited send says so in plain words', async () => {
    ReportEmailService.sendServerReport.mockRejectedValue(
      Object.assign(new Error('Too many requests'), { status: 429 }),
    );
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many report emails this hour. Try again later.',
    );
  });

  it('spec 4: a failed send keeps the recipients and the note, and sends only once', async () => {
    let fail;
    ReportEmailService.sendServerReport.mockImplementation(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    );
    renderDialog();
    fireEvent.change(screen.getByLabelText('Note (optional)'), {
      target: { value: 'for the office' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled());
    // While sending, nothing else may start a second send.
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByLabelText('To')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Sending…' }));
    expect(ReportEmailService.sendServerReport).toHaveBeenCalledTimes(1);

    fail(new Error('Could not send the report.'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not send the report.');
    expect(screen.getByText('owner@gnb.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Note (optional)')).toHaveValue('for the office');
  });
});
