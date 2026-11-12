import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import apiClient from '../../utils/axiosConfig';
import { WhatsAppSettings } from './settingsWhatsApp';

const flags = vi.hoisted(() => ({ value: {} }));
vi.mock('../../contexts/FeatureFlagsContext.jsx', () => ({ useFeatureFlags: () => flags.value }));
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const withCapture = (captureMode) => ({
  ready: true,
  organization: { _id: 'org1', whatsappSettings: captureMode ? { captureMode } : undefined },
  refresh: vi.fn(),
});

describe('Settings — WhatsApp capture mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The capture mode rides on /api/auth/me, like the odometer mode.
  it('shows the saved capture mode from the shared /api/auth/me payload', () => {
    flags.value = withCapture('SILENT');
    render(<WhatsAppSettings />);
    expect(screen.getByLabelText('Just receive and read')).toBeChecked();
    expect(screen.getByLabelText('Ask the sender questions')).not.toBeChecked();
  });

  it('treats an unset capture mode as the server default (guided)', () => {
    flags.value = withCapture(undefined);
    render(<WhatsAppSettings />);
    expect(screen.getByLabelText('Ask the sender questions')).toBeChecked();
  });

  it('saves the silent choice and refreshes the shared payload', async () => {
    flags.value = withCapture('GUIDED');
    apiClient.patch.mockResolvedValueOnce({ data: { data: { captureMode: 'SILENT' } } });
    render(<WhatsAppSettings />);
    fireEvent.click(screen.getByLabelText('Just receive and read'));
    await waitFor(() => expect(flags.value.refresh).toHaveBeenCalledTimes(1));
    expect(apiClient.patch).toHaveBeenCalledWith('/api/whatsapp/settings', {
      captureMode: 'SILENT',
    });
    expect(screen.getByLabelText('Just receive and read')).toBeChecked();
  });

  it('rolls back if the save fails', async () => {
    flags.value = withCapture('GUIDED');
    apiClient.patch.mockRejectedValueOnce(new Error('boom'));
    render(<WhatsAppSettings />);
    fireEvent.click(screen.getByLabelText('Just receive and read'));
    await waitFor(() => expect(screen.getByLabelText('Ask the sender questions')).toBeChecked());
    expect(flags.value.refresh).not.toHaveBeenCalled();
  });
});
