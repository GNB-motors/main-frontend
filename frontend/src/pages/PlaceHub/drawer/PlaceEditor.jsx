import { Flame, Hexagon, Warehouse, BellRing, Undo2, Eraser, Check } from 'lucide-react';
import LocationSearch from '../LocationSearch.jsx';
import { TypeTile } from '../PlaceHubPanels.jsx';
import { KIND_META, coordsLabel, addressParts } from '../placeHubModel.js';
import Frame from './Frame.jsx';
import Field from './Field.jsx';
import RadiusControl from './RadiusControl.jsx';

const KIND_ICON = { WAREHOUSE: Warehouse, ZONE: Hexagon, HOTSPOT: Flame };

export default function PlaceEditor({
  draft,
  errors,
  saving,
  isLoaded,
  allowHotspot,
  onChange,
  onKind,
  onPick,
  onCancel,
  onSave,
}) {
  const meta = KIND_META[draft.kind];
  const Icon = KIND_ICON[draft.kind];
  const kinds = Object.keys(KIND_META).filter((k) => k !== 'HOTSPOT' || allowHotspot);
  const verb = draft.mode === 'edit' ? 'Edit' : 'Add';

  const pick = (loc) => {
    const patch = draft.shape === 'circle' ? { center: { lat: loc.lat, lng: loc.lng } } : {};
    if (!draft.name.trim()) patch.name = loc.label.split(',')[0];
    if (draft.kind === 'WAREHOUSE' && !draft.address.trim())
      Object.assign(patch, addressParts(loc.result));
    onChange(patch);
    onPick(loc);
  };

  return (
    <Frame
      icon={<TypeTile type={draft.kind} Icon={Icon} size={40} />}
      eyebrow={draft.mode === 'edit' ? 'Editing' : 'New place'}
      title={`${verb} ${meta.label.toLowerCase()}`}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            className="ph-btn ph-btn--ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <span className="ph-spacer" />
          <button
            type="button"
            className="ph-btn ph-btn--primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : draft.mode === 'edit' ? 'Save changes' : 'Save place'}
          </button>
        </>
      }
    >
      {draft.mode === 'create' && (
        <div className="ph-kinds" role="radiogroup" aria-label="What is this place?">
          {kinds.map((k) => {
            const KIcon = KIND_ICON[k];
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={draft.kind === k}
                className={`ph-kind${draft.kind === k ? ' is-on' : ''}`}
                onClick={() => onKind(k)}
              >
                <KIcon size={16} />
                <span>{KIND_META[k].label}</span>
              </button>
            );
          })}
        </div>
      )}
      <p className="ph-muted">{meta.hint}</p>

      <Field label="Find on map" hint="Search, or click straight on the map.">
        <LocationSearch
          isLoaded={isLoaded}
          onPick={pick}
          placeholder="Search an address or landmark"
        />
      </Field>

      <Field label="Name" error={errors.name}>
        <input
          className="ph-text"
          aria-label="Name"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={draft.kind === 'WAREHOUSE' ? 'e.g. Dankuni yard' : 'e.g. Tata Steel gate 3'}
          maxLength={200}
        />
      </Field>

      {draft.kind === 'WAREHOUSE' && (
        <Field label="Code" error={errors.code} hint="Optional short code, like DKN.">
          <input
            className="ph-text ph-mono"
            aria-label="Code"
            value={draft.code}
            onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
            maxLength={20}
          />
        </Field>
      )}

      {meta.polygon && (
        <div className="ph-field">
          <span className="ph-field-label">Shape</span>
          <div className="ph-seg ph-seg--full" role="tablist" aria-label="Shape">
            {[
              { id: 'circle', label: 'Circle' },
              { id: 'polygon', label: 'Draw outline' },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                role="tab"
                aria-selected={draft.shape === o.id}
                className={`ph-seg-btn${draft.shape === o.id ? ' is-on' : ''}`}
                onClick={() => onChange({ shape: o.id })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {draft.shape === 'polygon' ? (
        <div className={`ph-field${errors.shape ? ' has-error' : ''}`}>
          <span className="ph-field-label">Outline</span>
          <div className="ph-outline">
            <span>
              {draft.polygonDone
                ? `Closed · ${draft.polygon.length} points`
                : draft.polygon.length
                  ? `${draft.polygon.length} point${draft.polygon.length > 1 ? 's' : ''} — keep clicking the map`
                  : 'Click the map to place the first corner'}
            </span>
            <div className="ph-btn-row">
              {!draft.polygonDone && draft.polygon.length > 0 && (
                <button
                  type="button"
                  className="ph-btn ph-btn--sm"
                  onClick={() => onChange({ polygon: draft.polygon.slice(0, -1) })}
                >
                  <Undo2 size={13} /> Undo
                </button>
              )}
              {draft.polygon.length > 0 && (
                <button
                  type="button"
                  className="ph-btn ph-btn--sm"
                  onClick={() => onChange({ polygon: [], polygonDone: false })}
                >
                  <Eraser size={13} /> Clear
                </button>
              )}
              {!draft.polygonDone && draft.polygon.length >= 3 && (
                <button
                  type="button"
                  className="ph-btn ph-btn--sm ph-btn--primary"
                  onClick={() => onChange({ polygonDone: true })}
                >
                  <Check size={13} /> Finish
                </button>
              )}
            </div>
          </div>
          {errors.shape && <em className="ph-field-error">{errors.shape}</em>}
        </div>
      ) : (
        <>
          <div className={`ph-field${errors.shape ? ' has-error' : ''}`}>
            <span className="ph-field-label">Pin</span>
            <p className="ph-pin">
              {draft.center ? (
                <span className="ph-mono">{coordsLabel(draft.center.lat, draft.center.lng)}</span>
              ) : (
                'Click the map to drop the pin'
              )}
            </p>
            {errors.shape && <em className="ph-field-error">{errors.shape}</em>}
          </div>
          <RadiusControl draft={draft} meta={meta} error={errors.radiusM} onChange={onChange} />
        </>
      )}

      {draft.kind === 'ZONE' && (
        <div className="ph-field">
          <span className="ph-field-label">
            <BellRing size={13} /> Alerts
          </span>
          <label className="ph-toggle">
            <input
              type="checkbox"
              aria-label="Alert when a truck enters"
              checked={draft.alertOnEntry}
              onChange={(e) => onChange({ alertOnEntry: e.target.checked })}
            />
            <span>When a truck enters</span>
          </label>
          <label className="ph-toggle">
            <input
              type="checkbox"
              aria-label="Alert when a truck leaves"
              checked={draft.alertOnExit}
              onChange={(e) => onChange({ alertOnExit: e.target.checked })}
            />
            <span>When a truck leaves</span>
          </label>
        </div>
      )}

      {draft.kind === 'WAREHOUSE' && (
        <details className="ph-details" open={Boolean(draft.address)}>
          <summary>Address (optional)</summary>
          <Field label="Address">
            <input
              className="ph-text"
              aria-label="Address"
              value={draft.address}
              onChange={(e) => onChange({ address: e.target.value })}
            />
          </Field>
          <div className="ph-grid-3">
            <Field label="City">
              <input
                className="ph-text"
                aria-label="City"
                value={draft.city}
                onChange={(e) => onChange({ city: e.target.value })}
              />
            </Field>
            <Field label="State">
              <input
                className="ph-text"
                aria-label="State"
                value={draft.state}
                onChange={(e) => onChange({ state: e.target.value })}
              />
            </Field>
            <Field label="Pincode">
              <input
                className="ph-text"
                aria-label="Pincode"
                value={draft.pincode}
                onChange={(e) => onChange({ pincode: e.target.value })}
                inputMode="numeric"
              />
            </Field>
          </div>
        </details>
      )}
    </Frame>
  );
}
