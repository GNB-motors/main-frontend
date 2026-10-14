import { CheckCircle2, Copy, ExternalLink, Eye, RotateCcw, Truck } from 'lucide-react';

const AuditRequestRow = ({
  r,
  copiedId,
  copyToClipboard,
  handleReplay,
  openTrace,
  replayingWamid,
}) => (
  <tr className={r.isFailed ? 'wa-row--failed' : ''}>
    {/* Vehicle No */}
    <td>
      <div className="wa-vehicle-cell">
        <button
          type="button"
          className={`wa-vehicle-pill-btn ${r.vehicleReg ? 'wa-vehicle-pill-btn--assigned' : 'wa-vehicle-pill-btn--unassigned'}`}
          onClick={() => openTrace(r.id)}
          title="Click vehicle number to inspect full trace, time, message content & reliability status"
        >
          <Truck size={13} className="wa-vehicle-pill-icon" />
          <span className="wa-vehicle-reg-text">{r.vehicleReg || 'Unassigned'}</span>
          <ExternalLink size={10} className="wa-vehicle-link-icon" />
        </button>
        {r.draft && (
          <div
            style={{
              fontSize: 11,
              color: '#16a34a',
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            Fuel Bill: ₹{r.draft.amount?.toLocaleString() || 0} ({r.draft.litres || 0}L)
          </div>
        )}
      </div>
    </td>

    {/* Driver / User */}
    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
    <td>
      <div className="wa-user-cell">
        <div className="wa-phone-row">
          <span>+{r.waId}</span>
          <button
            type="button"
            className="wa-copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(r.waId, r.id);
            }}
            title="Copy phone number"
          >
            {copiedId === r.id ? <CheckCircle2 size={12} color="#16a34a" /> : <Copy size={12} />}
          </button>
        </div>
        <div className="wa-user-sub-info">
          {r.user ? (
            <span>
              {r.user.name} ({r.user.role})
            </span>
          ) : (
            <span style={{ color: '#dc2626' }}>Unlinked Sender</span>
          )}
        </div>
      </div>
    </td>

    {/* Organization */}
    <td>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--wa-text)' }}>
        {r.org?.name || 'Unassigned Tenant'}
      </div>
    </td>

    {/* Actions */}
    <td style={{ textAlign: 'right' }}>
      <div className="wa-actions-cell" style={{ justifyContent: 'flex-end' }}>
        <button
          className="wa-audit-btn wa-audit-btn--primary"
          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
          onClick={() => openTrace(r.id)}
          title="Inspect complete lifecycle trace, time, message content & reliability status"
        >
          <Eye size={13} />
          <span>View Trace</span>
        </button>

        {r.isFailed && (
          <button
            className="wa-audit-btn"
            style={{
              height: 32,
              padding: '0 8px',
              borderColor: '#fecaca',
              color: '#991b1b',
            }}
            onClick={() => handleReplay(r.wamid)}
            disabled={replayingWamid === r.wamid}
            title="Replay inbound message"
          >
            <RotateCcw size={13} className={replayingWamid === r.wamid ? 'wa-spin' : ''} />
            <span>Retry</span>
          </button>
        )}
      </div>
    </td>
  </tr>
);

export default AuditRequestRow;
