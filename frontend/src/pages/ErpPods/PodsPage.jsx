/**
 * POD / Challan Collection (ISOCL ERP Stage 7)
 *
 * Trips closed but challan not yet in office. Recording frees the vehicle.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PackageCheck, X, AlertTriangle, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import PodService from './PodService';
import '../../styles/erp.css';

const todayInput = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  receivedDate: todayInput(),
  copyType: 'HARD',
  receivedVia: 'BY_HAND',
  courierName: '',
  courierDocket: '',
  remarks: '',
};

const PodsPage = () => {
  const location = useLocation();

  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [recorded, setRecorded] = useState([]);
  const [ageing, setAgeing] = useState([]);
  const [agingLimit, setAgingLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PodService.getPending({ limit: 50 });
      setPending(res.data || []);
      if (res.meta?.agingLimit != null) setAgingLimit(res.meta.agingLimit);
    } catch (err) {
      if (err.status === 404) {
        toast.error('POD collection is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecorded = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PodService.getPods({ limit: 50 });
      setRecorded(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setRecorded([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgeing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PodService.getAgeingReport();
      setAgeing(res.data || []);
      if (res.meta?.agingLimit != null) setAgingLimit(res.meta.agingLimit);
    } catch (err) {
      toast.error(err.message);
      setAgeing([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'pending') fetchPending();
    else if (tab === 'recorded') fetchRecorded();
    else fetchAgeing();
  }, [tab, fetchPending, fetchRecorded, fetchAgeing]);

  useEffect(() => {
    if (location.state?.action === 'openPod' && location.state?.trip) {
      setTab('pending');
      openRecord(location.state.trip);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openRecord = (row) => {
    setSelected({
      ...row,
      tripId: row.tripId || row._id,
    });
    setForm(EMPTY_FORM);
    setFile(null);
    setDocumentId('');
  };

  const closeModal = () => setSelected(null);

  const handleUpload = async () => {
    if (!selected || !file) {
      toast.error('Choose a challan scan first');
      return;
    }
    const targetTripId = selected.tripId || selected._id;
    setUploading(true);
    try {
      const res = await PodService.upload({ tripId: targetTripId, file });
      setDocumentId(res.data.documentId);
      toast.success('Scan uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRecord = async (e) => {
    e.preventDefault();
    setBusy(true);
    const targetTripId = selected.tripId || selected._id;
    try {
      await PodService.record({
        tripId: targetTripId,
        receivedDate: form.receivedDate,
        copyType: form.copyType,
        receivedVia: form.receivedVia,
        ...(form.receivedVia === 'COURIER'
          ? { courierName: form.courierName, courierDocket: form.courierDocket }
          : {}),
        remarks: form.remarks,
        documentIds: documentId ? [documentId] : [],
      });
      toast.success('POD recorded — vehicle freed');
      closeModal();
      fetchPending();
      setTab('recorded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="erp-page">
      <header className="erp-header">
        <div>
          <h1>POD / Challan</h1>
          <p className="erp-subtitle">
            Record office receipt of challans. Overdue threshold: {agingLimit} days from unload.
          </p>
        </div>
      </header>

      <div className="erp-toolbar">
        <div className="erp-tabs">
          <button
            type="button"
            className={`erp-tab ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            Pending
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === 'recorded' ? 'active' : ''}`}
            onClick={() => setTab('recorded')}
          >
            Received
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === 'ageing' ? 'active' : ''}`}
            onClick={() => setTab('ageing')}
          >
            Vendor ageing
          </button>
        </div>
      </div>

      {loading ? (
        <p className="erp-muted">Loading…</p>
      ) : tab === 'pending' ? (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Trip</th>
                <th>CN</th>
                <th>Party</th>
                <th>Vehicle</th>
                <th>Unloaded</th>
                <th>Ageing</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-muted">
                    No challans pending
                  </td>
                </tr>
              ) : (
                pending.map((row) => (
                  <tr key={row.tripId}>
                    <td>{row.tripNumber}</td>
                    <td>{row.cnNumber || '—'}</td>
                    <td>{row.partyName || '—'}</td>
                    <td>{row.vehicleNumber || '—'}</td>
                    <td>{row.unloadedAt ? String(row.unloadedAt).slice(0, 10) : '—'}</td>
                    <td>
                      <span className={`erp-badge ${row.isOverdue ? 'warning' : 'neutral'}`}>
                        {row.ageingDays}d{row.isOverdue ? ' overdue' : ''}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => openRecord(row)}
                      >
                        Record POD
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : tab === 'recorded' ? (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>CN</th>
                <th>Received</th>
                <th>Copy</th>
                <th>Via</th>
                <th>Party</th>
                <th>Trip</th>
              </tr>
            </thead>
            <tbody>
              {recorded.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-muted">
                    No PODs recorded yet
                  </td>
                </tr>
              ) : (
                recorded.map((p) => (
                  <tr key={p._id}>
                    <td>{p.cnNumber || '—'}</td>
                    <td>{p.receivedDate ? String(p.receivedDate).slice(0, 10) : '—'}</td>
                    <td>{p.copyType}</td>
                    <td>{p.receivedVia}</td>
                    <td>{p.partyId?.name || '—'}</td>
                    <td>{p.tripId?.tripNumber || '—'}</td>
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
                <th>Vendor</th>
                <th>Pending</th>
                <th>Oldest</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ageing.length === 0 ? (
                <tr>
                  <td colSpan={4} className="erp-muted">
                    No hire-vehicle PODs outstanding
                  </td>
                </tr>
              ) : (
                ageing.map((v) => (
                  <tr key={v.vendorId}>
                    <td>{v.vendorName}</td>
                    <td>{v.pendingCount}</td>
                    <td>{v.oldestDays}d</td>
                    <td>
                      <span className={`erp-badge ${v.isOverdue ? 'danger' : 'success'}`}>
                        {v.isOverdue ? 'Overdue' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="erp-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="erp-modal-header">
              <h2>
                <PackageCheck size={18} /> POD for {selected.tripNumber}
              </h2>
              <button type="button" className="erp-icon-btn" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form className="erp-form" onSubmit={handleRecord}>
              {selected.isOverdue && (
                <div className="erp-callout">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>Overdue challan</strong>
                    <p className="erp-muted">
                      Unloaded {selected.ageingDays} days ago (limit {agingLimit}).
                    </p>
                  </div>
                </div>
              )}

              <div className="erp-form-grid">
                <label>
                  Received date
                  <input
                    type="date"
                    required
                    value={form.receivedDate}
                    onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                  />
                </label>
                <label>
                  Copy type
                  <select
                    value={form.copyType}
                    onChange={(e) => setForm({ ...form, copyType: e.target.value })}
                  >
                    <option value="HARD">Hard</option>
                    <option value="SOFT">Soft</option>
                    <option value="BOTH">Both</option>
                  </select>
                </label>
                <label>
                  Received via
                  <select
                    value={form.receivedVia}
                    onChange={(e) => setForm({ ...form, receivedVia: e.target.value })}
                  >
                    <option value="BY_HAND">By hand</option>
                    <option value="COURIER">Courier</option>
                    <option value="EMAIL">Email</option>
                    <option value="DRIVER_APP">Driver app</option>
                  </select>
                </label>
                <label>
                  Remarks
                  <input
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  />
                </label>
              </div>

              {form.receivedVia === 'COURIER' && (
                <div className="erp-form-grid" style={{ marginTop: 12 }}>
                  <label>
                    Courier name
                    <input
                      required
                      value={form.courierName}
                      onChange={(e) => setForm({ ...form, courierName: e.target.value })}
                    />
                  </label>
                  <label>
                    Docket no.
                    <input
                      required
                      value={form.courierDocket}
                      onChange={(e) => setForm({ ...form, courierDocket: e.target.value })}
                    />
                  </label>
                </div>
              )}

              <div className="erp-callout" style={{ marginTop: 16 }}>
                <Upload size={16} />
                <div>
                  <strong>Challan scan (optional)</strong>
                  <div className="erp-inline" style={{ marginTop: 8, gap: 8 }}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        setFile(e.target.files?.[0] || null);
                        setDocumentId('');
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={!file || uploading}
                      onClick={handleUpload}
                    >
                      {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                    {documentId && <span className="erp-badge success">Attached</span>}
                  </div>
                </div>
              </div>

              <div className="erp-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Record POD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodsPage;
