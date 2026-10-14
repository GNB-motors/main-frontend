import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ChevronRight, Inbox, Trash2 } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import { OrgFeatureFlagsService } from './OrgFeatureFlagsService';
import DeleteConfirmModal from './featureFlags/DeleteConfirmModal';
import useApi from '../../../hooks/useApi';
import { getUserRole } from '../../../utils/session';
import './FeatureFlags.css';

/* ─────────────────────────────────────────────────────────────────────────
   OrgFeatureFlagsPage (main page)
──────────────────────────────────────────────────────────────────────────── */
const OrgFeatureFlagsPage = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // The org currently staged for removal (null = modal closed)
  const [orgToDelete, setOrgToDelete] = useState(null);

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') {
      navigate('/profile');
    }
  }, [navigate]);

  const {
    data: orgsResponse,
    loading,
    error: orgsError,
  } = useApi((signal) => OrgFeatureFlagsService.listOrganizations({ signal }), []);

  useEffect(() => {
    if (loading) setError('');
  }, [loading]);

  useEffect(() => {
    if (orgsResponse) setOrgs(orgsResponse);
  }, [orgsResponse]);

  useEffect(() => {
    if (orgsError) setError(orgsError.response?.data?.message || 'Failed to load organizations');
  }, [orgsError]);

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
        description="Pick an organization to manage its enabled sidebar features and email reports."
      />

      <div className="ff-toolbar">
        <span className="ff-meta">
          {loading ? (
            'Loading…'
          ) : (
            <>
              <strong>{filtered.length}</strong> organization{filtered.length === 1 ? '' : 's'}
            </>
          )}
        </span>
        <div className="ff-search">
          <span className="ff-search__icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, GSTIN"
            aria-label="Search by name, email, GSTIN"
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
          <table className="ff-table ff-table--orgs">
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
                  <td colSpan={7} aria-label="Loading organizations">
                    <div className="ff-state">
                      <div className="ff-spinner" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} aria-label="No organizations found. Try adjusting your search.">
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
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
                    <td>
                      <div className="ff-org">
                        <span className="ff-org__avatar">
                          <Building2 size={18} />
                        </span>
                        <span className="ff-org__name" title={org.companyName || '(unnamed)'}>
                          {org.companyName || '(unnamed)'}
                        </span>
                      </div>
                    </td>
                    <td className="ff-muted" title={org.ownerEmail || ''}>
                      {org.ownerEmail || '—'}
                    </td>
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
