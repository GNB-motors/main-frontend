import PlaceEditor from '../PlaceHub/drawer/PlaceEditor.jsx';
import { ArrowLeft } from 'lucide-react';

/**
 * TrackZoneDraft — the Place Hub editor, used for "Alert zone here".
 *
 * The editor is Place Hub's own: the same kinds of fence, the same radius
 * control, the same alerts on entry and exit. Only the kind is fixed, because
 * a click on the map always means one zone.
 */
export default function TrackZoneDraft({
  draft,
  errors = {},
  error = null,
  saving = false,
  onChange,
  onKind,
  onPick,
  onCancel,
  onSave,
  backLabel = 'Back to map',
}) {
  return (
    <div
      role="dialog"
      aria-label="Alert zone here"
      className="lt-place-draft absolute right-4 top-4 z-[1200] w-[380px] max-w-[94vw] overflow-y-auto rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] shadow-[var(--rd-shadow-float)]"
    >
      <div className="dtop lt-draft-back">
        <button type="button" className="backbtn" onClick={onCancel} disabled={saving}>
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </button>
      </div>
      {error ? <p className="lt-map-draft-error" role="alert">{error}</p> : null}
      <PlaceEditor
        draft={draft}
        errors={errors}
        saving={saving}
        isLoaded
        allowHotspot={false}
        kinds={['ZONE']}
        onChange={onChange}
        onKind={onKind}
        onPick={onPick}
        onCancel={saving ? undefined : onCancel}
        onSave={onSave}
      />
    </div>
  );
}
