import { Gauge, SlidersHorizontal, X } from 'lucide-react';
import { onActivateKey } from '../../../../utils/onActivateKey';
import ODOMETER_MODES from './odometerModes';
const OdometerPolicyModal = ({
  savingPolicy,
  setOdoPolicyModalOpen,
  odoMode,
  canEditPolicy,
  changeOdoMode,
  navigate,
}) => (
  <div
    className="ra-modal-overlay"
    role="presentation"
    onClick={() => !savingPolicy && setOdoPolicyModalOpen(false)}
    onKeyDown={(e) => e.key === 'Escape' && !savingPolicy && setOdoPolicyModalOpen(false)}
  >
    <div
      className="ra-modal ra-modal--wide"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="ra-modal__head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Gauge size={18} color="var(--primary-color)" />
          <span>Odometer Capture & Triple-Check Policy</span>
        </div>
        <button
          type="button"
          className="ra-modal__close-btn"
          onClick={() => setOdoPolicyModalOpen(false)}
        >
          <X size={16} />
        </button>
      </div>
      <div className="ra-modal__body">
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
          Choose how the WhatsApp assistant captures odometer readings for your fleet. This governs
          the <strong>3-tier cross-verification system</strong> across Driver OCR, FleetEdge
          Telematics, and Physical Ledger entries.
        </p>

        <div className="ra-policy-cards">
          {ODOMETER_MODES.map((m) => (
            <div
              key={m.key}
              className={`ra-policy-card ${odoMode === m.key ? 'is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={m.label}
              onClick={() => canEditPolicy && changeOdoMode(m.key)}
              onKeyDown={onActivateKey(() => canEditPolicy && changeOdoMode(m.key))}
            >
              <div className="ra-policy-card__radio">
                <div className={`ra-radio-dot ${odoMode === m.key ? 'is-checked' : ''}`} />
              </div>
              <div className="ra-policy-card__content">
                <div className="ra-policy-card__title">
                  {m.icon}
                  <span>{m.label}</span>
                </div>
                <p className="ra-policy-card__desc">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ra-policy-footer-note">
          <SlidersHorizontal size={14} />
          <span>
            The same choice lives in{' '}
            <button
              type="button"
              style={{
                background: 'none',
                border: 0,
                padding: 0,
                font: 'inherit',
                color: 'inherit',
              }}
              onClick={() => {
                setOdoPolicyModalOpen(false);
                navigate('/settings?section=whatsapp');
              }}
            >
              <strong style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                Settings › WhatsApp bills
              </strong>
            </button>
            .
          </span>
        </div>
      </div>
      <div className="ra-modal__foot">
        <button
          type="button"
          className="ra-btn ra-btn--ghost"
          onClick={() => setOdoPolicyModalOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default OdometerPolicyModal;
