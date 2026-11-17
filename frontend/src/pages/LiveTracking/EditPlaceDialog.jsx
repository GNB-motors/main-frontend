import { useState } from 'react';
import typeStyle from '../PlaceHub/intelligence/placeTypes.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog.jsx';
import { ErpSiteService } from '../../services/erpSiteService.js';
import PlaceHubService from '../PlaceHub/PlaceHubService.js';
import useSiteAnswer from '../PlaceHub/intelligence/useSiteAnswer.js';
import PlaceTypeSelect from './PlaceTypeSelect.jsx';
import { draftFromPlace, payloadFor } from '../PlaceHub/model/placeDraft.js';

/** Edit metadata in a modal; boundary drawing stays on the map. */
export default function EditPlaceDialog({ place, onClose, onSaved, onEditFence }) {
  const [name, setName] = useState(place.raw?.name || place.name || '');
  const [type, setType] = useState(place.raw?.siteType || place.type || 'UNKNOWN');
  const [radius, setRadius] = useState(place.radiusM || (place.source === 'warehouse' ? 300 : 100));
  const [address, setAddress] = useState(
    place.raw?.erpAddress ||
      (typeof place.raw?.address === 'string'
        ? place.raw.address
        : place.raw?.address?.formatted) ||
      '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const answer = useSiteAnswer(() => onSaved());
  const busy = saving || Boolean(answer.busyId);
  const { Icon: PlaceIcon, color: placeColor } = typeStyle(type);
  const warehouseId = place.raw?.legacy?.vehicleWarehouseId;
  const detected = place.source === 'site' && !place.erp && !warehouseId;
  const hasPolygon = Boolean(place.polygon?.length || place.polygonParts?.length);
  const canResize = !detected && !hasPolygon;
  const maxName = place.erp ? 120 : 200;
  const minRadius = place.source === 'warehouse' || warehouseId ? 100 : 50;
  const maxRadius = place.erp ? 5000 : 50000;

  const dirty =
    name !== (place.raw?.name || place.name || '') ||
    type !== (place.raw?.siteType || place.type || 'UNKNOWN') ||
    Number(radius) !== Number(place.radiusM || (place.source === 'warehouse' ? 300 : 100)) ||
    address !==
      (place.raw?.erpAddress ||
        (typeof place.raw?.address === 'string'
          ? place.raw.address
          : place.raw?.address?.formatted) ||
        '');

  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > maxName) {
      setError(`Enter a place name of 2–${maxName} characters.`);
      return;
    }
    if (
      canResize &&
      (!Number.isInteger(Number(radius)) ||
        Number(radius) < minRadius ||
        Number(radius) > maxRadius)
    ) {
      setError(`Radius must be a whole number between ${minRadius} and ${maxRadius} metres.`);
      return;
    }
    setError('');
    if (detected) {
      await answer.accept(place.raw, type, trimmed !== place.raw?.name ? trimmed : undefined);
      return;
    }
    setSaving(true);
    try {
      if (place.erp) {
        await ErpSiteService.update(place.sourceId, {
          name: trimmed,
          ...(address !==
          (place.raw?.erpAddress ||
            (typeof place.raw?.address === 'string'
              ? place.raw.address
              : place.raw?.address?.formatted) ||
            '')
            ? { address: address.trim() }
            : {}),
          ...(canResize ? { radiusM: Number(radius) } : {}),
        });
      } else if (place.source === 'warehouse' || warehouseId) {
        await PlaceHubService.updateWarehouse(warehouseId || place.sourceId, {
          name: trimmed,
          ...(canResize ? { geofenceRadiusM: Number(radius) } : {}),
        });
      } else if (place.source === 'zone') {
        const draft = draftFromPlace(place);
        if (!draft) throw new Error('This place cannot be edited.');
        await PlaceHubService.updateZone(
          place.sourceId,
          payloadFor({ ...draft, name: trimmed, radiusM: Number(radius) }),
        );
      } else {
        throw new Error('This place cannot be edited.');
      }
      onSaved();
    } catch (failure) {
      setError(
        failure?.displayMessage ||
          failure?.response?.data?.message ||
          failure?.message ||
          'Could not save this place. Please try again.',
      );
    } finally {
      setSaving(false);
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
              <span className="lt-place-modal-icon" style={{ '--lt-place-icon-color': placeColor }}>
                <PlaceIcon size={23} aria-hidden="true" />
              </span>
              <DialogTitle>Edit place</DialogTitle>
            </div>
            <DialogDescription>
              Update this saved place. Your changes apply to the existing record.
            </DialogDescription>
          </DialogHeader>
          <div className="lt-place-decision-fields">
            <label>
              Place name
              <input
                className="ph-text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={maxName}
                required
                disabled={busy}
              />
            </label>
            {detected ? (
              <label>
                Place type
                <PlaceTypeSelect value={type} onChange={setType} disabled={busy} />
              </label>
            ) : null}
            {place.erp ? (
              <label>
                Address (optional)
                <input
                  className="ph-text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  maxLength={300}
                  disabled={busy}
                />
              </label>
            ) : null}
            {canResize ? (
              <label>
                Fence radius (metres)
                <input
                  type="number"
                  className="ph-text"
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                  min={minRadius}
                  max={maxRadius}
                  step="1"
                  required
                  disabled={busy}
                />
              </label>
            ) : null}
            {onEditFence ? (
              <div className="lt-place-edit-boundary">
                <p>
                  To move the pin or redraw the boundary, use the map editor. Save any changes above
                  first.
                </p>
                <button
                  type="button"
                  className="ph-btn"
                  disabled={busy || dirty}
                  onClick={() => {
                    onClose();
                    onEditFence(place);
                  }}
                >
                  Edit fence on map
                </button>
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="lt-place-edit-error">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <button type="button" className="ph-btn" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ph-btn ph-btn--primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
