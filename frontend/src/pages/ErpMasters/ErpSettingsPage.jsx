/**
 * ERP Settings (ISOCL ERP)
 *
 * Every number here is one the client has not confirmed yet. They are settings
 * rather than constants so that the real values land as an edit, not a deploy.
 * The hints say what each default was guessed from.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Save, SlidersHorizontal, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpMasterService from './ErpMasterService';
import '../../styles/erp.css';

const NUMERIC_FIELDS = [
  {
    key: 'driverShortageLimit',
    label: 'Driver shortage limit (₹)',
    hint: 'At or above this, placing needs approval. Assumed ₹20,000 — not confirmed.',
    min: 0,
  },
  {
    key: 'pendingPodLimit',
    label: 'Pending POD limit',
    hint: 'At or above this many outstanding PODs, placing needs approval. Assumed 3.',
    min: 0,
  },
  {
    key: 'vendorPodAgingDays',
    label: 'Vendor POD ageing (days)',
    hint: 'A vendor POD outstanding this long needs approval. Assumed 20 days.',
    min: 0,
  },
  {
    key: 'sbPbGapPercent',
    label: 'Sale/purchase margin threshold (%)',
    hint: 'The client wrote "gap over 5%" without saying which way — see the direction below.',
    min: 0,
    max: 100,
  },
  {
    key: 'doExpiryDays',
    label: 'DO expiry (days)',
    hint: 'Added to the DO date when no expiry is given. Assumed 3 days.',
    min: 0,
  },
  {
    key: 'hireAdvanceCapPercent',
    label: 'Hire advance cap (%)',
    hint: 'Used from Stage 4. The client stated 65% of the hire charge.',
    min: 0,
    max: 100,
  },
  {
    key: 'forecastKmPerDay',
    label: 'Forecast running (km/day)',
    hint: 'Used to estimate when a tanker frees up on the board. Assumed 400 km/day.',
    min: 1,
  },
];

const ErpSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ErpMasterService.getSettings();
      setSettings(res.data);
      setForm(res.data);
    } catch (err) {
      if (err.status === 404) {
        toast.error('ERP Masters is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      NUMERIC_FIELDS.forEach(({ key }) => {
        if (form[key] !== '' && form[key] != null) payload[key] = Number(form[key]);
      });
      payload.sbPbGapDirection = form.sbPbGapDirection;

      const res = await ErpMasterService.updateSettings(payload);
      setSettings(res.data);
      setForm(res.data);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="erp-page">
        <div className="erp-container">
          <div className="erp-state">
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>ERP Settings</h1>
          <p className="erp-subtitle">Thresholds that drive approvals and forecasts</p>
        </div>
      </div>

      <div className="erp-callout info" style={{ marginTop: 20 }}>
        <Info size={16} />
        <span>
          These are working assumptions, not confirmed numbers. Changing one takes effect
          immediately — no deploy needed.
        </span>
      </div>

      <div className="erp-container" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="erp-form-grid">
            {NUMERIC_FIELDS.map((f) => (
              <div className="erp-field" key={f.key}>
                <label htmlFor={`set-${f.key}`}>{f.label}</label>
                <input
                  id={`set-${f.key}`}
                  type="number"
                  min={f.min}
                  max={f.max}
                  step="0.01"
                  value={form[f.key] ?? ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
                <span className="erp-field-hint">{f.hint}</span>
              </div>
            ))}

            <div className="erp-field full">
              <label htmlFor="set-direction">Margin rule direction</label>
              <select
                id="set-direction"
                value={form.sbPbGapDirection || 'MARGIN_ABOVE'}
                onChange={(e) => setField('sbPbGapDirection', e.target.value)}
              >
                <option value="MARGIN_ABOVE">
                  Approve when margin is ABOVE the threshold (literal reading of the spec)
                </option>
                <option value="MARGIN_BELOW">
                  Approve when margin is BELOW the threshold (thin or negative margin)
                </option>
              </select>
              <span className="erp-field-hint">
                <SlidersHorizontal size={12} style={{ verticalAlign: 'middle' }} /> Ask the
                client which they meant — this is question A3 on the register.
              </span>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ErpSettingsPage;
