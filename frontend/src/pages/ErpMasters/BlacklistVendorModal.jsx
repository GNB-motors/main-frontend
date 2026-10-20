import { X, AlertTriangle } from 'lucide-react';

const BlacklistVendorModal = ({
  blacklistTarget,
  setBlacklistTarget,
  handleBlacklist,
  blacklistReason,
  setBlacklistReason,
  saving,
}) => (
  <div
    className="erp-modal-backdrop"
    role="presentation"
    onClick={(e) => {
      if (e.target === e.currentTarget) setBlacklistTarget(null);
    }}
  >
    <div className="erp-modal" style={{ maxWidth: 460 }}>
      <div className="erp-modal-header">
        <h2>{blacklistTarget.isBlacklisted ? 'Remove from blacklist' : 'Blacklist vendor'}</h2>
        <button className="btn-icon" onClick={() => setBlacklistTarget(null)}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleBlacklist}>
        <div className="erp-modal-body">
          {blacklistTarget.isBlacklisted ? (
            <p style={{ margin: 0 }}>
              Allow <strong>{blacklistTarget.name}</strong> to be placed again?
              {blacklistTarget.blacklistReason && (
                <span className="erp-cell-muted">
                  {' '}
                  Blacklisted for: {blacklistTarget.blacklistReason}
                </span>
              )}
            </p>
          ) : (
            <>
              <div className="erp-callout info">
                <AlertTriangle size={16} />
                <span>
                  A blacklisted vendor cannot be placed at all — not even with an approval.
                </span>
              </div>
              <div className="erp-field full">
                <label htmlFor="bl-reason">
                  Reason <span className="required">*</span>
                </label>
                <textarea
                  id="bl-reason"
                  aria-label="Reason"
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="Repeated shortages"
                  required
                />
              </div>
            </>
          )}
        </div>

        <div className="erp-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setBlacklistTarget(null)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn ${blacklistTarget.isBlacklisted ? 'btn-primary' : 'btn-danger'}`}
            disabled={saving}
          >
            {saving ? 'Saving...' : blacklistTarget.isBlacklisted ? 'Remove' : 'Blacklist'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default BlacklistVendorModal;
