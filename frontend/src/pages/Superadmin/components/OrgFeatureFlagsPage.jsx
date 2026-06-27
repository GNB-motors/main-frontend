import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ChevronRight, Inbox, Trash2, AlertTriangle, X, Flame } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import apiClient from '../../../utils/axiosConfig';
import './FeatureFlags.css';

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
  const [typedName, setTypedName]   = useState('');
  const [activeMode, setActiveMode] = useState(null); // 'delete' | 'purge'
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const inputRef = useRef(null);

  // Auto-focus the confirmation input when modal opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Block page scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const displayName = org.companyName || org.ownerEmail || '(unnamed)';
  const isConfirmed = typedName.trim() === displayName.trim();

  const handleAction = async (mode) => {
    if (!isConfirmed || loading) return;
    setActiveMode(mode);
    setLoading(true);
    setError('');
    try {
      const url = mode === 'purge'
        ? `/api/admin/organizations/${org._id}/purge`
        : `/api/admin/organizations/${org._id}`;
      await apiClient.delete(url);
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div className="ff-modal ff-modal--wide">

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
                Choose a removal mode. <strong>Both actions are permanent and cannot be undone.</strong>
              </p>
            </div>
          </div>
          <button
            className="ff-icon-btn"
            onClick={onCancel}
            aria-label="Close"
            disabled={loading}
          >
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
                Removes the organisation's operational setup while retaining all
                historical records for future analytics.
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
                Wipes every record tied to this organisation across all collections.
                Zero data survives. Use only if completely decommissioning.
              </p>
              <div className="ff-compare__section ff-compare__section--purge">
                <strong>Everything deleted — including:</strong>
                <ul>
                  <li>All of the above <em>plus</em></li>
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
              Type <strong style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                {displayName}
              </strong> to unlock the action buttons
            </label>
            <input
              ref={inputRef}
              id="del-confirm-input"
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
          <button
            className="ff-btn ff-btn--secondary"
            onClick={onCancel}
            disabled={loading}
          >
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

/* ─────────────────────────────────────────────────────────────────────────
   OrgFeatureFlagsPage (main page)
──────────────────────────────────────────────────────────────────────────── */
const OrgFeatureFlagsPage = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // The org currently staged for removal (null = modal closed)
  const [orgToDelete, setOrgToDelete] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/api/admin/organizations');
        setOrgs(res.data?.data ?? []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load organizations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = orgs.filter((o) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (o.companyName || '').toLowerCase().includes(q) ||
      (o.ownerEmail || '').toLowerCase().includes(q) ||
      (o.gstin || '').toLowerCase().includes(q)
    );
  });

  const flagCount = (org) => {
    const flags = org.featureFlags || {};
    return Object.values(flags).filter((v) => v === true).length;
  };

  /**
   * Called by the modal once the API call (delete or purge) succeeds.
   * Removes the org from local state without a full reload.
   */
  const handleDeleteConfirmed = (deletedOrgId) => {
    setOrgToDelete(null);
    setOrgs((prev) => prev.filter((o) => o._id !== deletedOrgId));
  };

  return (
    <div className="ff-page">
      <PageHeader
        backLabel="Dashboard"
        backPath="/superadmin"
        currentLabel="Feature Flags"
        title="Feature Flags"
        description="Pick an organization to manage its enabled sidebar features."
      />

      <div className="ff-toolbar">
        <span className="ff-meta">
          {loading ? 'Loading…' : <><strong>{filtered.length}</strong> organization{filtered.length === 1 ? '' : 's'}</>}
        </span>
        <div className="ff-search">
          <span className="ff-search__icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, GSTIN"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="ff-alert ff-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="ff-card">
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Owner Email</th>
                <th>GSTIN</th>
                <th className="ff-center">Onboarded</th>
                <th className="ff-center">Enabled Features</th>
                {/* Two action columns: open-detail chevron + remove */}
                <th aria-label="Open" />
                <th aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7}>
                    <div className="ff-state">
                      <div className="ff-spinner" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="ff-state">
                      <div className="ff-state__icon">
                        <Inbox size={22} />
                      </div>
                      <div className="ff-state__title">No organizations found</div>
                      <div>Try adjusting your search.</div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((org) => (
                  <tr
                    key={org._id}
                    className="ff-clickable"
                    onClick={() => navigate(`/superadmin/feature-flags/${org._id}`)}
                  >
                    <td>
                      <div className="ff-org">
                        <span className="ff-org__avatar">
                          <Building2 size={18} />
                        </span>
                        <span className="ff-org__name">
                          {org.companyName || '(unnamed)'}
                        </span>
                      </div>
                    </td>
                    <td className="ff-muted">{org.ownerEmail || '—'}</td>
                    <td className="ff-muted">{org.gstin || '—'}</td>
                    <td className="ff-center">
                      {org.isOnboarded ? (
                        <span className="ff-badge ff-badge--success">
                          <span className="ff-badge__dot" /> Yes
                        </span>
                      ) : (
                        <span className="ff-badge ff-badge--neutral">No</span>
                      )}
                    </td>
                    <td className="ff-center">
                      <span className="ff-badge ff-badge--brand">{flagCount(org)}</span>
                    </td>
                    <td className="ff-right">
                      <span className="ff-chevron">
                        <ChevronRight size={18} />
                      </span>
                    </td>
                    {/* Remove button — stops row-click propagation */}
                    <td className="ff-actions">
                      <button
                        className="ff-icon-btn ff-icon-btn--danger"
                        title={`Remove ${org.companyName || org.ownerEmail || 'organisation'}`}
                        aria-label={`Remove ${org.companyName || org.ownerEmail || 'organisation'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrgToDelete(org);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal — rendered at page root so it overlays everything */}
      {orgToDelete && (
        <DeleteConfirmModal
          org={orgToDelete}
          onCancel={() => setOrgToDelete(null)}
          onConfirmed={handleDeleteConfirmed}
        />
      )}
    </div>
  );
};

export default OrgFeatureFlagsPage;
