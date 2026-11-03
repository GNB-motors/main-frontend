import RadiusControl from '../PlaceHub/drawer/RadiusControl.jsx';
import { PLACE_RADIUS_MAX, PLACE_RADIUS_MIN } from './trackClickModel';

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
      className="absolute right-4 top-4 z-[1200] w-[340px] max-w-[92vw] rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-3 shadow-[var(--rd-shadow-float)]"
    >
      <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">Make this a place</h3>
      <p className="m-0 mt-1 text-[12px] text-[var(--rd-ink-3)]">
        Trucks that stop here will know this spot. Drag the circle on the map to set its edge.
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
          maxLength={200}
        />
      </div>

      <RadiusControl draft={draft} meta={RADIUS_META} error={null} onChange={onChange} />

      {error ? (
        <p role="alert" className="m-0 mt-1 text-[12px] text-[var(--rd-act-ink)]">
          {error}
        </p>
      ) : null}

      <div className="ph-btn-row mt-2">
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
