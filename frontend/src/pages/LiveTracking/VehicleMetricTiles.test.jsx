import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { getUserRole } from '../../utils/session.js';
import TrackTelemetryService from './TrackTelemetryService.js';
import VehicleDetailPanel from './VehicleDetailPanel.jsx';

vi.mock('../../utils/session.js', () => ({ getUserRole: vi.fn() }));
vi.mock('./TrackTelemetryService.js', () => ({ default: { getLatest: vi.fn() } }));
vi.mock('./DestinationIntentSection.jsx', () => ({ default: () => null }));
vi.mock('./DriverAssignmentSection.jsx', () => ({ default: () => null }));
vi.mock('./VehicleLocation.jsx', () => ({ default: () => null }));
beforeEach(() => {
  getUserRole.mockReturnValue('OWNER');
});
afterEach(() => {
  vi.resetAllMocks();
});

const panel = (vehicle) => (
  <VehicleDetailPanel selectedVehicle={vehicle} replayState={{ on: false }} />
);

describe('Track selected-vehicle health', () => {
  it('uses the same CAN fallback in the top tile, vehicle information and diagnostics', async () => {
    TrackTelemetryService.getLatest.mockResolvedValue({
      canOdo: 123456,
      defLevel: 80,
      defLevelUnit: 'percent',
    });
    const { rerender } = render(
      <VehicleDetailPanel
        selectedVehicle={{ plate: 'BR44GB1162', odo: null }}
        replayState={{ on: false }}
      />,
    );
    await waitFor(() => expect(screen.getAllByText('1,23,456 km')).toHaveLength(3));
    expect(screen.queryByText('Odo N/A')).not.toBeInTheDocument();
    rerender(panel({ plate: 'BR44GB1162', odo: 123457 }));
    expect(screen.getAllByText('1,23,457 km')).toHaveLength(3);
    expect(screen.queryByText('1,23,456 km')).not.toBeInTheDocument();
    expect(TrackTelemetryService.getLatest).toHaveBeenCalledTimes(1);
  });
  it('loads DEF for the selection and aborts when the panel closes', async () => {
    TrackTelemetryService.getLatest.mockResolvedValue({
      defLevel: 80,
      defLevelUnit: 'percent',
      canOdo: 123456,
    });
    const { unmount } = render(panel({ plate: 'BR44GB1162', fuel: 32, fuelUnit: 'litres' }));
    expect(await screen.findByText('80%')).toBeInTheDocument();
    expect(screen.getAllByText('1,23,456 km')).toHaveLength(3);
    expect(screen.getByText('32 L')).toBeInTheDocument();
    const [reg, signal] = TrackTelemetryService.getLatest.mock.calls[0];
    expect(reg).toBe('BR44GB1162');
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
  it('does not show the previous vehicle’s DEF while another vehicle loads', async () => {
    let resolve;
    TrackTelemetryService.getLatest
      .mockResolvedValueOnce({ defLevel: 80, defLevelUnit: 'percent' })
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      );
    const { rerender } = render(panel({ plate: 'BR44GB1162' }));
    expect(await screen.findByText('80%')).toBeInTheDocument();
    rerender(panel({ plate: 'BR44GB1163' }));
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
    await act(async () => {
      resolve({ defLevel: 25, defLevelUnit: 'percent' });
    });
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
  it('keeps live metrics available when the optional health reading is missing', async () => {
    TrackTelemetryService.getLatest.mockRejectedValue(
      Object.assign(new Error('No data'), { status: 404 }),
    );
    render(panel({ plate: 'BR44GB1162', fuel: 32, fuelUnit: 'litres', odo: 123456 }));
    await waitFor(() => expect(TrackTelemetryService.getLatest).toHaveBeenCalled());
    expect(screen.getByText('32 L')).toBeInTheDocument();
    expect(screen.getAllByText('1,23,456 km')).toHaveLength(3);
    expect(screen.getByText('DEF')).toBeInTheDocument();
  });
  it('avoids the manager-only health request for other roles', () => {
    getUserRole.mockReturnValue('DRIVER');
    render(panel({ plate: 'BR44GB1162' }));
    expect(TrackTelemetryService.getLatest).not.toHaveBeenCalled();
  });
});
