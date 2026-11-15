import { changeField } from '@/test/changeField';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FuelLogForm from './FuelLogForm';
import FuelLogService from '../../services/FuelLogService';
import { OCRService } from '../../pages/Trip/services';

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));
vi.mock('../../services/vehicleListService', () => ({
  getVehicleList: vi
    .fn()
    .mockResolvedValue([{ _id: 'v1', registrationNumber: 'WB01', model: '5555' }]),
}));
vi.mock('../../pages/Trip/services', () => ({
  TripService: {
    getDrivers: vi.fn().mockResolvedValue({ data: [{ _id: 'd1', firstName: 'Vinod' }] }),
  },
  OCRService: { scan: vi.fn() },
}));
vi.mock('../../services/DriverVehicleAssignmentService', () => ({
  default: { getActiveAssignment: vi.fn().mockResolvedValue(null), idOf: (id) => id },
}));
vi.mock('../../services/FuelLogService', () => ({
  default: {
    getLastOdometer: vi.fn(),
    uploadDocument: vi.fn(),
    createFuelLog: vi.fn(),
    submitEntry: vi.fn(),
  },
}));

async function openForm(props = {}) {
  render(<FuelLogForm initialVehicleId="v1" initialDriverId="d1" {...props} />);
  await screen.findByText('WB01');
  await screen.findByText('Vinod');
  return screen.getByRole('button', { name: /Save diesel fill|Submit Fuel Log/ }).closest('form');
}
const change = (label, value) => changeField(screen.getByLabelText(label), { target: { value } });

describe('manual diesel entry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FuelLogService.getLastOdometer.mockResolvedValue(null);
    FuelLogService.submitEntry.mockResolvedValue({ id: 'saved' });
    URL.createObjectURL = vi.fn().mockReturnValue('blob:bill');
    URL.revokeObjectURL = vi.fn();
  });

  it('offers the bill photo first, reads it and saves it with the prefilled vehicle', async () => {
    OCRService.scan.mockResolvedValue({ success: true, data: { volume: 85, rate: 92 } });
    const form = await openForm({ photoFirst: true, lockVehicle: true });
    expect(screen.getByRole('region', { name: 'Bill photo' })).toBeVisible();
    expect(screen.queryByText('Add a bill or odometer photo (optional)')).not.toBeInTheDocument();
    const receipt = new File(['bill'], 'diesel-bill.jpg', { type: 'image/jpeg' });
    changeField(screen.getByLabelText('Upload fuel slip'), { target: { files: [receipt] } });
    await waitFor(() => expect(screen.getByLabelText('Litres')).toHaveValue(85));
    change(/Tank full after filling/, 'PARTIAL');
    fireEvent.submit(form);
    await waitFor(() => expect(FuelLogService.submitEntry).toHaveBeenCalled());
    expect(FuelLogService.submitEntry.mock.calls[0][0]).toMatchObject({
      payload: { vehicleId: 'v1' },
      documents: { fuel: { file: receipt } },
    });
  });

  it('saves a manual partial fill without a receipt, using the visible IST time', async () => {
    const onSuccess = vi.fn();
    const form = await openForm({ onSuccess, initialRefuelTime: '2026-10-31T04:30:00Z' });
    change('Litres', '40');
    change(/Tank full after filling/, 'PARTIAL');
    change(/Refuelling date and time/, '2026-10-31T10:15');
    fireEvent.submit(form);
    await waitFor(() => expect(FuelLogService.submitEntry).toHaveBeenCalled());
    expect(FuelLogService.submitEntry.mock.calls[0][0].payload).toMatchObject({
      vehicleId: 'v1',
      driverId: 'd1',
      fuelType: 'DIESEL',
      fillingType: 'PARTIAL',
      litres: 40,
      refuelTime: '2026-10-31T04:45:00.000Z',
    });
    expect(FuelLogService.uploadDocument).not.toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: 'saved' }));
  });

  it('requires an odometer before submitting a full-tank boundary', async () => {
    const form = await openForm();
    change('Litres', '85');
    change(/Tank full after filling/, 'FULL_TANK');
    fireEvent.submit(form);
    expect(FuelLogService.submitEntry).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/odometer/i);
  });

  it('allows a backdated odometer below a later fill and omits hidden partial odometers', async () => {
    FuelLogService.getLastOdometer.mockResolvedValue({
      odometerReading: 11000,
      refuelTime: '2026-11-01T10:00:00Z',
      fillingType: 'FULL_TANK',
    });
    const form = await openForm({ initialRefuelTime: '2026-10-31T04:30:00Z' });
    change('Litres', '85');
    change(/Tank full after filling/, 'FULL_TANK');
    change('Odometer at refuelling (km)', '10500');
    fireEvent.submit(form);
    await waitFor(() => expect(FuelLogService.submitEntry).toHaveBeenCalled());
    expect(FuelLogService.submitEntry.mock.calls[0][0].payload.odometerReading).toBe(10500);
    change(/Tank full after filling/, 'PARTIAL');
    fireEvent.submit(form);
    await waitFor(() => expect(FuelLogService.submitEntry).toHaveBeenCalledTimes(2));
    expect(FuelLogService.submitEntry.mock.calls[1][0].payload).not.toHaveProperty(
      'odometerReading',
    );
  });

  it('keeps user edits when receipt OCR finishes later', async () => {
    let finishScan;
    OCRService.scan.mockReturnValue(
      new Promise((resolve) => {
        finishScan = resolve;
      }),
    );
    await openForm();
    fireEvent.click(screen.getByText('Add a bill or odometer photo (optional)'));
    changeField(screen.getByLabelText('Upload fuel slip'), {
      target: { files: [new File(['bill'], 'bill.jpg', { type: 'image/jpeg' })] },
    });
    change(/Refuelling date and time/, '2026-10-31T10:15');
    change('Litres', '90');
    expect(screen.getByRole('button', { name: 'Reading photo…' })).toBeDisabled();
    finishScan({ success: true, data: { datetime: '2026-10-30 10:00', volume: 85, rate: 92 } });
    await waitFor(() => expect(screen.getByLabelText(/Rate per litre/)).toHaveValue(92));
    expect(screen.getByLabelText('Litres')).toHaveValue(90);
    expect(screen.getByLabelText(/Refuelling date and time/)).toHaveValue('2026-10-31T10:15');
  });

  it('ignores a scan result after its receipt is removed', async () => {
    let finishScan;
    OCRService.scan.mockReturnValue(
      new Promise((resolve) => {
        finishScan = resolve;
      }),
    );
    await openForm();
    fireEvent.click(screen.getByText('Add a bill or odometer photo (optional)'));
    changeField(screen.getByLabelText('Upload fuel slip'), {
      target: { files: [new File(['bill'], 'bill.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove fuel slip' }));
    finishScan({ success: true, data: { volume: 85 } });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Reading photo…' })).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Litres')).toHaveValue(null);
    expect(screen.queryByRole('button', { name: 'Remove fuel slip' })).not.toBeInTheDocument();
  });
});
