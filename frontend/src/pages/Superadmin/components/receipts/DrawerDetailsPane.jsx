import { CheckCircle2, Receipt, Gauge, MapPin, Clock, User, AlertTriangle } from 'lucide-react';
import { fmtMoney, fmtLitres, fmtDate, fmtRelativeTime } from './receiptFormat';

const DrawerDetailsPane = ({ draft, ocrEval, veh, odoMeta, stationInfo, submitter }) => (
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
        <Receipt size={15} /> Fuel & Vehicle Extracted Data
      </div>
      <div className="ra-grid-props">
        <div className="ra-prop">
          <span className="ra-prop__label">Vehicle Reg</span>
          <span className="ra-prop__val font-mono">{veh}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Fuel Type</span>
          <span className="ra-prop__val">{draft.fuelType || 'DIESEL'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Filling Mode</span>
          <span className="ra-prop__val">{draft.fillingType || 'FULL_TANK'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Bill Date & Time</span>
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
          <span className={`ra-odo-badge ${odoMeta.badgeClass}`}>{odoMeta.badgeText}</span>
        </div>
        <div className="ra-odo-hint">{odoMeta.detailHint}</div>
      </div>
    </div>

    {/* Section: Station & Telematics Cross-Verification */}
    <div className="ra-section-card">
      <div className="ra-section-card__title">
        <MapPin size={15} /> Station & Telematics Verification
      </div>
      <div className="ra-grid-props">
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Station Name</span>
          <span className="ra-prop__val">{stationInfo.stationName}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Pump GPS Coordinates</span>
          <span className="ra-prop__val font-mono">{stationInfo.coordinates}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Vehicle Halt Duration</span>
          <span className="ra-prop__val" style={{ color: 'var(--emerald-500, #10B981)' }}>
            <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
            {stationInfo.haltTime}
          </span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">State Diesel Benchmark</span>
          <span className="ra-prop__val">₹{stationInfo.benchmarkRate}/L</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Rate Variance</span>
          <span
            className="ra-prop__val"
            style={{
              color: stationInfo.isRateNormal
                ? 'var(--emerald-500, #10B981)'
                : 'var(--amber-500, #F59E0B)',
            }}
          >
            {stationInfo.rateDiff != null
              ? `${stationInfo.rateDiff > 0 ? '+' : ''}${stationInfo.rateDiff} ₹/L (${
                  stationInfo.isRateNormal ? 'Normal Variance' : 'High Variance'
                })`
              : '—'}
          </span>
        </div>
      </div>
    </div>

    {/* Section: Driver & WhatsApp Submission Metadata */}
    <div className="ra-section-card">
      <div className="ra-section-card__title">
        <User size={15} /> Submitter & Audit Metadata
      </div>
      <div className="ra-grid-props">
        <div className="ra-prop">
          <span className="ra-prop__label">Submitted by</span>
          <span className="ra-prop__val">{submitter}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">WhatsApp Contact</span>
          <span className="ra-prop__val font-mono">{draft.phoneE164 || draft.waId || '—'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Received Timestamp</span>
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
                .join(' ') || 'Admin'}{' '}
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
  </div>
);

export default DrawerDetailsPane;
