import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VehicleService } from './VehicleService';
import { VEHICLE_DOC_TYPES } from './Component/VehicleDocumentUpload';

export default function VehicleDocumentUploadDialog({ vehicle, docKey, onClose, onSaved }) {
  const meta = VEHICLE_DOC_TYPES.find((item) => item.backendType === docKey);
  const [files, setFiles] = useState({});
  const [expiryDate, setExpiryDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (busy || !meta) return;
    const sides = meta.sides.filter((side) => files[side]);
    if (!sides.length) {
      setError('Choose a document file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await VehicleService.uploadVehicleDocument(
        vehicle._id,
        meta.backendType,
        sides.map((side) => files[side]),
        { sides, ...(expiryDate ? { expiryDate } : {}) },
      );
      onSaved();
    } catch (err) {
      setError(
        err.displayMessage || err.message || 'Could not upload the document. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload {meta?.label || docKey}</DialogTitle>
          <DialogDescription>{vehicle.registrationNumber}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          {meta?.sides.map((side, index) => (
            <label key={side}>
              {' '}
              {meta.sides.length > 1 ? `${meta.label} ${side.toLowerCase()}` : meta.label}
              <input
                type="file"
                aria-label={`${meta.label} ${side.toLowerCase()}`}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required={index === 0}
                disabled={busy}
                onChange={(event) =>
                  setFiles((value) => ({ ...value, [side]: event.target.files?.[0] }))
                }
              />
            </label>
          ))}
          <label>
            Expiry date (optional)
            <input
              type="date"
              aria-label="Document expiry date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
              disabled={busy}
            />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" disabled={busy || !meta}>
              {busy ? 'Uploading…' : 'Upload document'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
