import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
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
        <form className="sap-panel" onSubmit={submit}>
          <div className="sap-dialog-body">
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
            <p className="sap-muted">
              Enter the one-way reference distance for this plant and drop.
            </p>
            <label>
              Note (optional)
              <textarea
                aria-label="Note (optional)"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="sap-notice">
              <Info size={16} aria-hidden="true" />
              <span>This manual reference takes priority over the SAP sheet for this route.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" disabled={mutation.loading} onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!valid || mutation.loading} type="submit">
              {mutation.loading ? 'Saving…' : 'Save SAP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
