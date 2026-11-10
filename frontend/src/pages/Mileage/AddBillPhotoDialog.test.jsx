import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import AddBillPhotoDialog from './AddBillPhotoDialog';
import billPhotoService from '../../services/billPhotoService';
import { getVehicleList } from '../../services/vehicleListService';
vi.mock('../../services/billPhotoService', () => ({ default: { uploadBillPhoto: vi.fn() } }));
vi.mock('../../services/vehicleListService', () => ({ getVehicleList: vi.fn() }));
const file = () => new File(['bill'], 'diesel-slip.jpg', { type: 'image/jpeg' });
function open(props = {}) {
  render(
    <AddBillPhotoDialog
      open
      vehicleId="v1"
      registrationNumber="WB11T0662"
      onOpenChange={vi.fn()}
      {...props}
    />,
  );
}
function chooseFile() {
  fireEvent.change(screen.getByLabelText('Bill photo'), { target: { files: [file()] } });
}
function confirmPartial() {
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
  fireEvent.click(screen.getByRole('combobox', { name: 'Tank full?' }));
  fireEvent.click(screen.getByRole('option', { name: 'No — partial fill' }));
}
describe('compact bill-photo dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billPhotoService.uploadBillPhoto.mockResolvedValue({ id: 'log1', reviewStatus: 'AUTO_OK' });
    getVehicleList.mockResolvedValue([{ _id: 'v2', registrationNumber: 'WB11S1962' }]);
  });
  it('opens the compact upload screen, prefilled with the vehicle context', async () => {
    open();
    const dialog = await screen.findByRole('dialog', { name: 'Add bill photo' });
    expect(within(dialog).getByText('Drop a bill photo or click to choose')).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Bill type' })).toHaveTextContent(
      'Diesel slip',
    );
    expect(dialog).toHaveTextContent('WB11T0662');
    expect(screen.queryByLabelText('Litres')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
    expect(getVehicleList).not.toHaveBeenCalled();
  });
  it('shows and removes the chosen file without sending anything', () => {
    open();
    chooseFile();
    expect(screen.getByText('diesel-slip.jpg')).toBeInTheDocument();
    expect(billPhotoService.uploadBillPhoto).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove diesel-slip.jpg' }));
    expect(screen.queryByText('diesel-slip.jpg')).not.toBeInTheDocument();
  });
  it('requires a tank-fill choice and explicit confirmation, then sends the real vehicle id', async () => {
    const saved = vi.fn();
    open({ onConfirmed: saved });
    chooseFile();
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(billPhotoService.uploadBillPhoto).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Upload & save' })).toBeDisabled();
    fireEvent.click(screen.getByRole('combobox', { name: 'Tank full?' }));
    fireEvent.click(screen.getByRole('option', { name: 'Yes — full tank' }));
    fireEvent.click(screen.getByRole('button', { name: 'Upload & save' }));
    await waitFor(() =>
      expect(saved).toHaveBeenCalledWith({ id: 'log1', reviewStatus: 'AUTO_OK' }),
    );
    const body = billPhotoService.uploadBillPhoto.mock.calls[0][0].body;
    expect(body.get('vehicleId')).toBe('v1');
    expect(body.get('fuelType')).toBe('DIESEL');
    expect(body.get('fillingType')).toBe('FULL_TANK');
    expect(body.get('fuelPhoto').name).toBe('diesel-slip.jpg');
  });
  it('requires a vehicle selection from Mileage instead of claiming an automatic match', async () => {
    open({ vehicleId: '', registrationNumber: '' });
    chooseFile();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Vehicle' })).not.toBeDisabled(),
    );
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
    fireEvent.click(screen.getByRole('combobox', { name: 'Vehicle' }));
    fireEvent.click(await screen.findByRole('option', { name: 'WB11S1962' }));
    expect(screen.getByRole('button', { name: 'Upload' })).not.toBeDisabled();
    expect(screen.queryByText(/work out which truck it belongs to/)).not.toBeInTheDocument();
  });
  it('shows the backend mismatch review flag without silently changing the truck', async () => {
    billPhotoService.uploadBillPhoto.mockResolvedValue({
      id: 'log1',
      reviewStatus: 'NEEDS_REVIEW',
      reviewReasons: ['VEHICLE_NO_MISMATCH'],
    });
    open();
    chooseFile();
    confirmPartial();
    fireEvent.click(screen.getByRole('button', { name: 'Upload & save' }));
    expect(await screen.findByText('Bill saved for WB11T0662')).toBeInTheDocument();
    expect(
      screen.getByText('The registration read from the bill differs from the selected truck.'),
    ).toBeInTheDocument();
    expect(billPhotoService.uploadBillPhoto.mock.calls[0][0].body.get('vehicleId')).toBe('v1');
  });
  it('shows failed uploads and permits retry without a success callback', async () => {
    const saved = vi.fn();
    billPhotoService.uploadBillPhoto.mockRejectedValueOnce(new Error('Upload failed'));
    open({ onConfirmed: saved });
    chooseFile();
    confirmPartial();
    fireEvent.click(screen.getByRole('button', { name: 'Upload & save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Upload failed');
    expect(saved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Upload & save' }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
  });
  it('rejects unsupported files', () => {
    open();
    fireEvent.change(screen.getByLabelText('Bill photo'), {
      target: { files: [new File(['x'], 'unsafe.exe', { type: 'application/octet-stream' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG');
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('shows the server guidance when the photo was filed somewhere else', async () => {
    billPhotoService.uploadBillPhoto.mockResolvedValue({
      id: 'log1',
      reviewStatus: 'AUTO_OK',
      guidance: {
        status: 'filed_elsewhere',
        message:
          'This looks like an odometer photo, not a fuel slip. We have saved it as an odometer reading.',
      },
    });
    open();
    chooseFile();
    confirmPartial();
    fireEvent.click(screen.getByRole('button', { name: 'Upload & save' }));
    expect(
      await screen.findByText(
        'This looks like an odometer photo, not a fuel slip. We have saved it as an odometer reading.',
      ),
    ).toBeInTheDocument();
  });

  it('asks for a retake when the server could not read the photo', async () => {
    billPhotoService.uploadBillPhoto.mockResolvedValue({
      id: 'log1',
      reviewStatus: 'NEEDS_REVIEW',
      guidance: { status: 'reupload', message: 'Please retake this photo in better light.' },
    });
    open();
    chooseFile();
    confirmPartial();
    fireEvent.click(screen.getByRole('button', { name: 'Upload & save' }));
    expect(
      await screen.findByText('Please retake this photo in better light.'),
    ).toBeInTheDocument();
  });
});
