/**
 * CN Updation (ISOCL ERP Stage 5)
 *
 * Pending trips (advance paid, no CN) on the left; save form requires a bilty
 * upload before the CN can be written — that hard block is enforced server-side.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Upload, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ConsignmentService from './ConsignmentService';
import '../../styles/erp.css';

const todayInput = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  cnNumber: '',
  cnDate: todayInput(),
  loadingDate: todayInput(),
  loadedQty: '',
  loadedQtyUnit: 'KL',
  temperature: '',
  density: '',
  sealNumbers: '',
};

const ConsignmentsPage = () => {
  const location = useLocation();

  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [biltyFile, setBiltyFile] = useState(null);
  const [biltyDocumentId, setBiltyDocumentId] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ConsignmentService.getPending({ limit: 50 });
      setPending(res.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('CN Updation is not enabled for your organization');
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
      const res = await ConsignmentService.getConsignments({ limit: 50 });
      setSaved(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'pending') fetchPending();
    else fetchSaved();
  }, [tab, fetchPending, fetchSaved]);

  useEffect(() => {
    if (location.state?.action === 'openCnUpdate' && location.state?.trip) {
      setTab('pending');
      openSave(location.state.trip);
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openSave = (trip) => {
    setSelectedTrip(trip);
    setForm({
      ...EMPTY_FORM,
      cnDate: trip.tripDate ? String(trip.tripDate).slice(0, 10) : todayInput(),
      loadingDate: trip.tripDate ? String(trip.tripDate).slice(0, 10) : todayInput(),
      loadedQty: trip.plannedQty ?? '',
      loadedQtyUnit: 'KL',
    });
    setBiltyFile(null);
    setBiltyDocumentId('');
  };

  const closeSave = () => {
    setSelectedTrip(null);
    setForm(EMPTY_FORM);
    setBiltyFile(null);
    setBiltyDocumentId('');
  };

  const handleUpload = async () => {
    if (!selectedTrip || !biltyFile) {
      toast.error('Choose a bilty file first');
      return;
    }
    setUploading(true);
    try {
      const res = await ConsignmentService.uploadBilty({
        tripId: selectedTrip._id,
        file: biltyFile,
      });
      setBiltyDocumentId(res.data.documentId);
      toast.success('Bilty uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const seals = form.sealNumbers
        ? form.sealNumbers.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await ConsignmentService.saveCn({
        tripId: selectedTrip._id,
        cnNumber: form.cnNumber.trim().toUpperCase(),
        cnDate: form.cnDate,
        loadingDate: form.loadingDate,
        loadedQty: Number(form.loadedQty),
        loadedQtyUnit: form.loadedQtyUnit,
        ...(form.temperature !== '' ? { temperature: Number(form.temperature) } : {}),
        ...(form.density !== '' ? { density: Number(form.density) } : {}),
        sealNumbers: seals,
        ...(biltyDocumentId ? { biltyDocumentId } : {}),
      });
      toast.success('CN saved');
      closeSave();
      fetchPending();
      setTab('saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openBilty = async (cnId) => {
    try {
      const res = await ConsignmentService.getBiltyUrl(cnId);
      if (res.data?.url) window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="erp-page">
      <header className="erp-header">
        <div>
          <h1>CN Updation</h1>
          <p className="erp-subtitle">
            Loading details from the bilty — advance-paid trips waiting for a consignment note.
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
            className={`erp-tab ${tab === 'saved' ? 'active' : ''}`}
            onClick={() => setTab('saved')}
          >
            Saved CNs
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
                <th>Party</th>
                <th>Vehicle</th>
                <th>Material</th>
                <th>Planned qty</th>
                <th>Ageing</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-muted">
                    No trips waiting for CN updation
                  </td>
                </tr>
              ) : (
                pending.map((t) => (
                  <tr key={t._id}>
                    <td>{t.tripNumber}</td>
                    <td>{t.partyId?.name || '—'}</td>
                    <td>{t.vehicleNumber || '—'}</td>
                    <td>{t.material || '—'}</td>
                    <td>{t.plannedQty ?? '—'}</td>
                    <td>
                      <span className={`erp-badge ${t.ageingDays > 2 ? 'warning' : 'neutral'}`}>
                        {t.ageingDays}d
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn-primary" onClick={() => openSave(t)}>
                        Update CN
                      </button>
                    </td>
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
                <th>CN No</th>
                <th>Date</th>
                <th>Trip</th>
                <th>Party</th>
                <th>Loaded</th>
                <th>Variance</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {saved.length === 0 ? (
                <tr>
                  <td colSpan={8} className="erp-muted">
                    No consignments yet
                  </td>
                </tr>
              ) : (
                saved.map((cn) => (
                  <tr key={cn._id}>
                    <td>{cn.cnNumber}</td>
                    <td>{cn.cnDate ? String(cn.cnDate).slice(0, 10) : '—'}</td>
                    <td>{cn.tripId?.tripNumber || '—'}</td>
                    <td>{cn.partyId?.name || '—'}</td>
                    <td>
                      {cn.loadedQty} {cn.loadedQtyUnit}
                    </td>
                    <td>{cn.qtyVariance}</td>
                    <td>
                      <span className={`erp-badge ${cn.status === 'LOCKED' ? 'danger' : 'success'}`}>
                        {cn.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openBilty(cn._id)}
                      >
                        Bilty
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTrip && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) closeSave(); }}
        >
          <div
            className="erp-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="erp-modal-header">
              <h2>
                <FileText size={18} /> CN for {selectedTrip.tripNumber}
              </h2>
              <button type="button" className="erp-icon-btn" onClick={closeSave} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form className="erp-form" onSubmit={handleSave}>
              <div className="erp-form-grid">
                <label>
                  CN number
                  <input
                    required
                    value={form.cnNumber}
                    onChange={(e) => setForm({ ...form, cnNumber: e.target.value })}
                    placeholder="As printed on bilty"
                  />
                </label>
                <label>
                  CN date
                  <input
                    type="date"
                    required
                    value={form.cnDate}
                    onChange={(e) => setForm({ ...form, cnDate: e.target.value })}
                  />
                </label>
                <label>
                  Loading date
                  <input
                    type="date"
                    required
                    value={form.loadingDate}
                    onChange={(e) => setForm({ ...form, loadingDate: e.target.value })}
                  />
                </label>
                <label>
                  Loaded qty
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={form.loadedQty}
                    onChange={(e) => setForm({ ...form, loadedQty: e.target.value })}
                  />
                </label>
                <label>
                  Unit
                  <select
                    value={form.loadedQtyUnit}
                    onChange={(e) => setForm({ ...form, loadedQtyUnit: e.target.value })}
                  >
                    <option value="KL">KL</option>
                    <option value="MT">MT</option>
                  </select>
                </label>
                <label>
                  Seal numbers
                  <input
                    value={form.sealNumbers}
                    onChange={(e) => setForm({ ...form, sealNumbers: e.target.value })}
                    placeholder="Comma-separated"
                  />
                </label>
              </div>

              <div className="erp-callout">
                <Upload size={16} />
                <div>
                  <strong>Bilty Upload (Optional)</strong>
                  <p className="erp-muted">
                    Upload the LR / consignment note before saving. OCR is best-effort and will
                    not block the save.
                  </p>
                  <div className="erp-inline" style={{ marginTop: 8, gap: 8 }}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        setBiltyFile(e.target.files?.[0] || null);
                        setBiltyDocumentId('');
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={!biltyFile || uploading}
                      onClick={handleUpload}
                    >
                      {uploading ? 'Uploading…' : 'Upload bilty'}
                    </button>
                    {biltyDocumentId ? (
                      <span className="erp-badge success">
                        <CheckCircle2 size={12} /> Uploaded
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="erp-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeSave}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busy || !biltyDocumentId}
                >
                  {busy ? 'Saving…' : 'Save CN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsignmentsPage;
