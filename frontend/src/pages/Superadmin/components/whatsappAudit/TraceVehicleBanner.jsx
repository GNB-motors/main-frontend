import { CheckCircle2, Copy, User } from 'lucide-react';
import renderStatusBadge from './renderStatusBadge';

const TraceVehicleBanner = ({ copiedId, copyToClipboard, traceData }) => (
  <div className="wa-drawer-vehicle-banner">
    <div className="wa-drawer-vehicle-banner__top">
      <div className="wa-plate-box">
        <span className="wa-plate-ind">IND</span>
        <span className="wa-plate-number">
          {traceData.vehicle?.vehicleReg || traceData.draft?.vehicleReg || 'UNASSIGNED'}
        </span>
      </div>
      <div className="wa-drawer-status-group">{renderStatusBadge(traceData.request)}</div>
    </div>

    <div className="wa-drawer-vehicle-banner__grid">
      <div className="wa-meta-item">
        <span className="wa-meta-item__lbl">
          <User size={11} /> Driver / User
        </span>
        <strong className="wa-meta-item__val">
          {traceData.sender.user
            ? `${traceData.sender.user.firstName || ''} ${traceData.sender.user.lastName || ''}`.trim() ||
              traceData.sender.user.email
            : 'Unlinked WhatsApp Sender'}
        </strong>
        <div className="wa-phone-row" style={{ marginTop: 2 }}>
          <span>+{traceData.request.waId}</span>
          <button
            type="button"
            className="wa-copy-btn"
            onClick={() => copyToClipboard(traceData.request.waId, 'drawer-phone')}
            title="Copy phone number"
          >
            {copiedId === 'drawer-phone' ? (
              <CheckCircle2 size={12} color="#16a34a" />
            ) : (
              <Copy size={12} />
            )}
          </button>
          <span className="wa-meta-item__sub" style={{ marginLeft: 4 }}>
            • {traceData.sender.user?.role || 'Guest'}
          </span>
        </div>
      </div>
      <div className="wa-meta-item">
        <span className="wa-meta-item__lbl">🏢 Organization</span>
        <strong className="wa-meta-item__val">
          {traceData.sender.org?.companyName || 'Unassigned Tenant'}
        </strong>
        <span className="wa-meta-item__sub">
          {traceData.vehicle?.vehicleReg
            ? `Fleet: ${traceData.vehicle.vehicleReg}`
            : 'Unassigned Fleet'}
        </span>
      </div>
    </div>
  </div>
);

export default TraceVehicleBanner;
