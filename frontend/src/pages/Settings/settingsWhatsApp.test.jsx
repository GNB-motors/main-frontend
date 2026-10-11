import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import apiClient from '../../utils/axiosConfig';
import { WhatsAppSettings } from './settingsWhatsApp';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const settings = (odometerMode) => ({ data: { data: { odometerMode } } });

describe('Settings — WhatsApp odometer mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the saved mode', async () => {
    apiClient.get.mockResolvedValue(settings('FLEETEDGE'));
    render(<WhatsAppSettings />);
    expect(await screen.findByLabelText('Read it from FleetEdge')).toBeChecked();
  });

  // It used to show "Ask the driver" as if it were the saved choice.
  it('says the setting could not load instead of showing the default, and retries', async () => {
    apiClient.get
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(settings('MANUAL'));
    render(<WhatsAppSettings />);
    expect(await screen.findByText('Could not load the odometer setting.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Ask the driver')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Manual only')).toBeChecked();
  });

  it('saves a new mode and rolls back if the save fails', async () => {
    apiClient.get.mockResolvedValue(settings('INTERACTIVE'));
    apiClient.patch.mockRejectedValueOnce(new Error('boom'));
    render(<WhatsAppSettings />);
    fireEvent.click(await screen.findByLabelText('Manual only'));
    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith('/api/whatsapp/settings', {
        odometerMode: 'MANUAL',
      }),
    );
    await waitFor(() => expect(screen.getByLabelText('Ask the driver')).toBeChecked());
  });
});
