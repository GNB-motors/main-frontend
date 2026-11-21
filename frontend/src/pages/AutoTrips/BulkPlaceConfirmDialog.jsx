import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, MapPin, X } from 'lucide-react';
import { formatNum } from '../../utils/formatters';
import { placeCategoryLabel } from './placeQuestionCategories';
import './PlaceQuestions.css';

export default function BulkPlaceConfirmDialog({ review, progress, onOpenChange, onConfirm }) {
  const entries = review?.entries || [];
  const busy = progress?.busy;
  return (
    <Dialog
      open={Boolean(review)}
      onOpenChange={(open) => {
        if (!busy) onOpenChange(open);
      }}
    >
      <DialogContent className="atx-scope atx-place-bulk-dialog">
        <DialogHeader>
          <div className="atx-place-bulk-heading">
            <DialogTitle>Confirm suggested places</DialogTitle>
            <button
              type="button"
              className="atx-place-action atx-place-action--quiet"
              aria-label="Close confirmation"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <DialogDescription>
            Save {formatNum(entries.length)} selected {entries.length === 1 ? 'place' : 'places'}{' '}
            with the names and types below.
          </DialogDescription>
        </DialogHeader>
        <div className="atx-place-bulk-body">
          <p className="atx-place-bulk-scope">
            Save the selected names and types across your organisation. Matching trips outside this
            date range may also update. Fuel and rest stops leave trips open.
          </p>
          <ul className="atx-place-bulk-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <MapPin size={16} aria-hidden="true" />
                <div>
                  <strong>{entry.payload.name}</strong>
                  <span>{placeCategoryLabel(entry.payload.category)}</span>
                </div>
                <span>
                  {entry.tripsAffected == null ? '—' : formatNum(entry.tripsAffected)} trips
                </span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter className="atx-place-bulk-footer">
          <button
            type="button"
            className="atx-place-action"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="atx-place-action atx-place-action--primary"
            disabled={busy || !entries.length}
            onClick={onConfirm}
          >
            <Check size={15} aria-hidden="true" />
            {busy
              ? `Saving ${formatNum(progress.done)} of ${formatNum(progress.total)}…`
              : `Confirm ${formatNum(entries.length)} ${entries.length === 1 ? 'place' : 'places'}`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
