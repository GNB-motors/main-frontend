import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Save, RotateCcw, Plus, Trash2, ToggleRight } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import { OrgFeatureFlagsService } from './OrgFeatureFlagsService';
import useApi from '../../../hooks/useApi';
import { getUserRole } from '../../../utils/session';
import './FeatureFlags.css';
import { changedFlags } from './changedFlags';
import Toggle from './featureFlags/Toggle';
import RegisterFlagModal from './featureFlags/RegisterFlagModal';
import RemoveFlagModal from './featureFlags/RemoveFlagModal';

const FEATURE_LABELS = {
  overview: 'Overview',
  reports: 'Reports',
  vehicles: 'Vehicles',
  vehicleActivity: 'Vehicle Activity',
  drivers: 'Employees / Drivers',
  locations: 'Locations',
  fuelComparison: 'Fuel Comparison',
  khataLedger: 'Khata Ledger',
  dailyMileageReport: 'Daily Mileage Report Email',
  geofence: 'Geofence',
};

const OrgFeatureFlagsDetailPage = () => {
  const navigate = useNavigate();
  const { orgId } = useParams();

  const [orgName, setOrgName] = useState('');
  const [flags, setFlags] = useState({});
  const [original, setOriginal] = useState({});
  const [knownKeys, setKnownKeys] = useState([]);
  const [registryKeys, setRegistryKeys] = useState(new Set());
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
    if (getUserRole() !== 'SUPER_ADMIN') {
      navigate('/profile');
    }
  }, [navigate]);

  const {
    data: flagsData,
    loading,
    error: loadError,
    refetch,
  } = useApi(
    async (signal) => {
      if (!orgId) return null;
      const [payload, orgs, registry] = await Promise.all([
        OrgFeatureFlagsService.getOrgFlags(orgId, { signal }),
        OrgFeatureFlagsService.listOrganizations({ signal }),
        OrgFeatureFlagsService.getFlagRegistry({ signal }),
      ]);
      return { payload, orgs, registry };
    },
    [JSON.stringify({ orgId })],
  );

  useEffect(() => {
    if (loading) setError('');
  }, [loading]);

  useEffect(() => {
    if (!flagsData) return;
    const { payload } = flagsData;
    setFlags(payload.flags || {});
    setOriginal(payload.flags || {});
    setKnownKeys(payload.knownKeys || []);
    const { registry } = flagsData;
    setRegistryKeys(new Set(registry.map((r) => r.key)));
    const list = flagsData.orgs;
    const me = list.find((o) => o._id === orgId);
    setOrgName(me?.companyName || me?.ownerEmail || orgId);
  }, [flagsData, orgId]);

  useEffect(() => {
    if (loadError) setError(loadError.response?.data?.message || 'Failed to load flags');
  }, [loadError]);

  const toggle = (key) => {
    setFlags((prev) => ({ ...prev, [key]: !prev?.[key] }));
  };

  const dirty = knownKeys.some((k) => (flags?.[k] === true) !== (original?.[k] === true));

  const enabledCount = knownKeys.filter((k) => flags?.[k] === true).length;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const features = changedFlags(knownKeys, original, flags);
      if (!Object.keys(features).length) return;
      const saved = await OrgFeatureFlagsService.updateOrgFlags(orgId, features);
      const next = saved?.flags || { ...original, ...features };
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
      await OrgFeatureFlagsService.registerFlag({
        key: trimmedKey,
        label: trimmedLabel,
        description: newDescription.trim(),
      });
      setAddOpen(false);
      toast.success(`Registered "${trimmedKey}"`);
      refetch();
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
      await OrgFeatureFlagsService.removeRegisteredFlag(removeTarget);
      toast.success(`Removed "${removeTarget}"`);
      setRemoveTarget(null);
      refetch();
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
        description="Toggle which sidebar features and automated email reports this organization can access."
      />

      <div className="ff-toolbar">
        <span className="ff-meta">
          {loading ? (
            'Loading…'
          ) : (
            <>
              <strong>{enabledCount}</strong> of <strong>{knownKeys.length}</strong> features
              enabled
              {dirty && (
                <span className="ff-badge ff-badge--brand" style={{ marginLeft: 10 }}>
                  Unsaved changes
                </span>
              )}
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
                  <td colSpan={6} aria-label="Loading feature flags">
                    <div className="ff-state">
                      <div className="ff-spinner" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && knownKeys.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    aria-label="No feature keys yet. Register one with “New flag” to get started."
                  >
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
                        <span className="ff-feature__label">{FEATURE_LABELS[key] || key}</span>
                        {key === 'dailyMileageReport' && (
                          <div className="ff-feature__hint">
                            Sends a daily 09:00 IST mileage digest to this org.
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="ff-mono">{key}</span>
                      </td>
                      <td className="ff-center">
                        <span className="ff-badge ff-badge--outline">
                          {key === 'dailyMileageReport'
                            ? 'Email'
                            : isDynamic
                              ? 'Custom'
                              : 'Built-in'}
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
        <RegisterFlagModal
          newKey={newKey}
          setNewKey={setNewKey}
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          newDescription={newDescription}
          setNewDescription={setNewDescription}
          addError={addError}
          adding={adding}
          setAddOpen={setAddOpen}
          submitAdd={submitAdd}
        />
      )}

      {/* Remove flag confirm modal */}
      {removeTarget && (
        <RemoveFlagModal
          removeTarget={removeTarget}
          setRemoveTarget={setRemoveTarget}
          removing={removing}
          confirmRemove={confirmRemove}
        />
      )}
    </div>
  );
};

export default OrgFeatureFlagsDetailPage;
