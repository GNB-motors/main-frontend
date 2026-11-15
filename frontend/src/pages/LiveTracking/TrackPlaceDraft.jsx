import RadiusControl from '../PlaceHub/drawer/RadiusControl.jsx';
import { PLACE_RADIUS_MAX, PLACE_RADIUS_MIN } from './trackClickModel';
import { ArrowLeft, MapPinPlus } from 'lucide-react';

/** The radius a place may have: 50 m to 5 km. */
const RADIUS_META = {
  minRadius: PLACE_RADIUS_MIN,
  maxRadius: PLACE_RADIUS_MAX,
  defaultRadius: 100,
};

/**
 * TrackPlaceDraft — the sheet that turns a clicked spot into a place.
 *
 * It reuses Place Hub's own radius control, so the fence a manager drags on
 * the Track map is set in the same units and steps as everywhere else.
 */
export default function TrackPlaceDraft({
  draft,
  onChange,
  onCancel,
  onSave,
  saving = false,
  error = null,
}) {
  return (
    <section
      role="dialog"
      aria-label="Make this a place"
      className="lt-place-draft lt-location-draft absolute right-4 top-4 z-[1200] w-[340px] max-w-[92vw] overflow-y-auto rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] shadow-[var(--rd-shadow-float)]"
    >
      <div className="dtop lt-draft-back">
        <button type="button" className="backbtn" onClick={onCancel} disabled={saving}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to map
        </button>
      </div>
      <div className="lt-draft-content">
        <div className="lt-location-draft-title">
          <span className="lt-location-draft-symbol">
            <MapPinPlus size={22} aria-hidden="true" />
          </span>
          <div>
            <span className="lt-location-draft-eyebrow">New place</span>
            <h3>Save this location</h3>
          </div>
        </div>
        <p className="m-0 mt-1 text-[12px] text-[var(--rd-ink-3)]">
          Give this spot a name, then adjust the circle to cover the place.
        </p>

        <div className="ph-field mt-2">
          <span className="ph-field-label">Name</span>
          <input
            id="track-place-name"
            className="ph-text"
            aria-label="Name"
            value={draft?.name || ''}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="e.g. Tata Steel gate 3"
            maxLength={120}
          />
        </div>

        <RadiusControl draft={draft} meta={RADIUS_META} error={null} onChange={onChange} />

        {error ? (
          <p role="alert" className="m-0 mt-1 text-[12px] text-[var(--rd-act-ink)]">
            {error}
          </p>
        ) : null}
      </div>
      <div className="ph-btn-row lt-draft-footer">
        <button type="button" className="ph-btn ph-btn--ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className="ph-btn ph-btn--primary"
          onClick={onSave}
          disabled={saving}
          data-testid="save-place"
        >
          {saving ? 'Saving…' : 'Save place'}
        </button>
      </div>
    </section>
  );
}
