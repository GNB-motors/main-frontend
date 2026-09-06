/**
 * Trip Close (ISOCL ERP Stage 6)
 *
 * Operational close after CN updation. Records unload date; does not free the
 * vehicle (POD still pending). Optional report-empty unlocks that advance leg.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Flag, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link, useLocation } from 'react-router-dom';
import TripCloseService from './TripCloseService';
import '../../styles/erp.css';

const todayInput = () => new Date().toISOString().slice(0, 10);

const TripClosePage = () => {
  const location = useLocation();

  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [closed, setClosed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    unloadedAt: todayInput(),
    unloadLocation: '',
    closeRemarks: '',
    reportEmptyEnabled: false,
    reportEmptyTo: '',
    reportEmptyKm: '',
  });

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TripCloseService.getPendingClose({ limit: 50 });
      setPending(res.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('Trip Close is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClosed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TripCloseService.getTrips({ state: 'TRIP_CLOSED', limit: 50 });
      setClosed(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setClosed([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'pending') fetchPending();
    else fetchClosed();
  }, [tab, fetchPending, fetchClosed]);

  useEffect(() => {
    if (location.state?.action === 'openTripClose' && location.state?.trip) {
      setTab('pending');
      openClose(location.state.trip);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openClose = (trip) => {
    setSelected(trip);
    setForm({
      unloadedAt: todayInput(),
      unloadLocation: trip.toLocation || '',
      closeRemarks: '',
      reportEmptyEnabled: false,
      reportEmptyTo: '',
      reportEmptyKm: '',
    });
  };

  const closeModal = () => setSelected(null);

  const handleClose = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        unloadedAt: form.unloadedAt,
        unloadLocation: form.unloadLocation,
        closeRemarks: form.closeRemarks,
      };
      if (form.reportEmptyEnabled) {
        payload.reportEmpty = {
          toLocation: form.reportEmptyTo.trim(),
          distanceKm: Number(form.reportEmptyKm),
        };
      }
      await TripCloseService.closeTrip(selected._id, payload);
      toast.success('Trip closed');
      closeModal();
      fetchPending();
      setTab('closed');
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
          <h1>Trip Close</h1>
          <p className="erp-subtitle">
            Record unloading date after CN updation. Vehicle stays busy until POD is received.
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
            Pending close
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === 'closed' ? 'active' : ''}`}
            onClick={() => setTab('closed')}
          >
            Closed
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
                <th>Ageing</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-muted">
                    No trips waiting to close
                  </td>
                </tr>
              ) : (
                pending.map((t) => (
                  <tr key={t._id}>
                    <td>{t.tripNumber}</td>
                    <td>{t.cnNumber || '—'}</td>
                    <td>{t.partyId?.name || '—'}</td>
                    <td>{t.vehicleNumber || '—'}</td>
                    <td>
                      <span className={`erp-badge ${t.ageingDays >= 60 ? 'warning' : 'neutral'}`}>
                        {t.ageingDays}d
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn-primary" onClick={() => openClose(t)}>
                        Close trip
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
                <th>Trip</th>
                <th>Unloaded</th>
                <th>Location</th>
                <th>Vehicle</th>
                <th>Report empty</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {closed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-muted">
                    No closed trips yet
                  </td>
                </tr>
              ) : (
                closed.map((t) => (
                  <tr key={t._id}>
                    <td>{t.tripNumber}</td>
                    <td>{t.unloadedAt ? String(t.unloadedAt).slice(0, 10) : '—'}</td>
                    <td>{t.unloadLocation || '—'}</td>
                    <td>{t.vehicleNumber || '—'}</td>
                    <td>
                      {t.reportEmpty?.enabled
                        ? `${t.reportEmpty.toLocation} (${t.reportEmpty.distanceKm} km)`
                        : '—'}
                    </td>
                    <td>
                      {t.reportEmpty?.enabled && (
                        <Link className="btn btn-secondary" to="/erp/advances">
                          Raise report-empty advance
                        </Link>
                      )}
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
                <Flag size={18} /> Close {selected.tripNumber}
              </h2>
              <button type="button" className="erp-icon-btn" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form className="erp-form" onSubmit={handleClose}>
              <div className="erp-callout">
                <AlertTriangle size={16} />
                <div>
                  <strong>Operational close only</strong>
                  <p className="erp-muted">
                    Shortage / detention / money is Stage 8. The tanker stays busy until POD
                    (Stage 7).
                  </p>
                </div>
              </div>

              <div className="erp-form-grid">
                <label>
                  Unloading date
                  <input
                    type="date"
                    required
                    value={form.unloadedAt}
                    onChange={(e) => setForm({ ...form, unloadedAt: e.target.value })}
                  />
                </label>
                <label>
                  Unload location
                  <input
                    value={form.unloadLocation}
                    onChange={(e) => setForm({ ...form, unloadLocation: e.target.value })}
                    placeholder="Optional"
                  />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Remarks
                  <input
                    value={form.closeRemarks}
                    onChange={(e) => setForm({ ...form, closeRemarks: e.target.value })}
                  />
                </label>
              </div>

              <label className="erp-inline" style={{ gap: 8, marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={form.reportEmptyEnabled}
                  onChange={(e) =>
                    setForm({ ...form, reportEmptyEnabled: e.target.checked })
                  }
                />
                Add report-empty point (optional)
              </label>

              {form.reportEmptyEnabled && (
                <div className="erp-form-grid" style={{ marginTop: 12 }}>
                  <label>
                    Report empty to
                    <input
                      required
                      value={form.reportEmptyTo}
                      onChange={(e) => setForm({ ...form, reportEmptyTo: e.target.value })}
                    />
                  </label>
                  <label>
                    Distance (km)
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={form.reportEmptyKm}
                      onChange={(e) => setForm({ ...form, reportEmptyKm: e.target.value })}
                    />
                  </label>
                </div>
              )}

              <div className="erp-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Closing…' : 'Close trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripClosePage;
