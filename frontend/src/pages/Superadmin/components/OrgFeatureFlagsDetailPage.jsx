import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  ToggleRight,
} from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import apiClient from '../../../utils/axiosConfig';
import './FeatureFlags.css';

const FEATURE_LABELS = {
  overview: 'Overview',
  reports: 'Reports',
  vehicles: 'Vehicles',
  vehicleActivity: 'Vehicle Activity',
  drivers: 'Employees / Drivers',
  locations: 'Locations',
  fuelComparison: 'Fuel Comparison',
  khataLedger: 'Khata Ledger',
};

/* Accessible pill toggle that matches the app's indigo brand. */
const Toggle = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className="ff-switch"
    onClick={onChange}
  >
    <span className="ff-switch__thumb" />
  </button>
);

const OrgFeatureFlagsDetailPage = () => {
  const navigate = useNavigate();
  const { orgId } = useParams();

  const [orgName, setOrgName] = useState('');
  const [flags, setFlags] = useState({});
  const [original, setOriginal] = useState({});
  const [knownKeys, setKnownKeys] = useState([]);
  const [registryKeys, setRegistryKeys] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // "+ New flag" modal state
  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  // Remove-flag confirm state
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError('');
    try {
      const [flagsRes, orgsRes, registryRes] = await Promise.all([
        apiClient.get(`/api/feature-flags/${orgId}`),
        apiClient.get('/api/admin/organizations'),
        apiClient.get('/api/feature-flags/registry'),
      ]);
      const payload = flagsRes.data?.data ?? {};
      setFlags(payload.flags || {});
      setOriginal(payload.flags || {});
      setKnownKeys(payload.knownKeys || []);
      const registry = registryRes.data?.data ?? [];
      setRegistryKeys(new Set(registry.map((r) => r.key)));
      const list = orgsRes.data?.data ?? [];
      const me = list.find((o) => o._id === orgId);
      setOrgName(me?.companyName || me?.ownerEmail || orgId);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key) => {
    setFlags((prev) => ({ ...prev, [key]: !prev?.[key] }));
  };

  const dirty = knownKeys.some(
    (k) => (flags?.[k] === true) !== (original?.[k] === true),
  );

  const enabledCount = knownKeys.filter((k) => flags?.[k] === true).length;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const features = {};
      knownKeys.forEach((k) => {
        features[k] = flags?.[k] === true;
      });
      const res = await apiClient.patch(`/api/feature-flags/${orgId}`, { features });
      const next = res.data?.data?.flags || features;
      setFlags(next);
      setOriginal(next);
      toast.success('Feature flags saved');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to save';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setFlags(original);

  const openAdd = () => {
    setNewKey('');
    setNewLabel('');
    setNewDescription('');
    setAddError('');
    setAddOpen(true);
  };

  const submitAdd = async () => {
    setAddError('');
    const trimmedKey = newKey.trim();
    const trimmedLabel = newLabel.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(trimmedKey)) {
      setAddError('Key must start with a letter; letters, digits, _, - only.');
      return;
    }
    if (!trimmedLabel) {
      setAddError('Label required.');
      return;
    }
    setAdding(true);
    try {
      await apiClient.post('/api/feature-flags/registry', {
        key: trimmedKey,
        label: trimmedLabel,
        description: newDescription.trim(),
      });
      setAddOpen(false);
      toast.success(`Registered "${trimmedKey}"`);
      await load();
    } catch (e) {
      setAddError(e.response?.data?.message || 'Failed to register key');
    } finally {
      setAdding(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await apiClient.delete(
        `/api/feature-flags/registry/${encodeURIComponent(removeTarget)}`,
      );
      toast.success(`Removed "${removeTarget}"`);
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
        backLabel="Organizations"
        backPath="/superadmin/feature-flags"
        currentLabel={orgName || '…'}
        title={orgName || 'Organization'}
        description="Toggle which sidebar features this organization can access."
      />

      <div className="ff-toolbar">
        <span className="ff-meta">
          {loading ? (
            'Loading…'
          ) : (
            <>
              <strong>{enabledCount}</strong> of <strong>{knownKeys.length}</strong> features enabled
              {dirty && <span className="ff-badge ff-badge--brand" style={{ marginLeft: 10 }}>Unsaved changes</span>}
            </>
          )}
        </span>
        <div className="ff-toolbar__actions">
          <button type="button" className="ff-btn ff-btn--outline-brand" onClick={openAdd}>
            <Plus size={16} /> New flag
          </button>
          <button
            type="button"
            className="ff-btn ff-btn--secondary"
            onClick={reset}
            disabled={!dirty || saving}
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            type="button"
            className="ff-btn ff-btn--primary"
            onClick={save}
            disabled={!dirty || saving}
          >
            <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
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
                <th>Feature</th>
                <th>Key</th>
                <th className="ff-center">Source</th>
                <th className="ff-center">Status</th>
                <th className="ff-center">Enabled</th>
                <th aria-label="Actions" />
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

              {!loading && knownKeys.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="ff-state">
                      <div className="ff-state__icon">
                        <ToggleRight size={22} />
                      </div>
                      <div className="ff-state__title">No feature keys yet</div>
                      <div>Register one with “New flag” to get started.</div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                knownKeys.map((key) => {
                  const enabled = flags?.[key] === true;
                  const isDynamic = registryKeys.has(key);
                  return (
                    <tr key={key}>
                      <td>
                        <span className="ff-feature__label">
                          {FEATURE_LABELS[key] || key}
                        </span>
                      </td>
                      <td>
                        <span className="ff-mono">{key}</span>
                      </td>
                      <td className="ff-center">
                        <span className="ff-badge ff-badge--outline">
                          {isDynamic ? 'Custom' : 'Built-in'}
                        </span>
                      </td>
                      <td className="ff-center">
                        {enabled ? (
                          <span className="ff-badge ff-badge--success">
                            <span className="ff-badge__dot" /> Enabled
                          </span>
                        ) : (
                          <span className="ff-badge ff-badge--neutral">Denied</span>
                        )}
                      </td>
                      <td className="ff-center">
                        <Toggle
                          checked={enabled}
                          onChange={() => toggle(key)}
                          label={`Toggle ${FEATURE_LABELS[key] || key}`}
                        />
                      </td>
                      <td className="ff-right" style={{ width: 56 }}>
                        {isDynamic && (
                          <button
                            type="button"
                            className="ff-icon-btn ff-icon-btn--danger"
                            title="Remove from registry"
                            onClick={() => setRemoveTarget(key)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register new flag modal */}
      {addOpen && (
        <div
          className="ff-modal-overlay"
          onClick={() => !adding && setAddOpen(false)}
        >
          <div
            className="ff-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ff-add-title"
          >
            <div className="ff-modal__header">
              <div>
                <h2 className="ff-modal__title" id="ff-add-title">
                  Register a new feature flag
                </h2>
                <p className="ff-modal__subtitle">
                  New flags become available to all organizations. Each one starts
                  denied — flip the toggle to enable it.
                </p>
              </div>
              <button
                type="button"
                className="ff-icon-btn"
                onClick={() => setAddOpen(false)}
                disabled={adding}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="ff-modal__body">
              {addError && (
                <div className="ff-alert ff-alert--error" role="alert">
                  {addError}
                </div>
              )}

              <div className="ff-field">
                <label className="ff-field__label" htmlFor="ff-new-key">
                  Key (slug)
                </label>
                <input
                  id="ff-new-key"
                  className="ff-input ff-mono"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. inventoryTracker"
                  maxLength={64}
                  autoFocus
                />
                <span className="ff-field__help">
                  Start with a letter. Letters, digits, _, - only. Max 64 chars.
                </span>
              </div>

              <div className="ff-field">
                <label className="ff-field__label" htmlFor="ff-new-label">
                  Display label
                </label>
                <input
                  id="ff-new-label"
                  className="ff-input"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Inventory Tracker"
                  maxLength={120}
                />
              </div>

              <div className="ff-field">
                <label className="ff-field__label" htmlFor="ff-new-desc">
                  Description <span className="ff-muted">(optional)</span>
                </label>
                <textarea
                  id="ff-new-desc"
                  className="ff-textarea"
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="ff-modal__footer">
              <button
                type="button"
                className="ff-btn ff-btn--ghost"
                onClick={() => setAddOpen(false)}
                disabled={adding}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ff-btn ff-btn--primary"
                onClick={submitAdd}
                disabled={adding}
              >
                {adding ? 'Registering…' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove flag confirm modal */}
      {removeTarget && (
        <div
          className="ff-modal-overlay"
          onClick={() => !removing && setRemoveTarget(null)}
        >
          <div
            className="ff-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ff-remove-title"
          >
            <div className="ff-modal__header">
              <div style={{ display: 'flex', gap: 14 }}>
                <span className="ff-confirm__icon">
                  <AlertTriangle size={22} />
                </span>
                <div>
                  <h2 className="ff-modal__title" id="ff-remove-title">
                    Remove “{removeTarget}”?
                  </h2>
                  <p className="ff-modal__subtitle">
                    It stops appearing here for all organizations. Each org keeps its
                    stored value, so re-registering the key restores it.
                  </p>
                </div>
              </div>
            </div>
            <div className="ff-modal__footer">
              <button
                type="button"
                className="ff-btn ff-btn--ghost"
                onClick={() => setRemoveTarget(null)}
                disabled={removing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ff-btn ff-btn--danger"
                onClick={confirmRemove}
                disabled={removing}
              >
                {removing ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgFeatureFlagsDetailPage;
