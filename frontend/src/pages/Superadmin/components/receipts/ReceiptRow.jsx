import { Truck, Check, Phone, ShieldCheck, Eye, Receipt, MessageCircle, HelpCircle, Store } from 'lucide-react';
import { evaluateOcrQuality, getOdometerMeta } from './receiptVerification';
import { fmtMoney, fmtLitres, fmtDate, fmtRelativeTime } from './receiptFormat';
import { predictedTimeText, severalRisesText } from './predictedTime';
import { isChatRow, isTruckCertain } from './chatDraft';

const STATUS_BADGE = {
  READY: 'ra-badge--ready',
  PUBLISHED: 'ra-badge--published',
  REJECTED: 'ra-badge--rejected',
  CLEARED: 'ra-badge--cleared',
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
  const driverName =
    [d.userId?.firstName, d.userId?.lastName].filter(Boolean).join(' ') || d.phoneE164 || 'Driver';
  const stationName = d.stationName || d.fuelOcr?.data?.location || 'Highway Pump';

  // A chat row came in through a WhatsApp chat: it says so, and it says what
  // is still unsure about it.
  const isChat = isChatRow(d);
  const truckUnsure = Boolean(d.truck) && !isTruckCertain(d);
  const isMarket = d.market === true;

  // The time of a chat row: the read time, else the prediction, else nothing.
  const readTime = d.time?.value || null;
  const predicted = predictedTimeText(d.time?.predicted);
  // A chat row may carry its photo in the photo list instead of one slip URL.
  const slipUrl = d.fuelImageUrl || d.photos?.[0]?.url || '';

  return (
    <tr
      className={`ra-clickable ${isSelected ? 'is-selected' : ''}`}
      onClick={() => setActiveDrawerId(d._id)}
    >
      {/* Checkbox */}
      <td className="ra-table__td-select" onClick={(e) => e.stopPropagation()}>
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
        onClick={(e) => {
          e.stopPropagation();
          if (slipUrl) {
            setPreviewImage({ url: slipUrl, title: `Fuel Slip · ${veh}` });
          } else {
            setActiveDrawerId(d._id);
          }
        }}
      >
        <div className="ra-slip-thumbnail" title="Click to preview slip">
          <Receipt size={16} />
          <span className="ra-slip-badge">BILL</span>
        </div>
      </td>

      {/* Vehicle & Plate */}
      <td>
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
        {(isChat || truckUnsure || isMarket) && (
          <div className="ra-chip-row">
            {isChat && (
              <span className="ra-chip ra-chip--chat" title="This fill came in through a WhatsApp chat">
                <MessageCircle size={11} />
                From chat
              </span>
            )}
            {truckUnsure && (
              <span
                className="ra-chip ra-chip--warn"
                title="We are not sure which truck this fill belongs to"
              >
                <HelpCircle size={11} />
                Truck not sure
              </span>
            )}
            {isMarket && (
              <span className="ra-chip ra-chip--market" title="A market truck, not a fleet vehicle">
                <Store size={11} />
                Market truck
              </span>
            )}
          </div>
        )}
      </td>

      {/* Driver / Submitter */}
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
      <td>
        <div className="ra-driver-cell">
          <span className="ra-driver-name">{driverName}</span>
          <span className="ra-driver-phone font-mono">
            <Phone size={11} style={{ marginRight: 3, display: 'inline' }} />
            {d.phoneE164 || d.waId || 'WhatsApp'}
          </span>
        </div>
      </td>

      {/* Fuel Station */}
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
      <td>
        <div className="ra-station-cell" title={stationName}>
          <span className="ra-station-name">{stationName}</span>
          <span className="ra-station-mode">{d.fuelType || 'DIESEL'}</span>
        </div>
      </td>

      {/* Litres */}
      <td className="ra-right ra-strong font-mono">{fmtLitres(d.litres)}</td>

      {/* Amount */}
      <td className="ra-right ra-strong font-mono" style={{ color: 'var(--foreground)' }}>
        {fmtMoney(d.amount)}
      </td>

      {/* Odometer */}
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
      <td className="ra-center">
        <div className="ra-odo-cell">
          <span className={`ra-odo-val font-mono ${odo.isMissing ? 'ra-odo-val--missing' : ''}`}>
            {odo.displayReading}
          </span>
          <span className={`ra-odo-badge ${odo.badgeClass}`}>{odo.badgeText}</span>
        </div>
      </td>

      {/* AI Extraction Confidence */}
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
      <td className="ra-center">
        <div className="ra-ocr-cell">
          <span className={`ra-ocr-tag ra-ocr-tag--${ocr.level}`}>
            <ShieldCheck size={12} />
            {ocr.score}%
          </span>
          <span className="ra-ocr-label">{ocr.label}</span>
        </div>
      </td>

      {/* Status */}
      <td className="ra-center">
        <span className={`ra-badge ${STATUS_BADGE[d.status] || 'ra-badge--cleared'}`}>
          <span className="ra-badge__dot" />
          {d.status}
        </span>
      </td>

      {/* Refuel Timestamp */}
      <td className="ra-muted" style={{ fontSize: '12px' }}>
        {isChat ? (
          /* A chat row: the time read from the photo, else the predicted one,
             else the plain words that there is no time at all. */
          <div className="ra-time-cell">
            {readTime ? (
              <>
                <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                  {fmtDate(readTime)}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.75 }}>
                  {fmtRelativeTime(readTime)}
                </div>
              </>
            ) : predicted ? (
              <div className="ra-predicted">{predicted}</div>
            ) : severalRisesText(d.time?.predicted) ? (
              <div className="ra-time-missing">{severalRisesText(d.time?.predicted)}</div>
            ) : (
              <div className="ra-time-missing">No time on the photo</div>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                fontWeight: d.billDatetime ? 600 : 500,
                color: 'var(--foreground)',
              }}
            >
              {fmtDate(d.billDatetime || d.fuelOcr?.data?.datetime || d.createdAt)}
            </div>
            <div
              style={{ fontSize: '11px', opacity: 0.75 }}
              title={
                d.createdAt
                  ? `Received via WhatsApp: ${fmtDate(d.createdAt)} (${fmtRelativeTime(d.createdAt)})`
                  : undefined
              }
            >
              {d.billDatetime || d.fuelOcr?.data?.datetime ? (
                <span>{fmtRelativeTime(d.billDatetime || d.fuelOcr?.data?.datetime)}</span>
              ) : (
                <span>Recv: {fmtRelativeTime(d.createdAt)}</span>
              )}
            </div>
            {predictedTimeText(d.time?.predicted) && (
              <div className="ra-predicted">{predictedTimeText(d.time?.predicted)}</div>
            )}
          </>
        )}
      </td>

      {/* Row Actions */}
      <td className="ra-center" onClick={(e) => e.stopPropagation()}>
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
