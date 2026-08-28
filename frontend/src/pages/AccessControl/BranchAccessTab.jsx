import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Shield, Save, RotateCcw, Building2, MapPin, Plus, Trash2 } from 'lucide-react';
import AccessControlApi from './accessControlService';
import PermissionTreeView from './PermissionTreeView';
import RoleFormModal from './RoleFormModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const setsEqual = (a, b) => a.size === b.size && [...a].every((k) => b.has(k));

/* Binary pill toggle (reuses FeatureFlags switch styling). */
const Toggle = ({ checked, onChange, label }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} className="ff-switch" onClick={onChange}>
    <span className="ff-switch__thumb" />
  </button>
);

/**
 * Branch Access tab — pick a branch, then override the enterprise default for
 * each role at that branch (enable/disable + per-permission overrides), or reset
 * back to the enterprise default. Never touches the enterprise role or other
 * branches.
 */
const BranchAccessTab = ({ initialBranchId = '', lockedBranchName = '' }) => {
  // When opened from inside a location, the branch is fixed to that location —
  // no dropdown, no "select a branch" step.
  const locked = !!initialBranchId;
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(initialBranchId);
  const [catalog, setCatalog] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // Working state for the selected role.
  const [granted, setGranted] = useState(new Set());
  const [baseline, setBaseline] = useState(new Set());
  const [enabled, setEnabled] = useState(true);
  const [original, setOriginal] = useState({ granted: new Set(), enabled: true });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Branch-scoped role creation + deletion (mirrors the enterprise tab).
  const canManageRoles = localStorage.getItem('user_role') === 'OWNER';
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Load branches + permission catalog once.
  useEffect(() => {
    Promise.all([AccessControlApi.listBranches(), AccessControlApi.getRolesAndCatalog()])
      .then(([br, rc]) => {
        setBranches(br || []);
        setCatalog(rc?.catalog || []);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const selectRoleRow = useCallback((row) => {
    setSelectedRoleId(row.role._id);
    const g = new Set(row.effectivePermissionKeys || []);
    setGranted(g);
    setBaseline(new Set(row.enterprisePermissionKeys || []));
    setEnabled(row.enabled !== false);
    setOriginal({ granted: new Set(g), enabled: row.enabled !== false });
  }, []);

  const loadBranchRoles = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = (await AccessControlApi.getBranchRoles(id)) || [];
      setRows(data);
      if (data.length) selectRoleRow(data.find((r) => r.role._id === selectedRoleId) || data[0]);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load branch roles');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectRoleRow]);

  // Follow the header location switcher when it changes while this tab is open.
  useEffect(() => { setBranchId(initialBranchId); }, [initialBranchId]);

  useEffect(() => { if (branchId) loadBranchRoles(branchId); }, [branchId, loadBranchRoles]);

  const selectedRow = rows.find((r) => r.role._id === selectedRoleId) || null;

  const dirty = useMemo(
    () => enabled !== original.enabled || !setsEqual(granted, original.granted),
    [granted, enabled, original],
  );

  const toggleKey = (key) =>
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleGroup = (items, allOn) =>
    setGranted((prev) => {
      const next = new Set(prev);
      items.forEach((p) => (allOn ? next.delete(p.key) : next.add(p.key)));
      return next;
    });

  const save = async () => {
    if (!selectedRow) return;
    setSaving(true);
    setError('');
    try {
      // Send only the keys that differ from the enterprise default.
      const overrides = {};
      catalog.forEach((p) => {
        const base = baseline.has(p.key);
        const cur = granted.has(p.key);
        if (cur !== base) overrides[p.key] = cur;
      });
      await AccessControlApi.setBranchRole(branchId, selectedRow.role._id, { enabled, permissionOverrides: overrides });
      toast.success(`Saved override for "${selectedRow.role.name}"`);
      await loadBranchRoles(branchId);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to save';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!selectedRow) return;
    setSaving(true);
    setError('');
    try {
      await AccessControlApi.resetBranchRole(branchId, selectedRow.role._id);
      toast.success(`"${selectedRow.role.name}" reset to enterprise default`);
      await loadBranchRoles(branchId);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  const revert = () => {
    setGranted(new Set(original.granted));
    setEnabled(original.enabled);
  };

  // Delete a branch-scoped custom role (only BRANCH roles are deletable here).
  const confirmDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleteBusy(true);
    try {
      await AccessControlApi.deleteRole(deletingRole._id);
      toast.success(`Deleted "${deletingRole.name}"`);
      setDeletingRole(null);
      setSelectedRoleId(null);
      await loadBranchRoles(branchId);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete role');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div>
      <div className="rbac-orgbar">
        <span className="ff-search__icon"><MapPin size={18} /></span>
        {locked ? (
          <span className="ff-meta">
            Location:{' '}
            <strong>
              {lockedBranchName
                || branches.find((b) => String(b._id) === String(branchId))?.name
                || 'this location'}
            </strong>
          </span>
        ) : (
          <select className="rbac-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Select a branch…</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        )}
        {branchId && (
          <span className="ac-legend">
            <span className="ac-chip ac-chip--inherited">Inherited</span>
            <span className="ac-chip ac-chip--override">Override</span>
          </span>
        )}
      </div>

      {error && <div className="ff-alert ff-alert--error" role="alert">{error}</div>}

      {!branchId && (
        <div className="ff-card">
          <div className="ff-state">
            <div className="ff-state__icon"><Building2 size={22} /></div>
            <div className="ff-state__title">Pick a branch</div>
            <div>Select a branch to configure its role access. Branches inherit the enterprise default until you override.</div>
          </div>
        </div>
      )}

      {branchId && (
        <div className="rbac-layout">
          <div className="rbac-master">
            {canManageRoles && (
              <button
                type="button"
                className="ff-btn ff-btn--ghost"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
                onClick={() => setRoleFormOpen(true)}
              >
                <Plus size={16} /> Add branch role
              </button>
            )}
            {loading && <div className="ff-state"><div className="ff-spinner" /></div>}
            {!loading && rows.map((row) => (
              <button
                key={row.role._id}
                type="button"
                className={`rbac-role ${row.role._id === selectedRoleId ? 'rbac-role--active' : ''}`}
                onClick={() => selectRoleRow(row)}
              >
                <span className="rbac-role__name">
                  <Shield size={15} /> {row.role.name}
                  {row.role.scopeType === 'BRANCH' && <span className="ac-chip ac-chip--branch">Branch role</span>}
                </span>
                <span className="rbac-role__meta">
                  {row.enabled === false ? 'disabled here' : row.hasBranchConfig ? 'overridden' : 'inherited'}
                </span>
              </button>
            ))}
            {!loading && rows.length === 0 && <div className="rbac-role__meta" style={{ padding: 12 }}>No roles available here.</div>}
          </div>

          <div className="rbac-detail">
            {selectedRow && (
              <>
                <div className="ac-detail__head">
                  <div>
                    <div className="rbac-detail__title"><Shield size={16} /> {selectedRow.role.name}</div>
                    <div className="rbac-detail__sub">
                      Overrides here apply only to this branch. Untouched permissions stay inherited from the enterprise default.
                    </div>
                  </div>
                  {/* Only branch-scoped custom roles can be deleted; enterprise
                      defaults inherited here are managed at the enterprise level. */}
                  {canManageRoles && selectedRow.role.scopeType === 'BRANCH' && (
                    <div className="ac-detail__actions">
                      <button
                        type="button"
                        className="ff-btn ff-btn--ghost"
                        onClick={() => setDeletingRole(selectedRow.role)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="rbac-perm" style={{ borderTop: 'none', paddingLeft: 0, paddingRight: 0 }}>
                  <div>
                    <div className="rbac-perm__label">Role available at this branch</div>
                    <div className="rbac-perm__desc">Turn off to make this role unavailable at this branch.</div>
                  </div>
                  <Toggle checked={enabled} onChange={() => setEnabled((v) => !v)} label="Role available at this branch" />
                </div>

                <PermissionTreeView
                  catalog={catalog}
                  granted={granted}
                  baseline={baseline}
                  readOnly={!enabled}
                  onToggleKey={toggleKey}
                  onToggleGroup={toggleGroup}
                />

                <div className="rbac-detail__footer">
                  <button type="button" className="ff-btn ff-btn--ghost" onClick={resetToDefault} disabled={saving || !selectedRow.hasBranchConfig}>
                    Reset to Enterprise Default
                  </button>
                  <button type="button" className="ff-btn ff-btn--secondary" onClick={revert} disabled={!dirty || saving}>
                    <RotateCcw size={16} /> Cancel
                  </button>
                  <button type="button" className="ff-btn ff-btn--primary" onClick={save} disabled={!dirty || saving}>
                    <Save size={16} /> {saving ? 'Saving…' : 'Save override'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <RoleFormModal
        open={roleFormOpen}
        onClose={() => setRoleFormOpen(false)}
        catalog={catalog}
        branchId={branchId}
        onSaved={async (saved) => {
          await loadBranchRoles(branchId);
          if (saved?._id) setSelectedRoleId(saved._id);
        }}
      />

      <ConfirmDeleteModal
        open={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={confirmDeleteRole}
        title="Delete branch role"
        message="This role exists only in this branch and will be removed. This cannot be undone."
        itemName={deletingRole?.name}
        confirmLabel="Delete role"
        busy={deleteBusy}
      />
    </div>
  );
};

export default BranchAccessTab;
