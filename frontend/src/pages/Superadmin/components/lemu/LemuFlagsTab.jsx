import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Inbox, Search, ToggleRight } from 'lucide-react';
import apiClient from '../../../../utils/axiosConfig';
import useApi from '../../../../hooks/useApi';

/* Keys of an org's featureFlags map that are explicitly enabled. */
const enabledFlags = (org) =>
  Object.entries(org.featureFlags || {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);

/* Flags tab — read-only overview of every organization's feature-flag
   state. Loads the same payload as OrgFeatureFlagsPage
   (GET /api/admin/organizations) and links out to the existing
   feature-flags detail page for editing. No new backend involved. */
const LemuFlagsTab = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const { data: orgsResponse, loading, error: orgsError } = useApi(
    (signal) => apiClient.get('/api/admin/organizations', { signal }),
    []
  );

  useEffect(() => {
    if (loading) setError('');
  }, [loading]);

  useEffect(() => {
    if (orgsResponse) setOrgs(orgsResponse.data?.data ?? []);
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

  return (
    <section className="lemu-section">
      <div className="lemu-section__head">
        <h2 className="lemu-section__title">
          <ToggleRight size={16} /> Feature Flags
        </h2>
        <span className="lemu-meta">
          {loading ? 'Loading…' : <><strong>{filtered.length}</strong> organization{filtered.length === 1 ? '' : 's'}</>}
        </span>
      </div>

      <div className="lemu-alert lemu-alert--info" role="note">
        Per-org on/off toggles — no rollout %, targeting rules, or variants yet.
        Open an organization to change its flags.
      </div>

      <div className="lemu-filters">
        <div className="lemu-search">
          <span className="lemu-search__icon"><Search size={16} /></span>
          <input
            type="text"
            placeholder="Search by name, email, GSTIN"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="lemu-alert lemu-alert--error" role="alert">{error}</div>
      )}

      <div className="lemu-card">
        <div className="lemu-table-wrap">
          <table className="lemu-table lemu-table--flags">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Owner Email</th>
                <th>GSTIN</th>
                <th className="lemu-center">Onboarded</th>
                <th>Enabled Features</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6}><div className="lemu-state"><div className="lemu-spinner" /></div></td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="lemu-state">
                      <div className="lemu-state__icon"><Inbox size={22} /></div>
                      <div className="lemu-state__title">No organizations found</div>
                      <div>Try adjusting your search.</div>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.map((org) => {
                const enabled = enabledFlags(org);
                return (
                  <tr
                    key={org._id}
                    className="lemu-clickable"
                    onClick={() => navigate(`/superadmin/feature-flags/${org._id}`)}
                  >
                    <td>
                      <div className="lemu-org">
                        <span className="lemu-org__avatar">
                          <Building2 size={18} />
                        </span>
                        <span className="lemu-org__name" title={org.companyName || '(unnamed)'}>
                          {org.companyName || '(unnamed)'}
                        </span>
                      </div>
                    </td>
                    <td className="lemu-muted" title={org.ownerEmail || ''}>{org.ownerEmail || '—'}</td>
                    <td className="lemu-muted">{org.gstin || '—'}</td>
                    <td className="lemu-center">
                      {org.isOnboarded ? (
                        <span className="lemu-pill lemu-pill--ok">
                          <span className="lemu-pill__dot" /> Yes
                        </span>
                      ) : (
                        <span className="lemu-pill lemu-pill--unmonitored">No</span>
                      )}
                    </td>
                    <td>
                      {enabled.length === 0 ? (
                        <span className="lemu-muted">None</span>
                      ) : (
                        <span className="lemu-flag-chips">
                          {enabled.map((key) => (
                            <span className="lemu-badge lemu-badge--sev-info" key={key} title={key}>{key}</span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="lemu-right">
                      <span className="lemu-chevron">
                        <ChevronRight size={16} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default LemuFlagsTab;
