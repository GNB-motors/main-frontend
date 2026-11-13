import { Truck, Check, Phone, ShieldCheck, Eye, Receipt, MessageCircle, Store } from 'lucide-react';
import { evaluateOcrQuality, getOdometerMeta } from './receiptVerification';
import { fmtMoney, fmtLitres } from './receiptFormat';
import {
  predictedTimeText,
  severalRisesText,
  fillTimeFromDraft,
  fillTimeText,
} from './predictedTime';
import { isChatRow, truckChip, uploaderOf, driverOf, driverAssignedOf, pumpOf, mileageLine, refillCheckOf } from './chatDraft';
import { isPhotoSource, sourceText, sourceWord } from './sourceWords';

const STATUS_BADGE = {
  READY: 'ra-badge--ready',
  PUBLISHED: 'ra-badge--published',
  REJECTED: 'ra-badge--rejected',
  CLEARED: 'ra-badge--cleared',
};

/** The plain words of each state of a receipt. */
const STATUS_WORDS = {
  READY: 'Ready',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
  CLEARED: 'Cleared',
};

/** A receipt that was cleared because the fill was already received says so. */
const statusWord = (d) => {
  if (d.status === 'CLEARED') {
    const note = String(d.clearNote || '');
    return /already received/i.test(note) ? 'Already received' : 'Cleared';
  }
  return STATUS_WORDS[d.status] || 'Cleared';
};

