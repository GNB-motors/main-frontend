import { Receipt } from 'lucide-react';
import { fmtMoney, fmtLitres, fmtDate } from './receiptFormat';
import { fillTimeFromDraft } from './predictedTime';
import { truckChip, mileageLine, refillCheckOf, thisFillOf } from './chatDraft';
import { sourceText, sourceWord } from './sourceWords';
import { missingKeyFields } from './keyFields';

/** The class of a chip for the kind of certainty it carries. */
const chipClass = (kind) => {
  if (kind === 'warn' || kind === 'none') return 'ra-chip ra-chip--warn';
  if (kind === 'market') return 'ra-chip ra-chip--market';
  return 'ra-chip';
};

/**
 * The facts of the fill, in one small card.
 */
const KeyFactsCard = ({
  veh,
  draft,
  edits,
  odoMeta,
  odoBadgeText,
  odoSource,
  pumpName,
  pumpSource,
  driver,
  assigned,
}) => {
  // The truck of this fill, and how sure we are about it.
  const chip = truckChip(draft);
  const showChip = Boolean(draft?.truck) || draft?.market === true;

  // A time from the truck's own tank is a suggestion until a person takes it.
  const fill = fillTimeFromDraft(draft);
  const fillIsSuggestion = fill.sourceKey === 'predicted';
  const yearNote =
    fill.value && !fill.yearConfirmed ? 'year not confirmed — check the bill' : '';
  const missing = new Set(missingKeyFields(draft, edits).map((field) => field.key));
  const litres =
    edits && Object.prototype.hasOwnProperty.call(edits, 'litres')
      ? edits.litres
      : draft.litres;
  const amount =
    edits && Object.prototype.hasOwnProperty.call(edits, 'amount')
      ? edits.amount
      : draft.amount;
  const fillValue =
    edits?.time?.action === 'set'
      ? fmtDate(edits.time.at)
      : edits?.time?.action === 'accept'
        ? fmtDate(draft.time?.predicted?.at)
        : fill.missing
          ? '—'
          : fill.value;
  const truckValue = edits?.truckPicked && edits.truckPlate ? edits.truckPlate : veh;

  // The mileage of the last fills of the truck, and how it compares with its usual.
  const mileage = mileageLine(draft);
  // This fill's own numbers, with no verdict on them.
  const thisFill = thisFillOf(draft);
  // The check the server ran on this refill itself.
  const refill = refillCheckOf(draft);

  return (
    <div className="ra-section-card">
      <div className="ra-section-card__title">
        <Receipt size={15} /> Key facts
      </div>
      <div className="ra-grid-props">
        <div className={`ra-prop${missing.has('TRUCK') ? ' ra-prop--missing' : ''}`}>
          <span className="ra-prop__label">
            Truck <span className="ra-key-field-label">Key field</span>
          </span>
          <span className="ra-prop__val font-mono" aria-required="true">
            {truckValue}
          </span>
          {showChip && (
            <span className={chipClass(chip.kind)}>
              {chip.text}
              {chip.note ? <span className="ra-chip__note">{chip.note}</span> : null}
            </span>
          )}
          {missing.has('TRUCK') && (
            <span className="ra-key-needed">Needed before approving</span>
          )}
        </div>
        <div className={`ra-prop${missing.has('LITRES') ? ' ra-prop--missing' : ''}`}>
          <span className="ra-prop__label">
            Litres <span className="ra-key-field-label">Key field</span>
          </span>
          <span className="ra-prop__val" aria-required="true">
            {litres === '' ? '—' : fmtLitres(litres)}
          </span>
          {missing.has('LITRES') && (
            <span className="ra-key-needed">Needed before approving</span>
          )}
        </div>
        <div className={`ra-prop${missing.has('AMOUNT') ? ' ra-prop--missing' : ''}`}>
          <span className="ra-prop__label">
            Amount <span className="ra-key-field-label">Key field</span>
          </span>
          <span className="ra-prop__val" aria-required="true">
            {amount === '' ? '—' : fmtMoney(amount)}
          </span>
          {missing.has('AMOUNT') && (
            <span className="ra-key-needed">Needed before approving</span>
          )}
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Rate</span>
          <span className="ra-prop__val">
            {draft.rate != null ? `${fmtMoney(draft.rate)}/L` : '—'}
          </span>
        </div>
        <div className={`ra-prop${missing.has('FILL_TIME') ? ' ra-prop--missing' : ''}`}>
          <span className="ra-prop__label">
            Fill time <span className="ra-key-field-label">Key field</span>
          </span>
          <span className="ra-prop__val" aria-required="true">
            {fillValue}
          </span>
          {fill.missing && !edits?.time?.action ? (
            <span className="ra-prop__val ra-prop__val--muted">
              Fill time not read from the photo.
            </span>
          ) : (
            <span className="ra-prop__val ra-prop__val--muted">{sourceText(fill.sourceKey)}</span>
          )}
          {fillIsSuggestion && (
            <span className="ra-prop__val ra-prop__val--muted">suggestion</span>
          )}
          {yearNote && <span className="ra-prop__val ra-prop__val--muted">{yearNote}</span>}
          {missing.has('FILL_TIME') && (
            <span className="ra-key-needed">Needed before approving</span>
          )}
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Odometer</span>
          <span className="ra-prop__val font-mono">{odoMeta.displayReading}</span>
          {!odoMeta.isMissing && (
            <>
              <span className={`ra-odo-badge ${odoMeta.badgeClass}`}>{odoBadgeText}</span>
              <span className="ra-prop__val ra-prop__val--muted">{sourceText(odoSource)}</span>
            </>
          )}
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Pump</span>
          <span className="ra-prop__val">{pumpName || '—'}</span>
          {pumpName && (
            <span className="ra-prop__val ra-prop__val--muted">{sourceText(pumpSource)}</span>
          )}
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Driver</span>
          <span className="ra-prop__val">
            {assigned ? `${assigned.name} · assigned` : driver || '—'}
          </span>
          {assigned?.since && (
            <span className="ra-prop__val ra-prop__val--muted">
              Assigned since {fmtDate(assigned.since)}
            </span>
          )}
        </div>
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Mileage</span>
          {mileage ? (
            <>
              <span className={`${chipClass(mileage.kind)} ra-chip--wrap`}>{mileage.text}</span>
              {sourceWord(mileage.source) && (
                <span className="ra-prop__val ra-prop__val--muted">
                  {sourceText(mileage.source)}
                </span>
              )}
            </>
          ) : (
            <span className="ra-prop__val">—</span>
          )}
          {thisFill && (
            <>
              <span className="ra-prop__val">{thisFill.text}</span>
              {thisFill.kmplText && (
                <span className="ra-prop__val ra-prop__val--muted">{thisFill.kmplText}</span>
              )}
            </>
          )}
          {refill?.unusual && (
            <>
              <span
                className="ra-chip ra-chip--warn"
                title={
                  refill.reasons.length ? refill.reasons.join(' · ') : 'This refill looks unusual'
                }
              >
                Unusual refill
              </span>
              {refill.reasons.map((reason) => (
                <span key={reason} className="ra-prop__val ra-prop__val--muted">
                  {reason}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyFactsCard;
