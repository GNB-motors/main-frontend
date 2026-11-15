import { ArrowLeft, RefreshCw, Fuel, Sparkles } from 'lucide-react';
const ReceiptInboxHeader = ({
  isSuperadminRoute,
  navigate,
  embedded,
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
