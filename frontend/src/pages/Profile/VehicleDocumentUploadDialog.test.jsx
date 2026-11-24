import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VehicleDocumentUploadDialog from './VehicleDocumentUploadDialog';
import { VehicleService } from './VehicleService';
vi.mock('./VehicleService', () => ({ VehicleService: { uploadVehicleDocument: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  VehicleService.uploadVehicleDocument.mockResolvedValue({});
});
it('uploads selected front and back files to the specific truck and document type', async () => {
  const saved = vi.fn();
  render(
    <VehicleDocumentUploadDialog
      vehicle={{ _id: 'truck1', registrationNumber: 'WB11T0662' }}
      docKey="RC"
      onClose={vi.fn()}
      onSaved={saved}
    />,
  );
  const front = new File(['front'], 'front.png', { type: 'image/png' });
  const back = new File(['back'], 'back.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('RC front'), { target: { files: [front] } });
  fireEvent.change(screen.getByLabelText('RC back'), { target: { files: [back] } });
  fireEvent.change(screen.getByLabelText('Document expiry date'), {
    target: { value: '2027-11-24' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Upload document' }).closest('form'));
  await waitFor(() =>
    expect(VehicleService.uploadVehicleDocument).toHaveBeenCalledWith(
      'truck1',
      'RC',
      [front, back],
      { sides: ['FRONT', 'BACK'], expiryDate: '2027-11-24' },
    ),
  );
  expect(saved).toHaveBeenCalledOnce();
});
it('retains the selected file and offers another attempt after an upload fails', async () => {
  VehicleService.uploadVehicleDocument.mockRejectedValue(new Error('Upload unavailable'));
  render(
    <VehicleDocumentUploadDialog
      vehicle={{ _id: 'truck1', registrationNumber: 'WB11T0662' }}
      docKey="INSURANCE"
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  const file = new File(['insurance'], 'policy.pdf', { type: 'application/pdf' });
  fireEvent.change(screen.getByLabelText('Insurance single'), { target: { files: [file] } });
  fireEvent.submit(screen.getByRole('button', { name: 'Upload document' }).closest('form'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Upload unavailable');
  expect(screen.getByLabelText('Insurance single').files[0]).toBe(file);
  expect(screen.getByRole('button', { name: 'Upload document' })).toBeEnabled();
});