const ReceiptRow = ({
  d,
  selectedIds,
  setActiveDrawerId,
  toggleSelectOne,
  setPreviewImage,
  handleSingleApprove,
  rowError = '',
  onRetryRow,
}) => {
  const veh = d.vehicleId?.registrationNumber || d.vehicleReg || '—';
  const isSelected = selectedIds.has(d._id);
  const canSelect = d.status === 'READY';
  const ocr = evaluateOcrQuality(d);
  const odo = getOdometerMeta(d);
  // A reading we know the source of never says the source was not recorded,
  // and never wears a photo badge unless the source really was a photo.
  const odoBadgeText =
    sourceWord(d.odometerSource) &&
    (odo.badgeText === 'Source not recorded' ||
      (odo.badgeText === 'Dash Photo OCR' && !isPhotoSource(d.odometerSource)))
      ? sourceText(d.odometerSource)
      : odo.badgeText;

  // Who sent the photo, and who drove: two different people, often.
  const uploader = uploaderOf(d);
  // The driver assigned to the truck. An assignment is not proof that the
  // person who sent the photo drove it, so the line says so.
  const assigned = driverAssignedOf(d);
  const driver = assigned ? `${assigned.name} · assigned` : driverOf(d) || '—';

  // The pump of the fill, when the server knows it, else the station name
  // the row carries. Each one keeps its own source.
  const pump = pumpOf(d);
  const stationName =
    (pump && pump.name) || d.stationName || d.fuelOcr?.data?.location || '—';
  // A station name without a matched pump was read off the bill photo.
  const stationSource = pump && pump.name ? pump.source : d.stationName ? 'PHOTO' : null;

  // The mileage of the last fills of the truck, and how it compares with its usual.
  const mileage = mileageLine(d);

  // The check the server ran on this refill itself: is it an unusual one?
  const refill = refillCheckOf(d);

  // A chat row came in through a WhatsApp chat: it says so.
  const isChat = isChatRow(d);
  const chip = truckChip(d);

  // The fill time: what the photo says, else the printed bill's own time.
  const fill = fillTimeFromDraft(d);
  const dateLine = fill.value;
  const sourceLine = fill.source;
  const predicted = predictedTimeText(d.time?.predicted);
  const several = severalRisesText(d.time?.predicted);

  // A chat row may carry its photo in the photo list instead of one slip URL.
  const slipUrl = d.fuelImageUrl || d.photos?.[0]?.url || '';
  const hasGroup = Array.isArray(d.photos) && d.photos.length > 1;

  return (
    <tr
      className={`ra-clickable ${isSelected ? 'is-selected' : ''}`}
      onClick={() => setActiveDrawerId(d._id)}
    >
      {/* Checkbox */}
      <td
        className="ra-table__td-select"
        data-label="Select"
        onClick={(e) => e.stopPropagation()}
      >
        {canSelect ? (
          <input
            type="checkbox"
            className="ra-checkbox"
            checked={isSelected}
            onChange={(e) => toggleSelectOne(d._id, e)}
            aria-label={`Select receipt for ${veh}`}
          />
        ) : (
          <span className="ra-checkbox-placeholder" />
        )}
      </td>

      {/* Slip Thumbnail / Icon */}
      <td
        className="ra-table__td-slip"
        data-label="Slip"
        onClick={(e) => {
          e.stopPropagation();
          // Several photos belong together: the drawer shows the whole group.
          if (hasGroup || !slipUrl) {
            setActiveDrawerId(d._id);
          } else {
            setPreviewImage({ url: slipUrl, title: `Fuel Slip · ${veh}` });
          }
        }}
      >
        <div className="ra-slip-thumbnail" title="Click to preview slip">
          <Receipt size={16} />
          <span className="ra-slip-badge">BILL</span>
        </div>
      </td>

      {/* Vehicle & Plate */}
      <td data-label="Vehicle & Plate">
        <div className="ra-veh-cell">
          <span className="ra-veh">
            <span className="ra-veh__avatar">
              <Truck size={15} />
            </span>
            <strong>{veh}</strong>
          </span>
          {d.plateText && (
            <span className="ra-plate-ocr-pill font-mono" title="OCR Detected Plate">
              {d.plateText}
            </span>
          )}
        </div>
        {(isChat || d.truck || mileage || refill?.unusual) && (
          <div className="ra-chip-row">
            {isChat && (
              <span className="ra-chip ra-chip--chat" title="This fill came in through a WhatsApp chat">
                <MessageCircle size={11} />
                From chat
              </span>
            )}
            {d.truck && chip.kind === 'market' && (
              <span className="ra-chip ra-chip--market" title="A market truck, not a fleet vehicle">
                <Store size={11} />
                Market truck
              </span>
            )}
            {d.truck && chip.kind === 'sure' && (
              <span className="ra-chip" title="The truck of this fill is certain">
                <Truck size={11} />
                {chip.text}
              </span>
            )}
            {d.truck && chip.kind === 'guess' && (
              <span className="ra-chip ra-chip--warn" title="We are not sure which truck this fill belongs to">
                {chip.text}
              </span>
            )}
            {d.truck && chip.kind === 'none' && (
              <span className="ra-chip ra-chip--warn" title="The truck of this fill is not known">
                <span className="ra-chip__text">—</span>
                <span className="ra-chip__note">{chip.note}</span>
              </span>
            )}
            {mileage && (
              <span
                className={`ra-chip ra-chip--wrap ${mileage.kind === 'warn' ? 'ra-chip--warn' : ''}`}
                title="The mileage of the last fills of this truck, compared with its usual"
              >
                {mileage.text}
              </span>
            )}
            {refill?.unusual && (
              <span
                className="ra-chip ra-chip--warn"
                title={refill.reasons.length ? refill.reasons.join(' · ') : 'This refill looks unusual'}
              >
                Unusual refill
              </span>
            )}
          </div>
        )}
      </td>

      {/* Who sent it, and who drove */}
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
      <td data-label="Uploaded by / Driver" title={d.phoneE164 || d.waId || undefined}>
        <div className="ra-driver-cell">
          <span className="ra-driver-name">Uploaded by {uploader}</span>
          <span className="ra-driver-phone font-mono">
            <Phone size={11} style={{ marginRight: 3, display: 'inline' }} />
            Driver: {driver}
          </span>
        </div>
      </td>

      {/* Fuel Station */}
      <td data-label="Fuel Station">
        <div className="ra-station-cell" title={stationName}>
          <span className="ra-station-name">{stationName}</span>
          {stationSource && (
            <span className="ra-station-source">{sourceText(stationSource)}</span>
          )}
        </div>
      </td>

      {/* Litres */}
      <td className="ra-right ra-strong font-mono" data-label="Litres">
        {fmtLitres(d.litres)}
      </td>

      {/* Amount */}
      <td
        className="ra-right ra-strong font-mono"
        data-label="Amount"
        style={{ color: 'var(--foreground)' }}
      >
        {fmtMoney(d.amount)}
      </td>

      {/* Odometer */}
      <td className="ra-center" data-label="Odometer">
        <div className="ra-odo-cell">
          <span className={`ra-odo-val font-mono ${odo.isMissing ? 'ra-odo-val--missing' : ''}`}>
            {odo.displayReading}
          </span>
          {!odo.isMissing && (
            <span className={`ra-odo-badge ${odo.badgeClass}`}>{odoBadgeText}</span>
          )}
        </div>
      </td>

      {/* AI Extraction Confidence */}
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
      <td className="ra-center" data-label="AI Extraction">
        <div className="ra-ocr-cell">
          <span className={`ra-ocr-tag ra-ocr-tag--${ocr.level}`}>
            <ShieldCheck size={12} />
            {ocr.score}%
          </span>
          <span className="ra-ocr-label">{ocr.label}</span>
        </div>
      </td>

      {/* Status */}
      <td className="ra-center" data-label="Status">
        <span className={`ra-badge ${STATUS_BADGE[d.status] || 'ra-badge--cleared'}`}>
          <span className="ra-badge__dot" />
          {statusWord(d)}
        </span>
      </td>

      {/* Refuel Timestamp */}
      <td className="ra-muted" data-label="Refuel Date" style={{ fontSize: '12px' }}>
        {dateLine ? (
          <div className="ra-time-cell">
            <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{dateLine}</div>
            {sourceLine && (
              <div style={{ fontSize: '11px', opacity: 0.75 }}>{sourceLine}</div>
            )}
          </div>
        ) : predicted ? (
          <div className="ra-predicted">{predicted}</div>
        ) : several ? (
          <div className="ra-time-missing">{several}</div>
        ) : (
          <div className="ra-time-missing">{fillTimeText(d.time)}</div>
        )}
      </td>

      {/* Row Actions */}
      <td className="ra-center" data-label="Actions" onClick={(e) => e.stopPropagation()}>
        <div className="ra-row-actions">
          {d.status === 'READY' && (
            <button
              type="button"
              className="ra-action-icon-btn ra-action-icon-btn--approve"
              onClick={(e) => handleSingleApprove(d._id, veh, e)}
              title="Quick Approve to Fuel Ledger"
            >
              <Check size={14} />
            </button>
          )}
          <button
            type="button"
            className="ra-action-icon-btn"
            onClick={() => setActiveDrawerId(d._id)}
            title="Open Review Drawer"
          >
            <Eye size={14} />
          </button>
        </div>
        {/* A refused action belongs to this row: the words sit next to it. */}
        {rowError && (
          <div className="ra-row-error" role="alert">
            <span className="ra-row-error__text">{rowError}</span>
            {onRetryRow && (
              <button
                type="button"
                className="ra-row-error__retry"
                onClick={(e) => onRetryRow(d._id, e)}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

export default ReceiptRow;
