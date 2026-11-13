import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, MapPin } from 'lucide-react';
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
          <DialogTitle>Confirm suggested places</DialogTitle>
          <DialogDescription>
            Review these {formatNum(entries.length)} suggested names and place types before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="atx-place-bulk-body">
          <div className="atx-place-bulk-explanation">
            <strong>What will happen</strong>
            <ul>
              <li>Save each name and place type below as confirmed by you.</li>
              <li>
                Update matching delivery trips where this place is the drop. Fuel and rest stops
                leave trips open.
              </li>
              <li>
                These place definitions apply across your organisation. Matching trips outside this
                date range may also update.
              </li>
            </ul>
          </div>
          <p className="atx-place-bulk-scope">
            Only the {formatNum(entries.length)} suggestions listed here will be confirmed. Other
            places stay in the review queue.
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
              : `Confirm ${formatNum(entries.length)} places`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
