import { Truck } from 'lucide-react';
import { DASH, normalizePlate, officeRow, topCandidate } from './officeBill';

/**
 * The card that moves a confirmed bill to another truck: the truck it sits on
 * now, a Change button, and — once changing — the new truck and a reason.
 */
const OfficeChangeTruckCard = ({
  capture,
  suggestion,
  vehicles,
  plate,
  editing,
  reason,
  saving,
  onChoose,
  onReasonChange,
  onSave,
  onStartEdit,
  onCancel,
}) => {
  const row = officeRow(capture);
  const top = topCandidate(suggestion || capture?.suggestion);
  const disagreement =
    top &&
    plate &&
    normalizePlate(plate) !== normalizePlate(top.registrationNumber) &&
    top.certainty?.kind === 'sure';
  const inFleet = vehicles.some(
    (vehicle) => normalizePlate(vehicle.registrationNumber) === normalizePlate(plate),
  );

  return (
    <div className="ra-section-card">
      <div className="ra-section-card__title">
        <Truck size={15} /> Change truck
      </div>
      {editing ? (
        <>
          {disagreement && (
            <p role="alert">
              {`This differs from the strong prediction ${top.registrationNumber}: ${
                (top.reasons || []).join(', ') || 'No evidence provided'
              }.`}
            </p>
          )}
          <label className="ra-prop ra-prop--full">
            <span className="ra-prop__label">Truck</span>
            <input
              className="ra-input--plain"
              aria-label="Change truck"
              list={`office-edit-${capture.id}`}
              value={plate}
              onChange={(event) => onChoose(event.target.value)}
            />
          </label>
          <datalist id={`office-edit-${capture.id}`}>
            {vehicles.map((vehicle) => (
              /* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a datalist option, not a control on its own */
              <option
                key={vehicle._id || vehicle.id}
                value={vehicle.registrationNumber}
                label={vehicle.registrationNumber}
              />
            ))}
          </datalist>
          <label className="ra-prop ra-prop--full">
            <span className="ra-prop__label">Reason (required)</span>
            <input
              className="ra-input--plain"
              aria-label="Reason (required)"
              value={reason}
              maxLength={2000}
              onChange={(event) => onReasonChange(event.target.value)}
            />
          </label>
          <div className="ra-row-actions">
            <button
              type="button"
              className="ra-btn ra-btn--publish"
              disabled={
                saving ||
                !reason.trim() ||
                !inFleet ||
                normalizePlate(plate) === normalizePlate(row.plate)
              }
              onClick={onSave}
            >
              {saving ? 'Saving…' : 'Save change'}
            </button>
            <button type="button" className="ra-btn ra-btn--ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="ra-row-actions">
          <span className="ra-prop__val">{row.plate || DASH}</span>
          <button type="button" className="ra-btn ra-btn--ghost" onClick={onStartEdit}>
            Change
          </button>
        </div>
      )}
    </div>
  );
};

export default OfficeChangeTruckCard;
