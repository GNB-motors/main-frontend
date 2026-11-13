import { Fuel, Clock, Store, AlertTriangle, CheckCircle2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import {
  predictedEvidenceLines,
  suggestedLitres,
  fillTimeFromDraft,
  matchedRiseText,
} from './predictedTime';
import { fmtDate } from './receiptFormat';
import { truckCandidates, vehicleIdOf } from './chatDraft';
import { missingKeyFields } from './keyFields';

/**
 * Every field of a chat-import row, ready to be checked and changed.
 *
 * A photo sent in a chat does not always say which truck it belongs to, how
 * many litres were filled or when it happened. A person checks the parts that
 * are missing or unsure here, and the approve call carries what they changed.
 */
const ChatDraftEditor = ({ draft, edits, onChange, vehicles = [], vehiclesError = '' }) => {
  if (!draft || !edits) return null;

  const set = (patch) => onChange({ ...edits, ...patch });
  const candidates = truckCandidates(draft);
  const predicted = draft.time?.predicted || null;
  const evidence = predictedEvidenceLines(predicted?.evidence);
  const litresSuggestion = suggestedLitres(predicted);
  const fill = fillTimeFromDraft(draft);
  const missing = new Set(missingKeyFields(draft, edits).map((field) => field.key));

  // The trucks a person can pick: the ones this photo could be, plus every
  // vehicle of the org.
  const options = [];
  const seen = new Set();
  const addOption = (value, label) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    options.push({ value, label });
  };
  candidates.slice(0, 3).forEach((c) => {
    addOption(c.vehicleId || c.reg, c.reg || c.vehicleId || 'Truck');
  });
  vehicles.forEach((v) => {
    const id = v?._id || v?.id;
    if (!id) return;
    addOption(
      id,
      `${v.registrationNumber || v.vehicleNumber || id}${v.model ? ` · ${v.model}` : ''}`,
    );
  });
  // The truck the row already carries stays selectable, even when the org list
  // does not know it.
  if (edits.vehicleId && !seen.has(edits.vehicleId)) {
    addOption(
      edits.vehicleId,
      `${draft.vehicleId?.registrationNumber || draft.truck?.plate || edits.vehicleId} · current`,
    );
  }

  // Why the truck is unsure — only when the server said why in words.
  const truckSource = String(draft.truck?.source || '').trim();
  const truckReason =
    draft.checks?.TRUCK_ONE?.detail || (truckSource && truckSource !== 'CHAT' ? truckSource : '');

  // The overall level of the match, when the server sent one.
  const overallLevel = draft.truck?.level || draft.truck?.overallLevel || '';

  // A truck picked by a person is a person’s choice, not our measurement.
  const pickedByPerson = Boolean(edits.vehicleId) && edits.vehicleId !== vehicleIdOf(draft);

  const typedTime = edits.timeAt || '';
  const timeReady = typedTime && !Number.isNaN(new Date(typedTime).getTime());

  // The matched tank rise: the time and the litres, or a dash for what we
  // did not measure.
  const riseText = matchedRiseText(predicted);
  const several = predicted?.evidence?.status === 'several' && !predicted?.at;

  return (
    <div className="ra-section-card ra-chat-editor">
      <div className="ra-section-card__title">
        <Fuel size={15} /> Check the fill before you approve it
      </div>

      <div className="ra-grid-props">
        {/* The truck */}
        <div
          className={`ra-prop ra-prop--full${missing.has('TRUCK') ? ' ra-prop--missing' : ''}`}
          data-key-field="TRUCK"
        >
          <span className="ra-prop__label">
            Truck <span className="ra-key-field-label">Key field</span>
          </span>
          {candidates.length > 0 && draft.truck?.bucket !== 'EXACT' && (
            <span className="ra-chat-note">
              <AlertTriangle size={12} /> We are not sure which truck this is. Pick the right one.
            </span>
          )}
          {truckReason && <span className="ra-chat-note">{truckReason}</span>}
          {overallLevel && <span className="ra-chat-note">Overall: {overallLevel}</span>}
          <SearchableSelect
            id="ra-chat-truck"
            className={`ra-select ra-select--plain${missing.has('TRUCK') ? ' ra-input--missing' : ''}`}
            placeholder="Select a truck"
            aria-label="Choose or change truck"
            aria-required="true"
            value={edits.vehicleId || ''}
            onChange={(event) => set({ vehicleId: event.target.value, truckPicked: true })}
          >
            <option value="">Select a truck</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SearchableSelect>
          {pickedByPerson && <span className="ra-chat-note">Selected by a person</span>}
          <input
            aria-label="Truck plate"
            aria-required="true"
            className={`ra-input ra-input--plain${missing.has('TRUCK') ? ' ra-input--missing' : ''}`}
            value={edits.truckPlate || ''}
            placeholder="Or type the plate, e.g. WB25R9540"
            onChange={(event) => set({ truckPlate: event.target.value, truckPicked: true })}
          />
          {vehiclesError && <span className="ra-chat-note">{vehiclesError}</span>}
          {missing.has('TRUCK') && <span className="ra-key-needed">Needed before approving</span>}
        </div>

        {/* Litres and amount */}
        <div
          className={`ra-prop${missing.has('LITRES') ? ' ra-prop--missing' : ''}`}
          data-key-field="LITRES"
        >
          <span className="ra-prop__label">
            Litres <span className="ra-key-field-label">Key field</span>
          </span>
          <input
            id="ra-key-field-LITRES"
            type="number"
            min="0"
            step="0.01"
            className={`ra-input ra-input--plain${missing.has('LITRES') ? ' ra-input--missing' : ''}`}
            aria-label="Litres"
            aria-required="true"
            required
            value={edits.litres ?? ''}
            onChange={(event) => set({ litres: event.target.value })}
          />
          {missing.has('LITRES') && <span className="ra-key-needed">Needed before approving</span>}
        </div>
        <div
          className={`ra-prop${missing.has('AMOUNT') ? ' ra-prop--missing' : ''}`}
          data-key-field="AMOUNT"
        >
          <span className="ra-prop__label">
            Amount <span className="ra-key-field-label">Key field</span>
          </span>
          <input
            id="ra-key-field-AMOUNT"
            type="number"
            min="0"
            step="0.01"
            className={`ra-input ra-input--plain${missing.has('AMOUNT') ? ' ra-input--missing' : ''}`}
            aria-label="Amount"
            aria-required="true"
            required
            value={edits.amount ?? ''}
            onChange={(event) => set({ amount: event.target.value })}
          />
          {missing.has('AMOUNT') && <span className="ra-key-needed">Needed before approving</span>}
        </div>

        {/* Full tank or top-up? */}
        <div className="ra-prop">
          <span className="ra-prop__label">Full tank or top-up?</span>
          <select
            className="ra-select ra-select--plain"
            aria-label="Full tank or top-up?"
            value={edits.fillingType || ''}
            onChange={(event) => set({ fillingType: event.target.value })}
          >
            <option value="FULL_TANK">Full tank</option>
            <option value="PARTIAL">Top-up</option>
            <option value="">Don&rsquo;t know</option>
          </select>
          <span className="ra-caption">Only used to work out mileage.</span>
        </div>

        {/* The time of the fill */}
        <div
          className={`ra-prop ra-prop--full${missing.has('FILL_TIME') ? ' ra-prop--missing' : ''}`}
          data-key-field="FILL_TIME"
        >
          <span className="ra-prop__label">
            Time of the fill <span className="ra-key-field-label">Key field</span>
          </span>
          {missing.has('FILL_TIME') && (
            <span className="ra-key-needed">Needed before approving</span>
          )}
          {!fill.missing ? (
            <span className="ra-prop__val">
              <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
              {fill.value} · {fill.source}
            </span>
          ) : several ? (
            <span className="ra-prop__val">Several tank rises fit — choose one.</span>
          ) : predicted ? (
            <span className="ra-prop__val ra-prop__val--predicted">
              <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
              {riseText}
            </span>
          ) : (
            <span className="ra-prop__val">Fill time not read from the photo.</span>
          )}
          {evidence.length > 0 && (
            <ul className="ra-predicted__evidence">
              {evidence.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {predicted && !several && (
            <div className="ra-predicted__actions">
              {litresSuggestion != null && (
                <button
                  type="button"
                  className="ra-btn ra-btn--publish"
                  onClick={() =>
                    set({ time: { action: 'accept' }, litres: String(litresSuggestion) })
                  }
                >
                  Use suggested time and {litresSuggestion} L
                </button>
              )}
              <button
                type="button"
                className={
                  litresSuggestion != null ? 'ra-btn ra-btn--ghost' : 'ra-btn ra-btn--publish'
                }
                onClick={() => set({ time: { action: 'accept' } })}
              >
                Use suggested time
              </button>
            </div>
          )}
          <div className="ra-predicted__actions">
            <input
              id="ra-key-field-FILL_TIME"
              type="datetime-local"
              aria-label="Time of the fill"
              aria-required="true"
              required
              className={missing.has('FILL_TIME') ? 'ra-input--missing' : ''}
              value={typedTime}
              onChange={(event) => set({ timeAt: event.target.value })}
            />
            <button
              type="button"
              className="ra-btn ra-btn--ghost"
              disabled={!timeReady}
              onClick={() =>
                set({ time: { action: 'set', at: new Date(typedTime).toISOString() } })
              }
            >
              Set time
            </button>
          </div>
          {edits.time?.action && (
            <span className="ra-chat-note">
              {edits.time.action === 'accept'
                ? 'The suggested time will be saved with this fill.'
                : `This fill will be saved at ${fmtDate(edits.time.at)}.`}
            </span>
          )}
        </div>

        {/* A truck that is not in our fleet */}
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Not one of our trucks?</span>
          <span className="ra-chat-note">
            <Store size={12} /> Use “Market truck” below: the fill is saved without a fleet vehicle.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatDraftEditor;
