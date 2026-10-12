import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import apiClient from '../../utils/axiosConfig';
import { WhatsAppSettings } from './settingsWhatsApp';

const flags = vi.hoisted(() => ({ value: {} }));
vi.mock('../../contexts/FeatureFlagsContext.jsx', () => ({ useFeatureFlags: () => flags.value }));
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const withMode = (odometerMode) => ({
  ready: true,
  organization: { _id: 'org1', whatsappSettings: odometerMode ? { odometerMode } : undefined },
  refresh: vi.fn(),
});

describe('Settings — WhatsApp odometer mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The mode rides on /api/auth/me; the card no longer fetches it a second time.
  it('shows the saved mode from the shared /api/auth/me payload', () => {
    flags.value = withMode('FLEETEDGE');
    render(<WhatsAppSettings />);
    expect(screen.getByLabelText('Read it from FleetEdge')).toBeChecked();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('treats an unset mode as the server default', () => {
    flags.value = withMode(undefined);
    render(<WhatsAppSettings />);
    expect(screen.getByLabelText('Ask the driver')).toBeChecked();
  });

  // It used to show "Ask the driver" as if it were the saved choice.
  it('says the setting could not load instead of showing the default, and retries', () => {
    flags.value = { ready: true, organization: null, refresh: vi.fn() };
    render(<WhatsAppSettings />);
    expect(screen.getByText('Could not load the odometer setting.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Ask the driver')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(flags.value.refresh).toHaveBeenCalledTimes(1);
  });

  it('saves a new mode and refreshes the shared payload', async () => {
    flags.value = withMode('INTERACTIVE');
    apiClient.patch.mockResolvedValueOnce({ data: { data: { odometerMode: 'MANUAL' } } });
    render(<WhatsAppSettings />);
    fireEvent.click(screen.getByLabelText('Manual only'));
    await waitFor(() => expect(flags.value.refresh).toHaveBeenCalledTimes(1));
    expect(apiClient.patch).toHaveBeenCalledWith('/api/whatsapp/settings', {
      odometerMode: 'MANUAL',
    });
    expect(screen.getByLabelText('Manual only')).toBeChecked();
  });

  it('rolls back if the save fails', async () => {
    flags.value = withMode('INTERACTIVE');
    apiClient.patch.mockRejectedValueOnce(new Error('boom'));
    render(<WhatsAppSettings />);
    fireEvent.click(screen.getByLabelText('Manual only'));
    await waitFor(() => expect(screen.getByLabelText('Ask the driver')).toBeChecked());
    expect(flags.value.refresh).not.toHaveBeenCalled();
  });
});
