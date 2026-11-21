import { useId, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import PlaceTypeSelect from '../../pages/LiveTracking/PlaceTypeSelect';
import typeStyle from '../../pages/PlaceHub/intelligence/placeTypes';
import './NamePlaceDialog.css';

/** Shared naming form for recorded stops in Trips and Live Tracking. */
export default function NamePlaceDialog({
  title = 'Name this place',
  description,
  initialName = '',
  initialType = '',
  maxLength = 200,
  options,
  onSave,
  onClose,
}) {
  const fieldId = useId();
  const inputRef = useRef(null);
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const { Icon, color } = typeStyle(type);
  const PlaceIcon = type ? Icon : MapPin;
  const close = () => {
    if (!saving.current) onClose();
  };
  const save = async (event) => {
    event.preventDefault();
    if (saving.current) return;
    if (!type || name.trim().length < 2) {
      setError('Choose a place type and enter a name of at least 2 characters.');
      return;
    }
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await onSave({ name: name.trim(), type });
      // A cancelled impact confirmation leaves the form available to edit.
      if (result !== false) onClose();
    } catch (failure) {
      setError(
        failure?.displayMessage ||
          failure?.response?.data?.message ||
          failure?.message ||
          'Could not save this place. Please try again.',
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        initialFocus={inputRef}
        className="name-place-dialog"
        onKeyDown={(event) => event.stopPropagation()}
      >
        <form onSubmit={save} aria-busy={busy}>
          <DialogHeader>
            <div className="name-place-heading">
              <span className="name-place-icon" style={{ '--place-icon-color': color }}>
                <PlaceIcon size={20} aria-hidden="true" />
              </span>
              <DialogTitle>{title}</DialogTitle>
              <button
                type="button"
                className="name-place-close"
                onClick={close}
                disabled={busy}
                aria-label="Close naming dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="name-place-fields">
            <label htmlFor={`${fieldId}-name`}>
              Place name
              <input
                ref={inputRef}
                id={`${fieldId}-name`}
                aria-label="Place name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={maxLength}
                placeholder="e.g. Dankuni truck parking"
                disabled={busy}
                required
              />
            </label>
            <label htmlFor={`${fieldId}-type`}>
              Place type
              <PlaceTypeSelect
                id={`${fieldId}-type`}
                value={type}
                onChange={setType}
                disabled={busy}
                options={options}
              />
            </label>
            {error ? (
              <p role="alert" className="name-place-error">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <button type="button" className="name-place-button" onClick={close} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="name-place-button is-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save place'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
