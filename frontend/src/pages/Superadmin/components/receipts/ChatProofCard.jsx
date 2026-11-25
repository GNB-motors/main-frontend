// Proof from the chat: the message as it was sent, what we read from it,
// what the photo showed and what our own data says.
//
// Everything in this card is read-only. Nothing here changes a row, a truck,
// a time or an approval; it only shows a person what the row already carries.

import { fmtLitres, fmtMoney } from './receiptFormat';
import { checkFacts } from './receiptVerification';

const IST = 'Asia/Kolkata';

/**
 * A time in India, whichever time zone the browser is in.
 */
const fmtIst = (value) => {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(dt);
  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${get('day')} ${get('month')}, ${get('hour')}:${get('minute')}`;
};

/** A number we can show. An empty string is not a number. */
const hasNumber = (value) =>
  value != null && value !== '' && !Number.isNaN(Number(value));

const fmtNumber = (value) => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const KIND_LABEL = {
  PUMP: 'Pump screen',
  BILL: 'Bill',
  DASHBOARD: 'Dashboard photo',
  DUTY: 'Duty photo',
  UNKNOWN: 'Photo of unknown type',
};

const isPlainObject = (value) =>
  value != null && typeof value === 'object' && !Array.isArray(value);

const plainText = (value) => (typeof value === 'string' ? value.trim() : '');

/** "distilled water" out of "DISTILLED_WATER" or "distilled water". */
const prettyClaim = (value) => String(value).replace(/[_-]+/g, ' ').trim();

const ChatProofCard = ({ draft }) => {
  const proof = draft?.chatProof;
  if (!isPlainObject(proof)) return null;

  // 1. The message, exactly as it was sent.
  const sender = plainText(proof.sender);
  const text = typeof proof.text === 'string' ? proof.text : '';
  const sentAt = fmtIst(proof.sentAt);

  // 2. What we read out of that message.
  const textRead = isPlainObject(proof.textRead) ? proof.textRead : {};
  const truck = plainText(textRead.truck);
  const diesel = hasNumber(textRead.litresClaim) ? textRead.litresClaim : null;
  const defLitres = hasNumber(textRead.defLitres) ? textRead.defLitres : null;
  const km = hasNumber(textRead.km) ? textRead.km : null;
  const mileage = hasNumber(textRead.mileage) ? textRead.mileage : null;
  const fluidClaims = (Array.isArray(textRead.fluidClaims) ? textRead.fluidClaims : [])
    .map((claim) => {
      if (typeof claim === 'string') return { label: prettyClaim(claim), litres: null };
      if (isPlainObject(claim)) {
        const label = claim.fluid || claim.name || claim.type || claim.claim || '';
        return {
          label: prettyClaim(label),
          litres: hasNumber(claim.litres) ? claim.litres : null,
        };
      }
      return null;
    })
    .filter((claim) => claim && claim.label);
  const notRead = (Array.isArray(textRead.notRead) ? textRead.notRead : [])
    .map((line) => plainText(line))
    .filter(Boolean);

  // 3. What the photo showed.
  const photoRead = isPlainObject(proof.photoRead) ? proof.photoRead : null;
  const kind = photoRead ? plainText(photoRead.kind).toUpperCase() : '';
  const docKind = photoRead ? plainText(photoRead.docKind) : '';
  const kindConfidence = photoRead ? photoRead.kindConfidence : null;
  const stamp = fmtIst(photoRead?.stamp);
  const isPumpOrBill = kind === 'PUMP' || kind === 'BILL';

  const photoWords = !photoRead
    ? 'Photo details unavailable'
    : isPumpOrBill
      ? ''
      : kind === 'UNKNOWN' || !kind
        ? 'Photo type unknown: not a pump screen or bill we could read'
        : 'Not a pump screen or bill';

  // 4. What our own data says about the row.
  const checks = checkFacts(draft);
  const fillTime = fmtIst(draft?.time?.value);
  const pipelineSaid = plainText(proof.pipelineSaid);

  return (
    <div className="ra-proof-card">
      <div className="ra-proof-card__title">Proof from the chat</div>

      {/* The message, word for word. */}
      <div className="ra-proof-section">
        <div className="ra-proof-section__title">WhatsApp message</div>
        {sender ? <div className="ra-proof-note">From {sender}</div> : null}
        {sentAt ? (
          <div className="ra-proof-note">Message sent: {sentAt}</div>
        ) : null}
        {text ? (
          <div className="ra-caption">{text}</div>
        ) : (
          <div className="ra-proof-muted">No message text was read from this chat.</div>
        )}
      </div>

      {/* What we understood of the message. */}
      <div className="ra-proof-section">
        <div className="ra-proof-section__title">What we read from the message</div>
        {truck ? (
          <div className="ra-proof-row">
            <span className="ra-proof-row__label">Truck</span>
            <span className="ra-proof-row__value">{truck}</span>
          </div>
        ) : null}
        {diesel != null ? (
          <div className="ra-proof-row">
            <span className="ra-proof-row__label">Claim</span>
            <span className="ra-proof-row__value">Diesel {fmtLitres(diesel)}</span>
          </div>
        ) : null}
        {defLitres != null ? (
          <div className="ra-proof-row">
            <span className="ra-proof-row__label">Claim</span>
            <span className="ra-proof-row__value">DEF / urea {fmtLitres(defLitres)}</span>
          </div>
        ) : null}
        {km != null ? (
          <div className="ra-proof-row">
            <span className="ra-proof-row__label">Kilometres</span>
            <span className="ra-proof-row__value">{fmtNumber(km)} km</span>
          </div>
        ) : null}
        {mileage != null ? (
          <div className="ra-proof-row">
            <span className="ra-proof-row__label">Mileage</span>
            <span className="ra-proof-row__value">{fmtNumber(mileage)}</span>
          </div>
        ) : null}
        {fluidClaims.map((claim, index) => (
          <div className="ra-proof-row" key={`fluid-${index}`}>
            <span className="ra-proof-row__label">Also claimed</span>
            <span className="ra-proof-row__value">
              {claim.label}
              {claim.litres != null ? ` ${fmtLitres(claim.litres)}` : ''}
            </span>
          </div>
        ))}
        {notRead.length > 0 ? (
          <div className="ra-proof-subtitle">Not understood</div>
        ) : null}
        {notRead.map((line, index) => (
          <div className="ra-proof-muted" key={`notread-${index}`}>
            {line}
          </div>
        ))}
        {!truck && diesel == null && defLitres == null && km == null &&
          mileage == null && fluidClaims.length === 0 && notRead.length === 0 ? (
          <div className="ra-proof-muted">Nothing was read from this message.</div>
        ) : null}
      </div>

      {/* What the photo itself showed. */}
      <div className="ra-proof-section">
        <div className="ra-proof-section__title">What the photo showed</div>
        {photoRead ? (
          <div className="ra-proof-note">
            {KIND_LABEL[kind] || 'Photo'}
            {docKind ? ` · ${docKind}` : ''}
            {kindConfidence != null && kindConfidence !== ''
              ? ` · confidence ${kindConfidence}`
              : ''}
          </div>
        ) : null}
        {photoWords ? <div className="ra-proof-muted">{photoWords}</div> : null}
        {isPumpOrBill ? (
          <>
            {hasNumber(photoRead.litres) ? (
              <div className="ra-proof-row">
                <span className="ra-proof-row__label">Litres</span>
                <span className="ra-proof-row__value">{fmtLitres(photoRead.litres)}</span>
              </div>
            ) : null}
            {hasNumber(photoRead.rate) ? (
              <div className="ra-proof-row">
                <span className="ra-proof-row__label">Rate</span>
                <span className="ra-proof-row__value">
                  {fmtMoney(photoRead.rate)}/L
                </span>
              </div>
            ) : null}
            {hasNumber(photoRead.amount) ? (
              <div className="ra-proof-row">
                <span className="ra-proof-row__label">Amount</span>
                <span className="ra-proof-row__value">{fmtMoney(photoRead.amount)}</span>
              </div>
            ) : null}
            {plainText(photoRead.plate) ? (
              <div className="ra-proof-row">
                <span className="ra-proof-row__label">Plate</span>
                <span className="ra-proof-row__value">{plainText(photoRead.plate)}</span>
              </div>
            ) : null}
          </>
        ) : null}
        {stamp ? <div className="ra-proof-note">Camera stamp: {stamp}</div> : null}
      </div>

      {/* What our own data says about the row. */}
      <div className="ra-proof-section">
        <div className="ra-proof-section__title">What our data showed</div>
        {fillTime ? (
          <div className="ra-proof-row">
            <span className="ra-proof-row__label">Fill time</span>
            <span className="ra-proof-row__value">{fillTime}</span>
          </div>
        ) : null}
        {checks.rows.length > 0 ? (
          <ul className="ra-proof-list">
            {checks.rows.map((row, index) => (
              <li key={row.name || index}>
                {row.name}
                {row.status ? `: ${row.status}` : ''}
                {row.detail ? ` — ${row.detail}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <div className="ra-proof-muted">No checks were run on this row.</div>
        )}
        {pipelineSaid ? (
          <div className="ra-proof-note">System note: {pipelineSaid}</div>
        ) : null}
      </div>
    </div>
  );
};

export default ChatProofCard;
