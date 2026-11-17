import { useState } from 'react';
import { Check, X, MapPin, CircleX } from 'lucide-react';
import typeStyle from '../PlaceHub/intelligence/placeTypes.js';
import TypeChips from '../PlaceHub/intelligence/TypeChips.jsx';
import { effectiveType, suggestion, typeLabel } from '../PlaceHub/intelligence/model/siteType.js';
import PlaceTypeSelect from './PlaceTypeSelect.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog.jsx';
import '../PlaceHub/intelligence/placeIntelligence.css';

/** Choosing a type stages a decision; only the dialog's Save writes it. */
export default function TrackReviewActions({ site, answer, onReviewLater }) {
  const [decision, setDecision] = useState(null);
  const [name, setName] = useState(site.name || '');
  const busy = answer.busyId === site._id;
  const hint = suggestion({ site });
  const current =
    site.status === 'CONFIRMED'
      ? site.siteType || effectiveType(site).type
      : effectiveType(site).type;
  const modalStyle = typeStyle(decision?.type);
  const ModalIcon = decision?.reject ? CircleX : decision?.type ? modalStyle.Icon : MapPin;
  const declaredWarehouse = site.status === 'CONFIRMED' && site.legacy?.vehicleWarehouseId;
  const choose = (type) => {
    setName(site.name || '');
    setDecision({ type });
  };

  return (
    <div className="pi-answer lt-review-actions">
      <p className="pi-answer-q">
        {site.status === 'CONFIRMED' ? 'Edit place type' : 'What is this place?'}
      </p>
      {declaredWarehouse ? (
        <p className="pi-note">Edit this warehouse’s name and boundary using Edit place.</p>
      ) : (
        <>
          {site.status === 'CONFIRMED' ? (
            <button
              type="button"
              className="pi-btn-yes"
              disabled={busy}
              onClick={() => choose(current)}
            >
              Edit name and type
            </button>
          ) : null}
          {hint && site.status === 'PROPOSED' ? (
            <button
              type="button"
              className="pi-btn-yes"
              disabled={busy}
              onClick={() => choose(hint.siteType)}
            >
              <Check size={15} /> Review as {typeLabel(hint.siteType).toLowerCase()}
            </button>
          ) : null}
          <TypeChips
            current={site.status === 'CONFIRMED' ? current : undefined}
            disabled={busy}
            onPick={choose}
          />
          <button
            type="button"
            className="pi-btn-quiet"
            disabled={busy}
            onClick={() => setDecision({ reject: true })}
          >
            <X size={14} /> Not a real place
          </button>
        </>
      )}
      {site.status === 'PROPOSED' ? (
        <div className="lt-review-later">
          <p className="pi-note">
            Select a type to review the name before saving. This place stays pending until you
            confirm it.
          </p>
          <button
            type="button"
            className="ph-btn ph-btn--ghost"
            disabled={busy}
            onClick={onReviewLater}
          >
            Review later
          </button>
        </div>
      ) : null}
      <Dialog
        open={Boolean(decision)}
        onOpenChange={(open) => {
          if (!open && !busy) setDecision(null);
        }}
      >
        <DialogContent className="lt-place-decision" onKeyDown={(event) => event.stopPropagation()}>
          <DialogHeader>
            <div className="lt-place-modal-heading">
              <span
                className={`lt-place-modal-icon${decision?.reject ? ' is-reject' : ''}`}
                style={decision?.reject ? undefined : { '--lt-place-icon-color': modalStyle.color }}
              >
                <ModalIcon size={23} aria-hidden="true" />
              </span>
              <DialogTitle>
                {decision?.reject
                  ? 'Mark as not a real place?'
                  : site.status === 'CONFIRMED'
                    ? 'Save place changes'
                    : 'Confirm place'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {decision?.reject
                ? 'This place will leave the review queue and stop claiming new vehicle stops.'
                : 'Review the place name and type. Save confirms this place and removes it from pending reviews.'}
            </DialogDescription>
          </DialogHeader>
          {!decision?.reject ? (
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
                />
              </label>
              <label>
                Place type
                <PlaceTypeSelect
                  value={decision?.type}
                  disabled={busy}
                  onChange={(type) => setDecision({ type })}
                />
              </label>
              <p className="pi-note">
                Name is optional. If left blank, the existing name or place type will be used.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              className="ph-btn"
              disabled={busy}
              onClick={() => setDecision(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ph-btn ph-btn--primary"
              disabled={busy}
              onClick={() =>
                decision.reject
                  ? answer.reject(site)
                  : answer.accept(
                      site,
                      decision.type,
                      name.trim() && name.trim() !== site.name ? name.trim() : undefined,
                    )
              }
            >
              {busy ? 'Saving…' : decision?.reject ? 'Confirm decision' : 'Save place'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
