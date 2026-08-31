import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, RefreshCw, Trash2, X, KeyRound, Inbox } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import RbacApi from './rbacService';
import './FeatureFlags.css';
import './Rbac.css';

const ACTIONS = ['', 'VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'];

const RbacPermissionsPage = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ key: '', group: '', action: '', label: '', description: '', featureFlag: '' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') navigate('/overview');
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPermissions((await RbacApi.listPermissions()) || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const byGroup = new Map();
    permissions.forEach((p) => {
      const g = p.group || 'General';
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(p);
    });
    return [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const seed = async () => {
    setSeeding(true);
    try {
      setPermissions((await RbacApi.seedPermissions()) || []);
      toast.success('System permissions synced from feature flags');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to seed');
    } finally {
      setSeeding(false);
    }
  };

  const submitAdd = async () => {
    setAddError('');
    if (!/^[a-zA-Z0-9._-]{2,80}$/.test(form.key.trim())) {
      setAddError('Key: 2–80 chars, letters/digits/. _ - only.');
      return;
    }
    setAdding(true);
    try {
      const body = {
        key: form.key.trim(),
        group: form.group.trim() || undefined,
        action: form.action || undefined,
        label: form.label.trim() || undefined,
        description: form.description.trim() || undefined,
        featureFlag: form.featureFlag.trim() || undefined,
      };
      await RbacApi.createPermission(body);
      setAddOpen(false);
      setForm({ key: '', group: '', action: '', label: '', description: '', featureFlag: '' });
      toast.success(`Created "${body.key}"`);
      await load();
    } catch (e) {
      setAddError(e.response?.data?.message || 'Failed to create permission');
    } finally {
      setAdding(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await RbacApi.deletePermission(removeTarget._id);
      toast.success(`Removed "${removeTarget.key}"`);
      setRemoveTarget(null);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to remove');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="ff-page">
      <PageHeader
        backLabel="Dashboard"
        backPath="/superadmin"
        currentLabel="Permissions"
        title="Permissions"
        description="The global permission catalog. System permissions mirror feature flags; add custom ones for finer control."
      />

      <div className="ff-toolbar">
        <span className="ff-meta">
          {loading ? 'Loading…' : <><strong>{permissions.length}</strong> permission{permissions.length === 1 ? '' : 's'}</>}
        </span>
        <div className="ff-toolbar__actions">
          <button type="button" className="ff-btn ff-btn--secondary" onClick={seed} disabled={seeding}>
            <RefreshCw size={16} /> {seeding ? 'Syncing…' : 'Sync system permissions'}
          </button>
          <button type="button" className="ff-btn ff-btn--primary" onClick={() => { setAddError(''); setAddOpen(true); }}>
            <Plus size={16} /> New permission
          </button>
        </div>
      </div>

      {error && <div className="ff-alert ff-alert--error" role="alert">{error}</div>}

      {!loading && permissions.length === 0 && (
        <div className="ff-card">
          <div className="ff-state">
            <div className="ff-state__icon"><Inbox size={22} /></div>
            <div className="ff-state__title">No permissions yet</div>
            <div>Click “Sync system permissions” to seed from the feature-flag catalog.</div>
          </div>
        </div>
      )}

      {groups.map(([group, items]) => (
        <div className="ff-card" key={group} style={{ marginBottom: 16 }}>
          <div className="rbac-group__head" style={{ cursor: 'default' }}>
            <span className="rbac-group__title"><KeyRound size={16} /> {group}</span>
            <span className="rbac-group__count">{items.length}</span>
          </div>
          <div className="ff-table-wrap">
            <table className="ff-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Key</th>
                  <th className="ff-center">Action</th>
                  <th className="ff-center">Source</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td><span className="ff-feature__label">{p.label || p.key}</span></td>
                    <td><span className="ff-mono">{p.key}</span></td>
                    <td className="ff-center">{p.action || '—'}</td>
                    <td className="ff-center">
                      <span className="ff-badge ff-badge--outline">{p.isSystem ? 'System' : 'Custom'}</span>
                    </td>
                    <td className="ff-right" style={{ width: 56 }}>
                      {!p.isSystem && (
                        <button
                          type="button"
                          className="ff-icon-btn ff-icon-btn--danger"
                          title="Delete permission"
                          onClick={() => setRemoveTarget(p)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* New permission modal */}
      {addOpen && (
        <div className="ff-modal-overlay" onClick={() => !adding && setAddOpen(false)}>
          <div className="ff-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ff-modal__header">
              <div>
                <h2 className="ff-modal__title">New permission</h2>
                <p className="ff-modal__subtitle">Custom permissions can be assigned to any global role.</p>
              </div>
              <button type="button" className="ff-icon-btn" onClick={() => setAddOpen(false)} disabled={adding} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="ff-modal__body">
              {addError && <div className="ff-alert ff-alert--error" role="alert">{addError}</div>}
              <div className="ff-field">
                <label className="ff-field__label">Key</label>
                <input className="ff-input ff-mono" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. crm.edit" maxLength={80} autoFocus />
              </div>
              <div className="ff-field">
                <label className="ff-field__label">Group</label>
                <input className="ff-input" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="e.g. CRM" maxLength={60} />
              </div>
              <div className="ff-field">
                <label className="ff-field__label">Action</label>
                <select className="rbac-select" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                  {ACTIONS.map((a) => <option key={a} value={a}>{a || '(none)'}</option>)}
                </select>
              </div>
              <div className="ff-field">
                <label className="ff-field__label">Label</label>
                <input className="ff-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Edit CRM" maxLength={120} />
              </div>
              <div className="ff-field">
                <label className="ff-field__label">Description <span className="ff-muted">(optional)</span></label>
                <textarea className="ff-textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} />
              </div>
              <div className="ff-field">
                <label className="ff-field__label">Feature flag <span className="ff-muted">(optional entitlement gate)</span></label>
                <input className="ff-input ff-mono" value={form.featureFlag} onChange={(e) => setForm({ ...form, featureFlag: e.target.value })} placeholder="e.g. insurance" maxLength={80} />
              </div>
            </div>
            <div className="ff-modal__footer">
              <button type="button" className="ff-btn ff-btn--ghost" onClick={() => setAddOpen(false)} disabled={adding}>Cancel</button>
              <button type="button" className="ff-btn ff-btn--primary" onClick={submitAdd} disabled={adding}>{adding ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirm */}
      {removeTarget && (
        <div className="ff-modal-overlay" onClick={() => !removing && setRemoveTarget(null)}>
          <div className="ff-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ff-modal__header">
              <div><h2 className="ff-modal__title">Delete “{removeTarget.key}”?</h2>
                <p className="ff-modal__subtitle">Any role referencing this key will drop it on next save.</p></div>
            </div>
            <div className="ff-modal__footer">
              <button type="button" className="ff-btn ff-btn--ghost" onClick={() => setRemoveTarget(null)} disabled={removing}>Cancel</button>
              <button type="button" className="ff-btn ff-btn--danger" onClick={confirmRemove} disabled={removing}>{removing ? 'Removing…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RbacPermissionsPage;
