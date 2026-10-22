import { useDeferredValue, useState } from 'react';
import { Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
import PlacePicker from './PlacePicker';
import { BASIS_LABEL, COMPARED_WITH, hintText } from './sapModel';

/**
 * Set a route's SAP. With `from` and `to` it is that route (a trip's, or a row of the routes
 * list); without them the person picks the two places — a route no trip has run yet.
 * The basis is the person's call (one way by default); the road engine only hints.
 */
export default function SetSapDialog({ from = null, to = null, current = null, onClose, onSaved }) {
  const [ends, setEnds] = useState({ from, to });
  const [km, setKm] = useState(current?.sapKm != null ? String(current.sapKm) : '');
  const [basis, setBasis] = useState(current?.basis || 'ONE_WAY');
  const [note, setNote] = useState(current?.note || '');
  const mutation = useMutation(SapService.setRoute);
  const placed = Boolean(ends.from?.id && ends.to?.id);
  const sameEnds = placed && ends.from.id === ends.to.id;
  const typed = useDeferredValue(Number(km) > 0 ? Number(km) : null);
  const hint = useApi(
    (signal) =>
      SapService.hint(
        { fromSiteId: ends.from.id, toSiteId: ends.to.id, ...(typed ? { sapKm: typed } : {}) },
        { signal },
      ),
    [ends.from?.id, ends.to?.id, typed],
    { enabled: placed && !sameEnds },
  );
  const valid = placed && !sameEnds && Number(km) >= 1 && Number(km) <= 3000;
  const advice = hintText(hint.data, typed);
  const submit = async (e) => {
    e.preventDefault();
    if (!valid || mutation.loading) return;
    try {
      await mutation.mutate({
        fromSiteId: ends.from.id,
        toSiteId: ends.to.id,
        sapKm: Number(km),
        basis,
        note,
      });
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Could not save SAP');
    }
  };
  const pick = (end) => (id, site) =>
    setEnds((cur) => ({ ...cur, [end]: { id, name: site?.name || site?.siteType || 'Place' } }));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.loading) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current ? 'Change route SAP' : 'Set route SAP'}</DialogTitle>
          <DialogDescription>
            {ends.from?.name || 'Plant'} → {ends.to?.name || 'Drop'}
          </DialogDescription>
        </DialogHeader>
        <form className="sap-panel" onSubmit={submit}>
          <div className="sap-dialog-body">
            {!from && (
              <PlacePicker
                label={ends.from ? `Plant: ${ends.from.name} (change)` : 'Plant (loading place)'}
                disabled={mutation.loading}
                onChoose={pick('from')}
              />
            )}
            {!to && (
              <PlacePicker
                label={ends.to ? `Drop: ${ends.to.name} (change)` : 'Drop (unloading place)'}
                disabled={mutation.loading}
                onChoose={pick('to')}
              />
            )}
            {sameEnds && <p className="sap-error">Choose two different places.</p>}
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
            <fieldset className="sap-stack">
              <legend>This SAP km pays for</legend>
              {['ONE_WAY', 'ROUND_TRIP'].map((b) => (
                <label key={b} className="sap-row">
                  <input
                    type="radio"
                    name="basis"
                    aria-label={BASIS_LABEL[b]}
                    value={b}
                    checked={basis === b}
                    onChange={() => setBasis(b)}
                  />
                  {BASIS_LABEL[b]}
                  <span className="sap-muted">
                    — compared with {COMPARED_WITH[b].toLowerCase()}
                  </span>
                </label>
              ))}
            </fieldset>
            {advice && (
              <div className="sap-notice" role="status">
                <Info size={16} aria-hidden="true" />
                <span>{advice}</span>
              </div>
            )}
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
