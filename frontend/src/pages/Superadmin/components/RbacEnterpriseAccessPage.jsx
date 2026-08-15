import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Save, RotateCcw, Building2, Shield, Inbox } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import RbacApi from './rbacService';
import './FeatureFlags.css';
import './Rbac.css';

/* Binary pill toggle (reuses the FeatureFlags switch styling). */
const Toggle = ({ checked, onChange, label }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} className="ff-switch" onClick={onChange}>
    <span className="ff-switch__thumb" />
  </button>
);

const RbacEnterpriseAccessPage = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState('');
  const [rows, setRows] = useState([]); // [{ role, enabled }]
  const [enabledMap, setEnabledMap] = useState({}); // roleId -> bool (working copy)
  const [original, setOriginal] = useState({});
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') navigate('/overview');
  }, [navigate]);

  useEffect(() => {
    const loadOrgs = async () => {
      setLoadingOrgs(true);
      try {
        setOrgs((await RbacApi.listOrganizations()) || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load organizations');
      } finally {
        setLoadingOrgs(false);
      }
    };
    loadOrgs();
  }, []);

  const loadRows = useCallback(async (id) => {
    if (!id) return;
    setLoadingRows(true);
    setError('');
    try {
      const data = (await RbacApi.listEnterpriseRoles(id)) || [];
      setRows(data);
      const map = {};
      data.forEach((r) => { map[r.role._id] = !!r.enabled; });
      setEnabledMap(map);
      setOriginal({ ...map });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load role availability');
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => { if (orgId) loadRows(orgId); }, [orgId, loadRows]);

  const dirty = useMemo(
    () => Object.keys(enabledMap).some((k) => enabledMap[k] !== original[k]),
    [enabledMap, original],
  );

  const toggle = (roleId) => setEnabledMap((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
  const reset = () => setEnabledMap({ ...original });

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = rows.map((r) => ({ roleId: r.role._id, enabled: !!enabledMap[r.role._id] }));
      await RbacApi.bulkSetEnterpriseRoles(orgId, payload);
      setOriginal({ ...enabledMap });
      toast.success('Role availability saved');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to save';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(enabledMap).filter(Boolean).length;

  return (
    <div className="ff-page">
      <PageHeader
        backLabel="Dashboard"
        backPath="/superadmin"
        currentLabel="Enterprise Role Access"
        title="Enterprise Role Access"
        description="Choose which global roles each enterprise can assign to its employees."
      />

      <div className="rbac-orgbar">
        <span className="ff-search__icon"><Building2 size={18} /></span>
        <select
          className="rbac-select"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          disabled={loadingOrgs}
        >
          <option value="">{loadingOrgs ? 'Loading enterprises…' : 'Select an enterprise…'}</option>
          {orgs.map((o) => (
            <option key={o._id} value={o._id}>{o.companyName || o.ownerEmail || o._id}</option>
          ))}
        </select>
        {orgId && (
          <span className="ff-meta">
            <strong>{enabledCount}</strong> role{enabledCount === 1 ? '' : 's'} available
            {dirty && <span className="ff-badge ff-badge--brand" style={{ marginLeft: 10 }}>Unsaved changes</span>}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button type="button" className="ff-btn ff-btn--secondary" onClick={reset} disabled={!dirty || saving}>
            <RotateCcw size={16} /> Reset
          </button>
          <button type="button" className="ff-btn ff-btn--primary" onClick={save} disabled={!dirty || saving || !orgId}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && <div className="ff-alert ff-alert--error" role="alert">{error}</div>}

      {!orgId && (
        <div className="ff-card">
          <div className="ff-state">
            <div className="ff-state__icon"><Building2 size={22} /></div>
            <div className="ff-state__title">Pick an enterprise</div>
            <div>Select an enterprise above to configure its available roles.</div>
          </div>
        </div>
      )}

      {orgId && (
        <div className="ff-card">
          <div className="ff-table-wrap">
            <table className="ff-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Base tier</th>
                  <th className="ff-center">Permissions</th>
                  <th className="ff-center">Available</th>
                </tr>
              </thead>
              <tbody>
                {loadingRows && (
                  <tr><td colSpan={4}><div className="ff-state"><div className="ff-spinner" /></div></td></tr>
                )}
                {!loadingRows && rows.length === 0 && (
                  <tr><td colSpan={4}>
                    <div className="ff-state">
                      <div className="ff-state__icon"><Inbox size={22} /></div>
                      <div className="ff-state__title">No assignable roles</div>
                      <div>Create global roles first from Roles &amp; Permissions.</div>
                    </div>
                  </td></tr>
                )}
                {!loadingRows && rows.map(({ role }) => {
                  const count = Array.isArray(role.permissionKeys) ? role.permissionKeys.length : 0;
                  return (
                    <tr key={role._id}>
                      <td>
                        <span className="ff-feature__label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <Shield size={15} /> {role.name}
                        </span>
                      </td>
                      <td className="ff-muted">{role.baseRole}</td>
                      <td className="ff-center"><span className="ff-badge ff-badge--brand">{count}</span></td>
                      <td className="ff-center">
                        <Toggle
                          checked={!!enabledMap[role._id]}
                          onChange={() => toggle(role._id)}
                          label={`Toggle availability of ${role.name}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RbacEnterpriseAccessPage;
