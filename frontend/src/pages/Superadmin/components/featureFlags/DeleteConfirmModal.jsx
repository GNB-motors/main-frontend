import { useEffect, useRef, useState } from 'react';
import { Trash2, AlertTriangle, X, Flame } from 'lucide-react';
import { OrgFeatureFlagsService } from '../OrgFeatureFlagsService';

/* ─────────────────────────────────────────────────────────────────────────
   DeleteConfirmModal
   Supports two modes:
     • "delete"  — DELETE /api/admin/organizations/:id
                   Removes entities, preserves historical data.
     • "purge"   — DELETE /api/admin/organizations/:id/purge
                   Removes everything — no data survives.

   The super-admin must type the exact org name before either button activates.
──────────────────────────────────────────────────────────────────────────── */
const DeleteConfirmModal = ({ org, onCancel, onConfirmed }) => {
  const [typedName, setTypedName] = useState('');
  const [activeMode, setActiveMode] = useState(null); // 'delete' | 'purge'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the confirmation input when modal opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Block page scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const displayName = org.companyName || org.ownerEmail || '(unnamed)';
  const isConfirmed = typedName.trim() === displayName.trim();

  const handleAction = async (mode) => {
    if (!isConfirmed || loading) return;
    setActiveMode(mode);
    setLoading(true);
    setError('');
    try {
      if (mode === 'purge') await OrgFeatureFlagsService.purgeOrganization(org._id);
      else await OrgFeatureFlagsService.deleteOrganization(org._id);
      onConfirmed(org._id);
    } catch (e) {
      setError(e.response?.data?.message || 'Operation failed. Please try again.');
      setLoading(false);
      setActiveMode(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !loading) onCancel();
  };

  return (
    <div
      className="ff-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="ff-modal ff-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="del-modal-title"
      >
        {/* ── Header ── */}
        <div className="ff-modal__header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span className="ff-confirm__icon">
              <AlertTriangle size={22} />
            </span>
            <div>
              <h2 className="ff-modal__title" id="del-modal-title">
                Remove Organisation
              </h2>
              <p className="ff-modal__subtitle">
                Choose a removal mode.{' '}
                <strong>Both actions are permanent and cannot be undone.</strong>
              </p>
            </div>
          </div>
          <button className="ff-icon-btn" onClick={onCancel} aria-label="Close" disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="ff-modal__body">
          {/* Two-column comparison */}
          <div className="ff-compare">
            {/* ── Delete Organisation (soft) ── */}
            <div className="ff-compare__col ff-compare__col--delete">
              <div className="ff-compare__head">
                <Trash2 size={16} />
                <span>Delete Organisation</span>
              </div>
              <p className="ff-compare__desc">
                Removes the organisation&apos;s operational setup while retaining all historical
                records for future analytics.
              </p>
              <div className="ff-compare__section ff-compare__section--warn">
                <strong>Will be deleted:</strong>
                <ul>
                  <li>Owner, Manager &amp; Driver accounts</li>
                  <li>All registered vehicles</li>
                  <li>Maintenance records &amp; options</li>
                  <li>Custom geofence zones</li>
                  <li>FleetEdge account integrations</li>
                  <li>Field-agent links (agents survive)</li>
                </ul>
              </div>
              <div className="ff-compare__section ff-compare__section--safe">
                <strong>Preserved for future use:</strong>
                <ul>
                  <li>Trips, fuel logs &amp; mileage</li>
                  <li>Uploaded documents &amp; OCR data</li>
                  <li>Revenue &amp; ledger records</li>
                  <li>Route masters &amp; location history</li>
                </ul>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="ff-compare__divider" aria-hidden="true">
              <span>or</span>
            </div>

            {/* ── Purge All Data (hard) ── */}
            <div className="ff-compare__col ff-compare__col--purge">
              <div className="ff-compare__head ff-compare__head--purge">
                <Flame size={16} />
                <span>Purge All Data</span>
              </div>
              <p className="ff-compare__desc">
                Wipes every record tied to this organisation across all collections. Zero data
                survives. Use only if completely decommissioning.
              </p>
              <div className="ff-compare__section ff-compare__section--purge">
                <strong>Everything deleted — including:</strong>
                <ul>
                  <li>
                    All of the above <em>plus</em>
                  </li>
                  <li>All trips &amp; trip ledger entries</li>
                  <li>All fuel logs &amp; comparisons</li>
                  <li>All uploaded documents</li>
                  <li>All mileage &amp; GPS traces</li>
                  <li>All routes, locations &amp; weight slips</li>
                  <li>All expense records</li>
                  <li>All geofence events &amp; anomalies</li>
                  <li>All FleetEdge vehicle &amp; consumption cache</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="ff-field">
            <label className="ff-field__label" htmlFor="del-confirm-input">
              Type{' '}
              <strong style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                {displayName}
              </strong>{' '}
              to unlock the action buttons
            </label>
            <input
              ref={inputRef}
              id="del-confirm-input"
              aria-label={`Type ${displayName} to unlock the action buttons`}
              className="ff-input ff-input--danger"
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={displayName}
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="ff-field__help">
              This must match exactly — including capitalisation.
            </span>
          </div>

          {/* API error */}
          {error && (
            <div className="ff-alert ff-alert--error" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="ff-modal__footer ff-modal__footer--split">
          <button className="ff-btn ff-btn--secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>

          <div className="ff-footer__actions">
            {/* Soft delete */}
            <button
              className="ff-btn ff-btn--danger"
              onClick={() => handleAction('delete')}
              disabled={!isConfirmed || loading}
              aria-busy={loading && activeMode === 'delete'}
              title="Removes entities only — preserves all historical data"
            >
              {loading && activeMode === 'delete' ? (
                <>
                  <span className="ff-btn-spinner" aria-hidden="true" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Delete Organisation
                </>
              )}
            </button>

            {/* Hard purge */}
            <button
              className="ff-btn ff-btn--purge"
              onClick={() => handleAction('purge')}
              disabled={!isConfirmed || loading}
              aria-busy={loading && activeMode === 'purge'}
              title="Permanently removes ALL data including historical records"
            >
              {loading && activeMode === 'purge' ? (
                <>
                  <span className="ff-btn-spinner" aria-hidden="true" />
                  Purging…
                </>
              ) : (
                <>
                  <Flame size={14} />
                  Purge All Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
