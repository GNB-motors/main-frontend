import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ChevronRight, Inbox, Trash2, AlertTriangle, X } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import apiClient from '../../../utils/axiosConfig';
import './FeatureFlags.css';

/* ─────────────────────────────────────────────────
   DeleteConfirmModal
   Requires the super-admin to type the exact org
   name before the delete button becomes active.
───────────────────────────────────────────────── */
const DeleteConfirmModal = ({ org, onCancel, onConfirmed }) => {
  const [typedName, setTypedName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the confirmation input when modal opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  // Block page scroll while the modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const displayName = org.companyName || org.ownerEmail || '(unnamed)';
  const isConfirmed = typedName.trim() === displayName.trim();

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await apiClient.delete(`/api/admin/organizations/${org._id}`);
      onConfirmed(org._id);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete organization. Please try again.');
      setDeleting(false);
    }
  };

  // Allow pressing Enter to confirm
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isConfirmed) handleDelete();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      className="ff-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="ff-modal">

        {/* ── Header ── */}
        <div className="ff-modal__header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span className="ff-confirm__icon">
              <AlertTriangle size={22} />
            </span>
            <div>
              <h2 className="ff-modal__title" id="del-modal-title">
                Delete Organisation
              </h2>
              <p className="ff-modal__subtitle">
                This action is <strong>permanent and cannot be undone</strong>.
              </p>
            </div>
          </div>
          <button
            className="ff-icon-btn"
            onClick={onCancel}
            aria-label="Close"
            disabled={deleting}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="ff-modal__body">

          {/* What will be deleted */}
          <div className="ff-warn-box">
            <strong>⚠ The following will be permanently deleted:</strong>
            <ul>
              <li>Owner, Manager &amp; Driver user accounts</li>
              <li>All registered vehicles</li>
              <li>Maintenance records &amp; service options</li>
              <li>Custom geofence zones</li>
              <li>FleetEdge account integrations</li>
              <li>Field-agent links to this organisation (agents themselves survive)</li>
            </ul>
          </div>

          {/* What is preserved */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            color: '#166534',
            lineHeight: 1.55,
          }}>
            <strong style={{ display: 'block', marginBottom: 4, color: '#14532d', fontWeight: 700 }}>
              ✓ Historical data is preserved for future use:
            </strong>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li>Trips, fuel logs, mileage &amp; location history</li>
              <li>Uploaded documents (fuel receipts, weight certs, odometer photos)</li>
              <li>Revenue, expense &amp; ledger records</li>
            </ul>
          </div>

          {/* Confirmation input */}
          <div className="ff-field">
            <label className="ff-field__label" htmlFor="del-confirm-input">
              Type <strong style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                {displayName}
              </strong> to confirm deletion
            </label>
            <input
              ref={inputRef}
              id="del-confirm-input"
              className={`ff-input ff-input--danger`}
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={displayName}
              disabled={deleting}
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
        <div className="ff-modal__footer">
          <button
            className="ff-btn ff-btn--secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="ff-btn ff-btn--danger"
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            aria-busy={deleting}
          >
            {deleting ? (
              <>
                <span className="ff-btn-spinner" aria-hidden="true" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete Organisation
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   OrgFeatureFlagsPage (main page)
───────────────────────────────────────────────── */
const OrgFeatureFlagsPage = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // The org currently staged for deletion (null = modal closed)
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
   * Called by the modal once the API delete call succeeds.
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
                {/* Two action columns: open-detail chevron + delete */}
                <th aria-label="Open" />
                <th aria-label="Delete" />
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
                    {/* Delete button — stops event propagation so row click isn't triggered */}
                    <td className="ff-actions">
                      <button
                        className="ff-icon-btn ff-icon-btn--danger"
                        title={`Delete ${org.companyName || org.ownerEmail || 'organisation'}`}
                        aria-label={`Delete ${org.companyName || org.ownerEmail || 'organisation'}`}
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
