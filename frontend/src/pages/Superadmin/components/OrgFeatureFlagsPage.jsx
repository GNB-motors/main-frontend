import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ChevronRight, Inbox } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import apiClient from '../../../utils/axiosConfig';
import './FeatureFlags.css';

const OrgFeatureFlagsPage = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

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
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="ff-state">
                      <div className="ff-spinner" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
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
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrgFeatureFlagsPage;
