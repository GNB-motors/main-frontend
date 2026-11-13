import { useState } from 'react';
import { CheckCircle2, AlertTriangle, MessageCircle } from 'lucide-react';
import { fmtDate, fmtRelativeTime } from './receiptFormat';
import {
  isChatRow,
  uploaderOf,
  driverOf,
  driverAssignedOf,
  pumpOf,
  truckCandidates,
} from './chatDraft';
import { isPhotoSource, sourceText, sourceWord } from './sourceWords';
import CollapsibleSection from './CollapsibleSection';
import PredictedFill from './PredictedFill';
import TimeControls from './TimeControls';
import KeyFactsCard from './KeyFactsCard';

/**
 * The checks the server ran on this row, and the ones that need a look.
 *
 * A check the server never ran is not a check that passed: it stays unknown.
 */
const checkFacts = (draft) => {
  const checks = draft?.checks && typeof draft.checks === 'object' ? draft.checks : null;
  if (!checks) return { ran: false, needs: 0, rows: [] };
  const rows = [];
  let needs = 0;
  Object.entries(checks).forEach(([name, value]) => {
    const status = String(value?.status || value?.result || value?.state || '').toUpperCase();
    const bad =
      value?.ok === false ||
      value?.valid === false ||
      [
        'FAIL',
        'FAILED',
        'WARN',
        'WARNING',
        'NEEDS_REVIEW',
        'NEEDS_LOOK',
        'INVALID',
        'MISMATCH',
      ].includes(status);
    const detail = value?.detail || value?.message || value?.reason || '';
    if (bad) needs += 1;
    rows.push({ name, bad, detail, status });
  });
  return { ran: rows.length > 0, needs, rows };
};

