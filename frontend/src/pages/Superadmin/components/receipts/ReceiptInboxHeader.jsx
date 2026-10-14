import { Gauge, ArrowLeft, RefreshCw, Fuel, Sliders, Sparkles } from 'lucide-react';
import ODOMETER_MODES from './odometerModes';
const ReceiptInboxHeader = ({
  isSuperadminRoute,
  navigate,
  embedded,
  setOdoPolicyModalOpen,
  odoMode,
  refreshing,
  fetchData,
}) => (
  <div className="ra-header">
    {isSuperadminRoute && (
      <button type="button" className="ra-header__back" onClick={() => navigate('/superadmin')}>
        <ArrowLeft size={15} />
        Superadmin Portal
      </button>
    )}

    <div className="ra-header__top-row">
      {!embedded && (
        <div className="ra-header__bar">
          <div className="ra-header__icon">
            <Fuel size={24} />
          </div>
          <div>
            <div className="ra-header__tagline">
              <Sparkles size={13} />
              <span>AI-Powered Telematics Fuel Audit</span>
            </div>
            <h1 className="ra-header__title">WhatsApp Fuel Approvals</h1>
            <p className="ra-header__subtitle">
              Review driver fuel bills captured over WhatsApp, verify against CAN-bus telematics,
              and publish atomically into the fuel ledger.
            </p>
          </div>
        </div>
      )}

      <div className="ra-header__actions">
        {/* Odometer Policy Pill Button */}
        {!isSuperadminRoute && (
          <button
            type="button"
            className="ra-policy-btn"
            onClick={() => setOdoPolicyModalOpen(true)}
            title="Configure Odometer Ingestion & Triple-Check Settings"
          >
            <Gauge size={15} />
            <span className="ra-policy-btn__text">
              Odometer Mode:{' '}
              <strong>{ODOMETER_MODES.find((m) => m.key === odoMode)?.label.split(' ')[0]}</strong>
            </span>
            <Sliders size={13} style={{ opacity: 0.6 }} />
          </button>
        )}

        {/* Refresh Button */}
        <button
          type="button"
          className={`ra-refresh-btn ${refreshing ? 'is-spinning' : ''}`}
          onClick={() => fetchData(true)}
          disabled={refreshing}
          title="Refresh Receipts"
        >
          <RefreshCw size={15} />
          <span>{refreshing ? 'Syncing…' : 'Sync Live'}</span>
        </button>
      </div>
    </div>
  </div>
);

export default ReceiptInboxHeader;
