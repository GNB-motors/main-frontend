import { useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog.jsx';
import { useConfirm } from '../../components/ui/confirmContext';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';
import { impactSummary, isImpactGate } from '../PlaceHub/intelligence/model/requestOutcome.js';
import typeStyle from '../PlaceHub/intelligence/placeTypes.js';
import PlaceTypeSelect from './PlaceTypeSelect.jsx';

export default function IdentifyJourneyPlaceDialog({ stop, registrationNumber, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const confirm = useConfirm();
  const { Icon, color } = typeStyle(type);
  const PlaceIcon = type ? Icon : MapPin;
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!type || name.trim().length < 2) {
      setError('Choose a place type and enter a name of at least 2 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const identify = stop.stopId
        ? PlaceIntelligenceService.identifyStopPlace
        : PlaceIntelligenceService.identifyTrackPointPlace;
      const body = {
        ...(stop.stopId ? { id: stop.stopId } : { registrationNumber, at: stop.fixAt }),
        name: name.trim(),
        siteType: type,
      };
      let result;
      try {
        result = await identify(body);
      } catch (failure) {
        if (!isImpactGate(failure)) throw failure;
        const approved = await confirm({
          title: 'Confirm this warehouse?',
          body: impactSummary(failure.body.impact),
          confirmLabel: 'Confirm warehouse',
        });
        if (!approved) return;
        result = await identify({ ...body, confirmImpact: true });
      }
      onSaved(result);
    } catch (failure) {
      setError(
        failure?.displayMessage ||
          failure?.response?.data?.message ||
          failure?.message ||
          'Could not save this place. Please try again.',
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
      <DialogContent className="lt-place-decision" onKeyDown={(event) => event.stopPropagation()}>
        <form onSubmit={save}>
          <DialogHeader>
            <div className="lt-place-modal-heading">
              <span className="lt-place-modal-icon" style={{ '--lt-place-icon-color': color }}>
                <PlaceIcon size={23} aria-hidden="true" />
              </span>
              <DialogTitle>Identify this place</DialogTitle>
            </div>
            <DialogDescription>
              Name this recorded location and choose its type. Saving updates the journey without
              changing your replay range.
            </DialogDescription>
          </DialogHeader>
          <div className="lt-place-decision-fields">
            <label>
              Place name
              <input
                className="ph-text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={200}
                placeholder="e.g. Dankuni truck parking"
                disabled={busy}
                required
              />
            </label>
            <label>
              Place type
              <PlaceTypeSelect value={type} onChange={setType} disabled={busy} />
            </label>
            {error ? (
              <p role="alert" className="lt-place-edit-error">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <button type="button" className="ph-btn" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="ph-btn ph-btn--primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save place'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