const DrawerDetailsPane = ({
  draft,
  edits,
  ocrEval,
  veh,
  odoMeta,
  stationInfo,
  onSetTime,
  timeBusy,
  showTimeBlock = true,
}) => {
  // What a person typed for the time of the fill. It lives here, so that
  // folding a section away never throws the typing away.
  const [timeEdit, setTimeEdit] = useState({ editing: false, typed: '' });

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
  const assigned = driverAssignedOf(draft);

  // The trucks the server suggests for this photo.
  const candidates = truckCandidates(draft);

  // The caption belongs to the sender of a chat, and to the driver of a
  // guided receipt — but only when we know who that driver is.
  const captionHeading =
    isChat || !driver ? 'Message from the sender' : 'Message from the driver';

  // The station facts the draft really carries.
  const stationName =
    stationInfo?.stationName || draft.stationName || draft.fuelOcr?.data?.location || null;
  const pump = pumpOf(draft);
  const pumpName = (pump && pump.name) || stationName || '';
  const pumpSource = pump && pump.name ? pump.source : null;
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

  // The odometer: the reading, and where it came from.
  const odoSource = draft.odometerSource || null;
  const odoBadgeText =
    sourceWord(odoSource) &&
    (odoMeta.badgeText === 'Source not recorded' ||
      (odoMeta.badgeText === 'Dash Photo OCR' && !isPhotoSource(odoSource)))
      ? sourceText(odoSource)
      : odoMeta.badgeText;

  // The checks: what the server looked at, and what needs a person.
  const checks = checkFacts(draft);
  const checksSummary = !checks.ran
    ? 'Not checked'
    : checks.needs === 0
      ? 'No issues found'
      : checks.needs === 1
        ? '1 needs a look'
        : `${checks.needs} need a look`;

  const predictionsSummary = candidates.length
    ? `${candidates.length} truck suggestion${candidates.length === 1 ? '' : 's'}`
    : 'No suggestions';

  const stationSummary = pumpName || 'Not available';

  const auditSummary =
    uploader && uploader !== '—' ? `Uploaded by ${uploader}` : 'Uploader unknown';

  // Why the truck is unsure — only when the server said why in words.
  const truckSource = String(draft.truck?.source || '').trim();
  const truckReason =
    draft.checks?.TRUCK_ONE?.detail || (truckSource && truckSource !== 'CHAT' ? truckSource : '');

  return (
    <div className="ra-drawer__details-pane">
      {/* The facts of the fill, in one small card. */}
      <KeyFactsCard
        veh={veh}
        draft={draft}
        edits={edits}
        odoMeta={odoMeta}
        odoBadgeText={odoBadgeText}
        odoSource={odoSource}
        pumpName={pumpName}
        pumpSource={pumpSource}
        driver={driver}
        assigned={assigned}
      />

      {/* What the server checked, and what it found. */}
      <CollapsibleSection title="Checks" summary={checksSummary}>
        <div className="ra-chip-row">
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
          {!ocrEval.math && <span className="ra-pill-chip">Math not checked</span>}
        </div>

        <div className="ra-odo-row">
          <div className="ra-odo-box">
            <span className="ra-odo-box__reading">{odoMeta.displayReading}</span>
            {!odoMeta.isMissing && (
              <span className={`ra-odo-badge ${odoMeta.badgeClass}`}>{odoBadgeText}</span>
            )}
          </div>
          <div className="ra-odo-hint">{odoMeta.detailHint}</div>
        </div>
        {!odoMeta.isMissing && (
          <div className="ra-prop__val ra-prop__val--muted">{sourceText(odoSource)}</div>
        )}

        {checks.rows.length > 0 && (
          <ul className="ra-reasons">
            {checks.rows.map((row) => (
              <li key={row.name}>
                {row.name}
                {row.status ? `: ${row.status}` : ''}
                {row.detail ? ` — ${row.detail}` : ''}
              </li>
            ))}
          </ul>
        )}

        {(reason || reasons.length > 0) && (
          <>
            <div className="ra-section-card__title">
              <AlertTriangle size={15} /> Why this is in the inbox
            </div>
            <ul className="ra-reasons">
              {reason && <li>{reason}</li>}
              {reasons.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
      </CollapsibleSection>

      {/* What we think the truck and the time are, and what a person can do. */}
      <CollapsibleSection title="Predictions" summary={predictionsSummary}>
        <div className="ra-grid-props">
          <div className="ra-prop ra-prop--full">
            <span className="ra-prop__label">Truck suggestions</span>
            {candidates.length > 0 ? (
              <ul className="ra-reasons">
                {candidates.map((candidate) => (
                  <li key={candidate.id}>
                    {candidate.reg || candidate.vehicleId}
                    {candidate.score != null ? ` · ${candidate.score}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="ra-prop__val ra-prop__val--muted">No truck suggestions</span>
            )}
            {truckReason && <span className="ra-prop__val">{truckReason}</span>}
          </div>
          <PredictedFill draft={draft} />
        </div>
        {showTimeBlock ? (
          <TimeControls
            draft={draft}
            onSetTime={onSetTime}
            timeBusy={timeBusy}
            timeEdit={timeEdit}
            setTimeEdit={setTimeEdit}
          />
        ) : null}
      </CollapsibleSection>

      {/* Where the pump is, and what it should have cost. */}
      <CollapsibleSection title="Station details" summary={stationSummary}>
        <div className="ra-grid-props">
          <div className="ra-prop ra-prop--full">
            <span className="ra-prop__label">Pump / Station</span>
            <span className="ra-prop__val">{pumpName || 'Station not read from the photo.'}</span>
            <span className="ra-prop__val ra-prop__val--muted">{sourceText(pumpSource)}</span>
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
      </CollapsibleSection>

      {/* Everything else we know about this receipt. */}
      <CollapsibleSection title="Audit" summary={auditSummary}>
        <div className="ra-grid-props">
          <div className="ra-prop">
            <span className="ra-prop__label">Uploaded by</span>
            <span className="ra-prop__val">{uploader}</span>
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
          <div className="ra-prop">
            <span className="ra-prop__label">Plate (OCR Detected)</span>
            <span className="ra-prop__val font-mono">{draft.plateText || 'Not Detected'}</span>
          </div>
          <div className="ra-prop">
            <span className="ra-prop__label">Organization</span>
            <span className="ra-prop__val">{draft.orgId?.companyName || '—'}</span>
          </div>
          {draft.status === 'PUBLISHED' && (
            <div className="ra-prop ra-prop--full">
              <span className="ra-prop__label">Approved by</span>
              <span className="ra-prop__val">
                {[draft.publishedBy?.firstName, draft.publishedBy?.lastName]
                  .filter(Boolean)
                  .join(' ') || '—'}{' '}
                on {fmtDate(draft.publishedAt)}. Log ID: {draft.publishedFuelLogId || '—'}
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
          {draft.status === 'CLEARED' && (
            <div className="ra-prop ra-prop--full">
              <span className="ra-prop__label">Cleared Note</span>
              <span className="ra-prop__val">{draft.clearNote || 'Cleared from inbox'}</span>
            </div>
          )}
        </div>

        {caption && (
          <>
            <div className="ra-section-card__title">
              <MessageCircle size={15} />
              {captionHeading}
            </div>
            <div className="ra-caption">{caption}</div>
          </>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default DrawerDetailsPane;
