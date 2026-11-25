import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from 'react-toastify';
import { EmailReportSettings } from './settingsEmailReports';
import { SettingsService } from './SettingsService';

vi.mock('./SettingsService', () => ({
  SettingsService: {
    getEmailReportSettings: vi.fn(),
    updateEmailReportSettings: vi.fn(),
  },
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const settings = {
  daily: false,
  weekly: true,
  recipients: ['owner@gnb.com'],
  defaultRecipients: ['owner@gnb.com'],
  serverEnabled: true,
  emailConfigured: true,
  sendTimeIst: '08:00',
  weeklyDay: 'Monday',
};

describe('Settings — email reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SettingsService.getEmailReportSettings.mockResolvedValue(settings);
    SettingsService.updateEmailReportSettings.mockResolvedValue(settings);
  });

  it('spec 5: an owner sees the daily and weekly toggles enabled', async () => {
    render(<EmailReportSettings canEdit />);
    expect(await screen.findByLabelText(/Daily fuel report/)).toBeEnabled();
    expect(screen.getByLabelText(/Weekly fuel report/)).toBeEnabled();
    expect(screen.getByLabelText(/Weekly fuel report/)).toBeChecked();
  });

  it('spec 5: toggling the daily report saves only the daily flag', async () => {
    render(<EmailReportSettings canEdit />);
    fireEvent.click(await screen.findByLabelText(/Daily fuel report/));
    await waitFor(() =>
      expect(SettingsService.updateEmailReportSettings).toHaveBeenCalledWith({ daily: true }),
    );
  });

  it('spec 5: a manager reads the settings but may not change them', async () => {
    render(<EmailReportSettings canEdit={false} />);
    expect(await screen.findByLabelText(/Daily fuel report/)).toBeDisabled();
    expect(screen.getByLabelText(/Weekly fuel report/)).toBeDisabled();
    expect(screen.getByText(/Ask an owner to change it/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('spec 5: saving the recipients sends only the recipients', async () => {
    render(<EmailReportSettings canEdit />);
    const input = await screen.findByLabelText('Emails');
    fireEvent.change(input, { target: { value: 'a@x.com, b@y.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(SettingsService.updateEmailReportSettings).toHaveBeenCalledWith({
        recipients: ['a@x.com', 'b@y.com'],
      }),
    );
  });

  it('spec 5: an address that is not an address is refused', async () => {
    render(<EmailReportSettings canEdit />);
    const input = await screen.findByLabelText('Emails');
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(toast.error).toHaveBeenCalled();
    expect(SettingsService.updateEmailReportSettings).not.toHaveBeenCalled();
  });

  it('spec 5: more than ten addresses is refused, not silently dropped', async () => {
    render(<EmailReportSettings canEdit />);
    const input = await screen.findByLabelText('Emails');
    const eleven = Array.from({ length: 11 }, (_, i) => `a${i}@x.com`).join(', ');
    fireEvent.change(input, { target: { value: eleven } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(toast.error).toHaveBeenCalled();
    expect(SettingsService.updateEmailReportSettings).not.toHaveBeenCalled();
  });

  it('spec 5: an empty recipient list is allowed — the backend mails the owner', async () => {
    render(<EmailReportSettings canEdit />);
    const input = await screen.findByLabelText('Emails');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(SettingsService.updateEmailReportSettings).toHaveBeenCalledWith({ recipients: [] }),
    );
  });

  it('spec 5: the section says when the backend has scheduled e-mails off', async () => {
    SettingsService.getEmailReportSettings.mockResolvedValue({
      ...settings,
      serverEnabled: false,
      emailConfigured: false,
    });
    render(<EmailReportSettings canEdit />);
    expect(await screen.findByText('Off on the server')).toBeInTheDocument();
  });
});
