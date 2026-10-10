import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import apiClient from '../../utils/axiosConfig';
import { IdleThresholdSetting } from './settingsIdling';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('Settings — idle threshold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { data: { idleThresholdMin: 20 } } });
  });

  it('shows the org threshold, 20 min by default', async () => {
    render(<IdleThresholdSetting canEdit />);
    expect(await screen.findByDisplayValue('20')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('api/fuel-settings');
  });

  it('an owner or manager saves a new value', async () => {
    apiClient.patch.mockResolvedValue({ data: { data: { idleThresholdMin: 45 } } });
    render(<IdleThresholdSetting canEdit />);
    const input = await screen.findByDisplayValue('20');
    fireEvent.change(input, { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith('api/fuel-settings', { idleThresholdMin: 45 }),
    );
  });

  it('does not save a value outside 1 min – 24 h', async () => {
    render(<IdleThresholdSetting canEdit />);
    const input = await screen.findByDisplayValue('20');
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('says when the org is still on the default', async () => {
    apiClient.get.mockResolvedValue({
      data: { data: { idleThresholdMin: 20, idleThresholdSource: 'DEFAULT' } },
    });
    render(<IdleThresholdSetting canEdit />);
    expect(await screen.findByText('Default')).toBeInTheDocument();
  });

  it('drops the default label once the org saves its own value', async () => {
    apiClient.get.mockResolvedValue({
      data: { data: { idleThresholdMin: 20, idleThresholdSource: 'DEFAULT' } },
    });
    apiClient.patch.mockResolvedValue({
      data: { data: { idleThresholdMin: 30, idleThresholdSource: 'ORG' } },
    });
    render(<IdleThresholdSetting canEdit />);
    fireEvent.change(await screen.findByDisplayValue('20'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByText('Default')).not.toBeInTheDocument());
  });

  it('is read-only for everyone else', async () => {
    render(<IdleThresholdSetting canEdit={false} />);
    expect(await screen.findByText(/20 min/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });
});
