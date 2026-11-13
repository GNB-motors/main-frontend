import { useState } from 'react';
import {
  CheckCircle2,
  Receipt,
  Gauge,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { fmtMoney, fmtLitres, fmtDate, fmtRelativeTime } from './receiptFormat';
import {
  predictedEvidenceLines,
  predictedTimeText,
  fillTimeFromDraft,
  matchedRiseText,
} from './predictedTime';
import { isChatRow, uploaderOf, driverOf } from './chatDraft';

/** The suggested time of a fill, with the buttons a person needs. */
const SuggestedTime = ({ draft, onSetTime, timeBusy, hidden = false }) => {
  const [editing, setEditing] = useState(false);
  const [typed, setTyped] = useState('');
  const predicted = draft?.time?.predicted || null;
  const person = draft?.time?.person || null;
  const text = predictedTimeText(predicted);
  const evidenceLines = predictedEvidenceLines(predicted?.evidence);
  if (hidden) return null;
  if (!text && !person?.at) return null;

  return (
    <div className="ra-prop ra-prop--full ra-prop--predicted">
      <span className="ra-prop__label">Suggested time</span>
      {text && (
        <span className="ra-prop__val ra-prop__val--predicted">
          <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
          {text}
        </span>
      )}
      {predicted && <span className="ra-prop__val">{matchedRiseText(predicted)}</span>}
      {evidenceLines.length > 0 && (
        <ul className="ra-predicted__evidence">
          {evidenceLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {person?.at && (
        <span className="ra-prop__val">
          <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
          Time set by a person: {fmtDate(person.at)}
        </span>
      )}
      {text && !person?.at && (
        <div className="ra-predicted__actions">
          {editing ? (
            <>
              <input
                type="datetime-local"
                value={typed}
                aria-label="Time of the fill"
                onChange={(event) => setTyped(event.target.value)}
              />
              <button
                type="button"
                className="ra-btn ra-btn--publish"
                disabled={!typed || timeBusy}
                onClick={() => {
                  const at = new Date(typed);
                  if (Number.isNaN(at.getTime())) return;
                  setEditing(false);
                  onSetTime?.('set', at.toISOString());
                }}
              >
                Save
              </button>
              <button type="button" className="ra-btn ra-btn--clear" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="ra-btn ra-btn--publish"
                disabled={timeBusy}
                onClick={() => onSetTime?.('accept')}
              >
                Use suggested time
              </button>
              <button
                type="button"
                className="ra-btn ra-btn--clear"
                disabled={timeBusy}
                onClick={() => setEditing(true)}
              >
                Set time
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/** Coordinates as a person reads them, or empty when none were supplied. */
const coordText = (coordinates) => {
  if (coordinates == null) return '';
  if (typeof coordinates === 'object') {
    const lat = coordinates.lat ?? coordinates.latitude;
    const lng = coordinates.lng ?? coordinates.longitude;
    return lat != null && lng != null ? `${lat}, ${lng}` : '';
  }
  return String(coordinates);
};

const DrawerDetailsPane = ({
  draft,
  ocrEval,
  veh,
  odoMeta,
  stationInfo,
  onSetTime,
  timeBusy,
  showTimeBlock = true,
}) => {
  // The words the server wrote for the person: why this row is in the inbox.
  const reasons = Array.isArray(draft.pipelineReasons)
    ? draft.pipelineReasons.filter(Boolean)
    : [];
  const reason = draft.pipelineReason || '';
  const caption = draft.caption || '';

  // Who sent the photo, and who drove: two different people, often.
  const isChat = isChatRow(draft);
  const uploader = uploaderOf(draft);
  const driver = driverOf(draft);

  // The caption belongs to the sender of a chat, and to the driver of a
  // guided receipt — but only when we know who that driver is.
  const captionHeading =
    isChat || !driver ? 'Message from the sender' : 'Message from the driver';
  const fill = fillTimeFromDraft(draft);
  const yearNote =
    fill.value && !fill.yearConfirmed ? 'year not confirmed — check the bill' : '';

  // The station facts the draft really carries.
  const stationName =
    stationInfo?.stationName || draft.stationName || draft.fuelOcr?.data?.location || null;
  const coordinates = coordText(stationInfo?.coordinates) || null;
  const haltTime = stationInfo?.haltTime ?? null;
  const geofence = stationInfo?.isGeofenceMatch ?? null;
  const benchmarkRate = stationInfo?.benchmarkRate ?? null;
  const benchmarkPlace = stationInfo?.benchmarkPlace ?? null;
  const benchmarkDate = stationInfo?.benchmarkEffectiveDate ?? null;
  const billRate = stationInfo?.billRate ?? null;
  // A benchmark is only a benchmark when we know its rate, its place and the
  // day it applies from.
  const hasBenchmark = benchmarkRate != null && benchmarkPlace != null && benchmarkDate != null;
  const variance =
    hasBenchmark && Number.isFinite(Number(billRate)) && Number.isFinite(Number(benchmarkRate))
      ? Number(billRate) - Number(benchmarkRate)
      : null;

  return (
    <div className="ra-drawer__details-pane">
    {/* Math & Amount Banner */}
    <div className="ra-amount-hero">
      <div className="ra-amount-hero__main">
        <span className="ra-amount-hero__label">Total Billed Amount</span>
        <span className="ra-amount-hero__val">{fmtMoney(draft.amount)}</span>
      </div>
      <div className="ra-amount-hero__sub">
        <span className="ra-pill-chip">
          <strong>{fmtLitres(draft.litres)}</strong> @ {fmtMoney(draft.rate)}/L
        </span>
        {ocrEval.math?.isValid && (
          <span className="ra-pill-chip ra-pill-chip--success">
            <CheckCircle2 size={13} /> Math Verified
          </span>
        )}
        {ocrEval.math && !ocrEval.math.isValid && (
          <span className="ra-pill-chip ra-pill-chip--warning">
            <AlertTriangle size={13} /> Math Variance: ₹{Math.round(ocrEval.math.diff)}
          </span>
        )}
      </div>
    </div>

    {/* Section: Fuel & Vehicle Core Details */}
    <div className="ra-section-card">
      <div className="ra-section-card__title">
        <Receipt size={15} /> Fuel &amp; Vehicle Extracted Data
      </div>
      <div className="ra-grid-props">
        <div className="ra-prop">
          <span className="ra-prop__label">Vehicle Reg</span>
          <span className="ra-prop__val font-mono">{veh}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Fuel Type</span>
          <span className="ra-prop__val">{draft.fuelType || '—'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Filling Mode</span>
          <span className="ra-prop__val">{draft.fillingType || '—'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Bill Date &amp; Time</span>
          <span className="ra-prop__val">{fmtDate(draft.billDatetime)}</span>
        </div>
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Fill time</span>
          {fill.missing ? (
            <span className="ra-prop__val">Fill time not read from the photo.</span>
          ) : (
            <>
              <span className="ra-prop__val">{fill.value}</span>
              <span className="ra-prop__val ra-prop__val--muted">{fill.source}</span>
              {yearNote && <span className="ra-prop__val ra-prop__val--muted">{yearNote}</span>}
            </>
          )}
        </div>
        <SuggestedTime
          draft={draft}
          onSetTime={onSetTime}
          timeBusy={timeBusy}
          hidden={!showTimeBlock}
        />
        <div className="ra-prop">
          <span className="ra-prop__label">Plate (OCR Detected)</span>
          <span className="ra-prop__val font-mono">{draft.plateText || 'Not Detected'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Organization</span>
          <span className="ra-prop__val">{draft.orgId?.companyName || '—'}</span>
        </div>
      </div>
    </div>

    {/* Section: Triple-Check Odometer & Telematics */}
    <div className="ra-section-card">
      <div className="ra-section-card__title">
        <Gauge size={15} /> Triple-Check Odometer Audit
      </div>
      <div className="ra-odo-row">
        <div className="ra-odo-box">
          <span className="ra-odo-box__reading">{odoMeta.displayReading}</span>
          {!odoMeta.isMissing && (
            <span className={`ra-odo-badge ${odoMeta.badgeClass}`}>{odoMeta.badgeText}</span>
          )}
        </div>
        <div className="ra-odo-hint">{odoMeta.detailHint}</div>
      </div>
    </div>

    {/* Section: Station facts the draft carries */}
    <div className="ra-section-card">
      <div className="ra-section-card__title">
        <MapPin size={15} /> Station Details
      </div>
      <div className="ra-grid-props">
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Station Name</span>
          <span className="ra-prop__val">{stationName || 'Station not read from the photo.'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Pump GPS Coordinates</span>
          <span className="ra-prop__val font-mono">{coordinates || 'Pump location not available.'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Vehicle Halt Duration</span>
          <span className="ra-prop__val">{haltTime || 'Halt duration not available.'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Geofence</span>
          <span className="ra-prop__val">
            {geofence === true ? 'Matched' : geofence === false ? 'Not matched' : 'Location match not checked.'}
          </span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Rate Benchmark</span>
          <span className="ra-prop__val">
            {hasBenchmark
              ? `₹${benchmarkRate}/L · ${benchmarkPlace} · from ${fmtDate(benchmarkDate)}`
              : 'Benchmark not available'}
          </span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Rate Variance</span>
          <span className="ra-prop__val">
            {variance != null
              ? `${variance > 0 ? '+' : ''}${Number(variance.toFixed(2))} ₹/L vs the benchmark`
              : '—'}
          </span>
        </div>
      </div>
    </div>

    {/* Section: Who sent it, and who drove */}
    <div className="ra-section-card">
      <div className="ra-section-card__title">
        <User size={15} /> Uploader &amp; Audit Metadata
      </div>
      <div className="ra-grid-props">
        <div className="ra-prop">
          <span className="ra-prop__label">Uploaded by</span>
          <span className="ra-prop__val">{uploader}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Driver</span>
          <span className="ra-prop__val">{driver || '—'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">WhatsApp Contact</span>
          <span className="ra-prop__val font-mono">{draft.phoneE164 || draft.waId || '—'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">WhatsApp received</span>
          <span className="ra-prop__val">
            {fmtDate(draft.createdAt)} ({fmtRelativeTime(draft.createdAt)})
          </span>
        </div>
        {draft.status === 'PUBLISHED' && (
          <div className="ra-prop">
            <span className="ra-prop__label">Approved by</span>
            <span className="ra-prop__val">
              {[draft.publishedBy?.firstName, draft.publishedBy?.lastName]
                .filter(Boolean)
                .join(' ') || '—'}{' '}
              on {fmtDate(draft.publishedAt)}
            </span>
          </div>
        )}
        {draft.status === 'REJECTED' && (
          <div className="ra-prop ra-prop--full">
            <span className="ra-prop__label">Rejection Reason</span>
            <span className="ra-prop__val" style={{ color: 'var(--rose-500, #EF4444)' }}>
              {draft.rejectReason || 'No reason provided'}
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Section: Why the server put this row in the inbox, in plain words */}
    {(reason || reasons.length > 0) && (
      <div className="ra-section-card">
        <div className="ra-section-card__title">
          <AlertTriangle size={15} /> Why this is in the inbox
        </div>
        <ul className="ra-reasons">
          {reason && <li>{reason}</li>}
          {reasons.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Section: What the sender wrote with the photo */}
    {caption && (
      <div className="ra-section-card">
        <div className="ra-section-card__title">
          <MessageCircle size={15} />
          {captionHeading}
        </div>
        <div className="ra-caption">{caption}</div>
      </div>
    )}
  </div>
  );
};

export default DrawerDetailsPane;
