import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
export default function SetSapDialog({ trip, onClose, onSaved }) {
  const [km, setKm] = useState('');
  const [note, setNote] = useState('');
  const mutation = useMutation(SapService.setRouteKm);
  const valid =
    Number(km) >= 1 && Number(km) <= 3000 && trip.pickup?.orgSiteId && trip.drop?.orgSiteId;
  const submit = async (e) => {
    e.preventDefault();
    if (!valid || mutation.loading) return;
    try {
      await mutation.mutate({
        fromSiteId: trip.pickup.orgSiteId,
        toSiteId: trip.drop.orgSiteId,
        sapKm: Number(km),
        note,
      });
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Could not save SAP');
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.loading) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set SAP km</DialogTitle>
          <DialogDescription>
            {trip.pickup?.name || 'Plant'} → {trip.drop?.name || 'Drop'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="sap-panel">
            <label>
              SAP km
              <input
                type="number"
                aria-label="SAP km"
                min="1"
                max="3000"
                step="any"
                required
                value={km}
                onChange={(e) => setKm(e.target.value)}
              />
            </label>
            <label>
              Note (optional)
              <textarea
                aria-label="Note (optional)"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          <DialogFooter>
            <button className="sap-btn" type="button" disabled={mutation.loading} onClick={onClose}>
              Cancel
            </button>
            <button
              className="sap-btn sap-btn--primary"
              disabled={!valid || mutation.loading}
              type="submit"
            >
              {mutation.loading ? 'Saving…' : 'Save SAP'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
