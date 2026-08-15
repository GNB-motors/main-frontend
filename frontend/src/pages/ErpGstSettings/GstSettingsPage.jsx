/**
 * GST Settings — set each location's GSTIN + e-Way Bill / e-Invoice credentials.
 * This is the per-tenant on-switch: once a location has a GSTIN + EWB login, the
 * inbound e-Way Bill pull (and the "Sync from GST" button) work for it.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Landmark, Save, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'react-toastify';
import GstSettingsService from './GstSettingsService';
import '../../styles/erp.css';

const EMPTY = {
  gstin: '', stateCode: '', transporterId: '', eInvoiceEnabled: false,
  ewbUsername: '', ewbPassword: '', eInvUsername: '', eInvPassword: '',
};

const GstSettingsPage = () => {
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [meta, setMeta] = useState({ hasEwbPassword: false, hasEInvPassword: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      setBranches(await GstSettingsService.listBranches());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  const openBranch = async (branch) => {
    setSelected(branch);
    try {
      const gst = await GstSettingsService.getGst(branch._id);
      setForm({
        gstin: gst.gstin || '', stateCode: gst.stateCode || '',
        transporterId: gst.transporterId || '', eInvoiceEnabled: !!gst.eInvoiceEnabled,
        ewbUsername: gst.ewbUsername || '', ewbPassword: '',
        eInvUsername: gst.eInvUsername || '', eInvPassword: '',
      });
      setMeta({ hasEwbPassword: !!gst.hasEwbPassword, hasEInvPassword: !!gst.hasEInvPassword });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const save = async () => {
    setSaving(true);
    try {
      // Only send passwords if the user typed one (blank = leave unchanged).
      const payload = { ...form };
      if (!payload.ewbPassword) delete payload.ewbPassword;
      if (!payload.eInvPassword) delete payload.eInvPassword;
      const gst = await GstSettingsService.updateGst(selected._id, payload);
      setMeta({ hasEwbPassword: !!gst.hasEwbPassword, hasEInvPassword: !!gst.hasEInvPassword });
      setForm((f) => ({ ...f, ewbPassword: '', eInvPassword: '' }));
      toast.success(`GST settings saved for ${selected.name}`);
      loadBranches();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const configured = (b) => b.gstin && b.gstCreds?.ewbUsername;

  return (
    <div className="erp-container">
      <div className="erp-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Landmark size={22} /> GST Settings
          </h1>
          <p className="erp-cell-muted" style={{ margin: '4px 0 0' }}>
            Set each location&apos;s GSTIN and e-Way Bill login to turn on the inbound e-Way Bill pull.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Location list */}
        <div className="erp-card" style={{ flex: '1 1 260px', minWidth: 240, padding: 0 }}>
          {loading ? (
            <div style={{ padding: 20 }} className="erp-cell-muted">Loading…</div>
          ) : branches.length === 0 ? (
            <div style={{ padding: 20 }} className="erp-cell-muted">No locations.</div>
          ) : (
            branches.map((b) => (
              <button
                key={b._id}
                onClick={() => openBranch(b)}
                className="erp-inline"
                style={{
                  width: '100%', justifyContent: 'space-between', gap: 8, padding: '12px 14px',
                  border: 'none', borderBottom: '1px solid var(--erp-border, #eee)',
                  background: selected?._id === b._id ? 'var(--erp-hover, #f3f4f6)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span className="erp-cell-strong">{b.name}</span>
                {configured(b)
                  ? <span className="erp-badge success"><CheckCircle2 size={12} /> configured</span>
                  : <span className="erp-badge"><Circle size={12} /> not set</span>}
              </button>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="erp-card" style={{ flex: '2 1 420px', minWidth: 320 }}>
          {!selected ? (
            <div style={{ padding: 24 }} className="erp-cell-muted">Select a location to configure its GST settings.</div>
          ) : (
            <div className="erp-form">
              <h3 style={{ marginTop: 0 }}>{selected.name}</h3>

              <div className="erp-form-grid">
                <label className="erp-field">
                  <span>GSTIN</span>
                  <input value={form.gstin} onChange={set('gstin')} placeholder="29AAACQ3770E000" maxLength={15} />
                </label>
                <label className="erp-field">
                  <span>State code</span>
                  <input value={form.stateCode} onChange={set('stateCode')} placeholder="auto from GSTIN" maxLength={2} />
                </label>
                <label className="erp-field">
                  <span>Transporter ID (optional)</span>
                  <input value={form.transporterId} onChange={set('transporterId')} placeholder="TRANSIN if not GST-registered" />
                </label>
              </div>

              <h4>e-Way Bill portal login</h4>
              <div className="erp-form-grid">
                <label className="erp-field">
                  <span>Username</span>
                  <input value={form.ewbUsername} onChange={set('ewbUsername')} placeholder="EWB API username" />
                </label>
                <label className="erp-field">
                  <span>Password {meta.hasEwbPassword && <em className="erp-cell-muted">(set — leave blank to keep)</em>}</span>
                  <input type="password" value={form.ewbPassword} onChange={set('ewbPassword')} placeholder={meta.hasEwbPassword ? '••••••••' : 'EWB API password'} />
                </label>
              </div>

              <h4>e-Invoice (only for ₹5 Cr+ turnover)</h4>
              <label className="erp-inline" style={{ gap: 8, margin: '4px 0 12px' }}>
                <input type="checkbox" checked={form.eInvoiceEnabled} onChange={set('eInvoiceEnabled')} />
                <span>Generate IRN on sale-bill approval for this location</span>
              </label>
              {form.eInvoiceEnabled && (
                <div className="erp-form-grid">
                  <label className="erp-field">
                    <span>e-Invoice username</span>
                    <input value={form.eInvUsername} onChange={set('eInvUsername')} placeholder="IRP API username" />
                  </label>
                  <label className="erp-field">
                    <span>Password {meta.hasEInvPassword && <em className="erp-cell-muted">(set)</em>}</span>
                    <input type="password" value={form.eInvPassword} onChange={set('eInvPassword')} placeholder={meta.hasEInvPassword ? '••••••••' : 'IRP API password'} />
                  </label>
                </div>
              )}

              <div className="erp-form-actions">
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GstSettingsPage;
