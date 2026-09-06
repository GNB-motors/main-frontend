/**
 * Unloading Entry — shortage, detention, freight (ISOCL ERP Stage 8)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { toast } from 'react-toastify';
import UnloadingApi from './UnloadingService';
import PageShell from '../../components/Erp/PageShell';
import StatusBadge from '../../components/Erp/StatusBadge';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const UnloadingPage = ({ embedded = false, initialTab = null }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState(initialTab || 'pending');
  const [pending, setPending] = useState([]);
  const [saved, setSaved] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    unloadedQty: '',
    detentionDays: '0',
    sbRateOverride: '',
    sbRateRemark: '',
  });
  const [preview, setPreview] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await UnloadingApi.getPending({ limit: 50 });
      setPending(res.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('Unloading is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await UnloadingApi.list({ limit: 50 });
      setSaved(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await UnloadingApi.listPurchaseBills({ limit: 50 });
      setBills(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'pending') fetchPending();
    else if (tab === 'saved') fetchSaved();
    else fetchBills();
  }, [tab, fetchPending, fetchSaved, fetchBills]);

  useEffect(() => {
    if (location.state?.action === 'openUnloading' && location.state?.trip) {
      setTab('pending');
      const tripData = { ...location.state.trip, tripId: location.state.trip._id };
      openEntry(tripData);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openEntry = (row) => {
    setSelected(row);
    setForm({
      unloadedQty: row.loadedQty != null ? String(row.loadedQty) : '',
      detentionDays: '0',
      sbRateOverride: '',
      sbRateRemark: '',
    });
    setPreview(null);
  };

  const closeModal = () => {
    setSelected(null);
    setPreview(null);
  };

  const runPreview = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const payload = {
        tripId: selected.tripId,
        unloadedQty: Number(form.unloadedQty),
        detentionDays: Number(form.detentionDays) || 0,
      };
      if (form.sbRateOverride !== '') {
        payload.sbRateOverride = Number(form.sbRateOverride);
      }
      const res = await UnloadingApi.calculate(payload);
      setPreview(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const payload = {
        tripId: selected.tripId,
        unloadedQty: Number(form.unloadedQty),
        detentionDays: Number(form.detentionDays) || 0,
        sbRateRemark: form.sbRateRemark,
      };
      if (form.sbRateOverride !== '') {
        payload.sbRateOverride = Number(form.sbRateOverride);
      }
      await UnloadingApi.save(payload);
      toast.success('Unloading saved');
      closeModal();
      fetchPending();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      embedded={embedded}
      title={<><Scale size={22} /> Unloading Entry</>}
      subtitle="Shortage, detention and freight settlement after POD."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Payables', to: '/erp/payables' }, { label: 'Purchase Bills' }]}
    >

      <div className="erp-tabs">
        {[
          ['pending', 'Pending'],
          ['saved', 'Saved'],
          ['bills', 'Purchase Bills'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`erp-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="erp-muted">Loading…</p>
      ) : tab === 'pending' ? (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Trip</th>
                <th>Party</th>
                <th>Vehicle</th>
                <th>CN</th>
                <th>Loaded</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-muted">
                    No POD_RECEIVED trips awaiting unloading.
                  </td>
                </tr>
              ) : (
                pending.map((row) => (
                  <tr key={row.tripId}>
                    <td>{row.tripNumber}</td>
                    <td>{row.partyId?.name || '—'}</td>
                    <td>
                      {row.vehicleNumber}{' '}
                      <span className="erp-muted">({row.vehicleType})</span>
                    </td>
                    <td>{row.cnNumber || '—'}</td>
                    <td>
                      {row.loadedQty} {row.qtyUnit}
                    </td>
                    <td>
                      <button type="button" className="erp-btn erp-btn-primary" onClick={() => openEntry(row)}>
                        Enter
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : tab === 'saved' ? (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>CN</th>
                <th>Party</th>
                <th>Unload qty</th>
                <th>Shortage</th>
                <th>Detention</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {saved.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-muted">
                    No unloading entries yet.
                  </td>
                </tr>
              ) : (
                saved.map((row) => (
                  <tr key={row._id}>
                    <td>{row.cnNumber || '—'}</td>
                    <td>{row.partyId?.name || '—'}</td>
                    <td>
                      {row.unloadedQty} {row.qtyUnit}
                    </td>
                    <td>{money(row.shortageAmount)}</td>
                    <td>{money(row.detentionAmount)}</td>
                    <td>{money(row.netReceivable)}</td>
                    <td><StatusBadge status={row.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Vendor</th>
                <th>Hire</th>
                <th>Shortage</th>
                <th>TDS</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-muted">
                    No purchase bills yet.
                  </td>
                </tr>
              ) : (
                bills.map((row) => (
                  <tr key={row._id}>
                    <td>{row.billNumber}</td>
                    <td>{row.vendorId?.name || '—'}</td>
                    <td>{money(row.hireCharge)}</td>
                    <td>{money(row.shortageAmount)}</td>
                    <td>{money(row.tdsAmount)}</td>
                    <td>{money(row.netAmount)}</td>
                    <td><StatusBadge status={row.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal" style={{ maxWidth: 520 }}>
            <div className="erp-modal-header">
              <h2>Unload {selected.tripNumber}</h2>
              <button type="button" className="erp-icon-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="erp-form">
              <label>
                Unloaded qty ({selected.qtyUnit})
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  value={form.unloadedQty}
                  onChange={(e) => setForm((f) => ({ ...f, unloadedQty: e.target.value }))}
                />
              </label>
              <label>
                Detention days
                <input
                  type="number"
                  min="0"
                  value={form.detentionDays}
                  onChange={(e) => setForm((f) => ({ ...f, detentionDays: e.target.value }))}
                />
              </label>
              <label>
                Sale rate override (optional)
                <input
                  type="number"
                  min="0"
                  placeholder="Leave blank to use DO rate"
                  value={form.sbRateOverride}
                  onChange={(e) => setForm((f) => ({ ...f, sbRateOverride: e.target.value }))}
                />
              </label>
              {form.sbRateOverride !== '' && (
                <label>
                  Rate change remark
                  <input
                    type="text"
                    value={form.sbRateRemark}
                    onChange={(e) => setForm((f) => ({ ...f, sbRateRemark: e.target.value }))}
                  />
                </label>
              )}

              {preview && (
                <div className="erp-callout">
                  <div>Shortage: {preview.shortage?.shortageQty} → {money(preview.shortage?.amount)}</div>
                  <div>Detention: {preview.detention?.chargeableDays}d → {money(preview.detention?.amount)}</div>
                  <div>Freight: {money(preview.freightAmount)}</div>
                  <div>
                    <strong>Net receivable: {money(preview.netReceivable)}</strong>
                  </div>
                  {preview.warnings?.length > 0 && (
                    <ul>
                      {preview.warnings.map((w) => (
                        <li key={w.code}>{w.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="erp-modal-actions">
                <button type="button" className="erp-btn" onClick={runPreview} disabled={busy}>
                  Preview
                </button>
                <button type="submit" className="erp-btn erp-btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default UnloadingPage;
