import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import apiClient from '../../utils/axiosConfig';
import { NetFuelSetting } from './settingsNetFuel';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('Settings — oil report standard mileage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({
      data: { data: { netFuelKmPerL: 2.9, netFuelKmPerLSource: 'DEFAULT' } },
    });
  });

  it('shows 2.9 km/L by default and says it is the default', async () => {
    render(<NetFuelSetting canEdit />);
    expect(await screen.findByDisplayValue('2.9')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('an owner or manager saves a new value', async () => {
    apiClient.patch.mockResolvedValue({
      data: { data: { netFuelKmPerL: 3.1, netFuelKmPerLSource: 'ORG' } },
    });
    render(<NetFuelSetting canEdit />);
    fireEvent.change(await screen.findByDisplayValue('2.9'), { target: { value: '3.1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith('api/fuel-settings', { netFuelKmPerL: 3.1 }),
    );
  });

  it('refuses a value outside 0.5–20 km/L', async () => {
    render(<NetFuelSetting canEdit />);
    fireEvent.change(await screen.findByDisplayValue('2.9'), { target: { value: '25' } });
    expect(screen.getByText('0.5 to 20 km/L, up to two decimals.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('is read-only without edit rights', async () => {
    render(<NetFuelSetting canEdit={false} />);
    expect(await screen.findByText('2.9 km/L')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });
});
