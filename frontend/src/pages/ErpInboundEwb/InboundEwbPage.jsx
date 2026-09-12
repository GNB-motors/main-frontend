/**
 * Inbound e-Way Bill review queue (ISOCL ERP Stage 5)
 *
 * The consignment note is born here. A waybill raised by the consignor on the
 * GST portal is pulled in, scored against open trips by the matcher, and shown
 * as a SUGGESTED match. Confirming it creates the CN pre-filled from the
 * government document and stamps its provenance onto the consignment - which is
 * why the CN cannot simply be typed in.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileCheck2, X, Info, AlertTriangle, RefreshCw, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import InboundEwbService from './InboundEwbService';
import TripDashboardService from '../ErpTrips/TripDashboardService';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const STATUS_TONE = {
  SUGGESTED: 'info',
  UNMATCHED: 'warning',
  LINKED: 'success',
  IGNORED: 'neutral',
};

/** EWB quantity units are messy (KLR/MTS/...); collapse to the CN enum. */
const toCnUnit = (qtyUnit, fallback = 'KL') => {
  const u = String(qtyUnit || '').toUpperCase();
  if (u.startsWith('K')) return 'KL';
  if (u.startsWith('M') || u.startsWith('T')) return 'MT';
  return fallback;
};

const asDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const InboundEwbPage = () => {
  const [rows, setRows] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [active, setActive] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const tripsById = useMemo(() => {
    const map = {};
    for (const t of trips) map[t._id] = t;
    return map;
  }, [trips]);

  const fetchQueue = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await InboundEwbService.getQueue({ ...(status ? { status } : {}) });
      setRows(res.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('ERP is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await TripDashboardService.listTrips({ limit: 200 });
      setTrips(res.data || []);
    } catch {
      setTrips([]);
    }
  }, []);

  useEffect(() => {
    fetchQueue(statusFilter);
    fetchTrips();
  }, [fetchQueue, fetchTrips, statusFilter]);

  const openReview = (ewb) => {
    setActive(ewb);
    setForm({
      cnNumber: ewb.sourceInvoiceNumber || ewb.ewbNumber || '',
      cnDate: asDateInput(ewb.ewbDate) || asDateInput(new Date()),
      loadingDate: asDateInput(ewb.ewbDate) || asDateInput(new Date()),
      loadedQty: ewb.qty ?? '',
      loadedQtyUnit: toCnUnit(ewb.qtyUnit),
      tripId: ewb.matchedTripId || '',
    });
  };

  const closeReview = () => {
    setActive(null);
    setForm({});
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await InboundEwbService.sync();
      const d = res.data || {};
      toast.success(`Pulled ${d.pulled ?? 0} · ${d.new ?? 0} new · ${d.suggested ?? 0} suggested`);
      fetchQueue(statusFilter);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleIgnore = async (ewb) => {
    try {
      await InboundEwbService.ignore(ewb._id);
      toast.success(`${ewb.ewbNumber} ignored`);
      fetchQueue(statusFilter);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!active) return;
    if (!form.tripId) {
      toast.error('Pick the trip this waybill belongs to');
      return;
    }
    setSubmitting(true);
    try {
      const res = await InboundEwbService.confirm(active._id, {
        tripId: form.tripId,
        ...(form.cnNumber ? { cnNumber: form.cnNumber } : {}),
        ...(form.cnDate ? { cnDate: form.cnDate } : {}),
        ...(form.loadingDate ? { loadingDate: form.loadingDate } : {}),
        ...(form.loadedQty !== '' && form.loadedQty != null
          ? { loadedQty: Number(form.loadedQty) }
          : {}),
        ...(form.loadedQtyUnit ? { loadedQtyUnit: form.loadedQtyUnit } : {}),
      });
      const cn = res.data?.consignment;
      toast.success(`Consignment ${cn?.cnNumber || ''} created — trip dispatched`);
      closeReview();
      fetchQueue(statusFilter);
      fetchTrips();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = rows.filter((r) => r.matchStatus !== 'LINKED').length;
  const placedTrips = trips.filter((t) => t.state === 'PLACED');

  return (
    <PageShell
      title="Inbound e-Way Bills"
      subtitle={
        pendingCount > 0
          ? `${pendingCount} waybill${pendingCount === 1 ? '' : 's'} waiting to be matched to a trip`
          : 'Nothing waiting to be matched'
      }
      actions={
        <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
          <RefreshCw size={16} />
          {syncing ? 'Syncing…' : 'Sync from GST'}
        </button>
      }
    >
      <div className="erp-toolbar">
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Awaiting review</option>
          <option value="SUGGESTED">Suggested</option>
          <option value="UNMATCHED">Unmatched</option>
          <option value="LINKED">Linked</option>
          <option value="IGNORED">Ignored</option>
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading e-Way Bills...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="erp-state">
            <FileCheck2 size={48} />
            <p>
              {statusFilter === '' || statusFilter === 'SUGGESTED'
                ? 'No e-Way Bills waiting for review'
                : 'No e-Way Bills match this filter'}
            </p>
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>e-Way Bill</th>
                  <th>Vehicle</th>
                  <th>Consignor</th>
                  <th>Material</th>
                  <th>Suggested trip</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const trip = tripsById[r.matchedTripId];
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="erp-cell-strong">{r.ewbNumber}</div>
                        <div className="erp-cell-muted">
                          {formatDate(r.ewbDate)}
                          {r.validUpto ? ` · valid to ${formatDate(r.validUpto)}` : ''}
                        </div>
                      </td>
                      <td>
                        <div className="erp-cell-strong">{r.vehicleNumber || '—'}</div>
                        {r.docType && <div className="erp-cell-muted">{r.docType}</div>}
                      </td>
                      <td>
                        <div className="erp-cell-muted">{r.generatorGstin || '—'}</div>
                        {r.sourceInvoiceNumber && (
                          <div className="erp-cell-muted">{r.sourceInvoiceNumber}</div>
                        )}
                      </td>
                      <td>
                        <div className="erp-cell-strong">{r.material || '—'}</div>
                        <div className="erp-cell-muted erp-numeric">
                          {r.qty || 0} {r.qtyUnit || ''}
                        </div>
                      </td>
                      <td>
                        {trip ? (
                          <>
                            <div className="erp-cell-strong">{trip.tripNumber}</div>
                            <div className="erp-cell-muted">{trip.state}</div>
                          </>
                        ) : (
                          <span className="erp-cell-muted">
                            {r.matchedTripId ? 'Trip not in view' : 'No match'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`erp-badge ${STATUS_TONE[r.matchStatus] || 'neutral'}`}>
                          {r.matchStatus}
                        </span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          {r.matchStatus === 'LINKED' ? (
                            <span className="erp-cell-muted">Linked</span>
                          ) : (
                            <>
                              <button className="btn btn-primary" onClick={() => openReview(r)}>
                                Review
                              </button>
                              <button className="btn btn-secondary" onClick={() => handleIgnore(r)}>
                                Ignore
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {active && (
        <div className="erp-modal-backdrop" onClick={closeReview}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2>Confirm {active.ewbNumber}</h2>
              <button className="btn-icon" onClick={closeReview}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirm}>
              <div className="erp-modal-body">
                <div className="erp-callout info">
                  <Info size={16} />
                  <span>
                    Confirming creates the consignment note on this trip, pre-filled from the
                    waybill, and records the e-Way Bill against it permanently. A trip can carry
                    only one CN.
                  </span>
                </div>

                <div className="erp-field full" style={{ marginBottom: 16 }}>
                  <label>From the e-Way Bill</label>
                  <table className="erp-table" style={{ minWidth: 0 }}>
                    <tbody>
                      <tr>
                        <td className="erp-cell-muted">Vehicle</td>
                        <td className="erp-cell-strong">{active.vehicleNumber || '—'}</td>
                      </tr>
                      <tr>
                        <td className="erp-cell-muted">Consignor GSTIN</td>
                        <td className="erp-cell-strong">{active.generatorGstin || '—'}</td>
                      </tr>
                      <tr>
                        <td className="erp-cell-muted">Material</td>
                        <td className="erp-cell-strong">{active.material || '—'}</td>
                      </tr>
                      <tr>
                        <td className="erp-cell-muted">Quantity</td>
                        <td className="erp-cell-strong erp-numeric">
                          {active.qty || 0} {active.qtyUnit || ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="erp-cell-muted">Invoice</td>
                        <td className="erp-cell-strong">
                          {active.sourceInvoiceNumber || '—'}
                          {active.sourceInvoiceValue
                            ? ` · ₹${active.sourceInvoiceValue.toLocaleString('en-IN')}`
                            : ''}
                        </td>
                      </tr>
                      {active.matchReason && (
                        <tr>
                          <td className="erp-cell-muted">Match reason</td>
                          <td className="erp-cell-muted">{active.matchReason}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="erp-field full">
                  <label htmlFor="ewb-trip">
                    Trip <span className="required">*</span>
                  </label>
                  <select
                    id="ewb-trip"
                    value={form.tripId || ''}
                    onChange={(e) => setField('tripId', e.target.value)}
                    required
                  >
                    <option value="">Select a trip</option>
                    {placedTrips.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.tripNumber} — {t.vehicleNumber || t.material} ({t.state})
                      </option>
                    ))}
                  </select>
                  <span className="erp-field-hint">
                    <Truck size={12} /> Only placed trips can take a CN.
                  </span>
                </div>

                <div className="erp-field">
                  <label htmlFor="ewb-cnno">CN number</label>
                  <input
                    id="ewb-cnno"
                    value={form.cnNumber || ''}
                    onChange={(e) => setField('cnNumber', e.target.value)}
                    placeholder="Defaults to the invoice / EWB number"
                  />
                </div>

                <div className="erp-field">
                  <label htmlFor="ewb-cndate">CN date</label>
                  <input
                    id="ewb-cndate"
                    type="date"
                    value={form.cnDate || ''}
                    onChange={(e) => setField('cnDate', e.target.value)}
                  />
                  <span className="erp-field-hint">Must be within ±2 days of the trip date.</span>
                </div>

                <div className="erp-field">
                  <label htmlFor="ewb-loaddate">Loading date</label>
                  <input
                    id="ewb-loaddate"
                    type="date"
                    value={form.loadingDate || ''}
                    onChange={(e) => setField('loadingDate', e.target.value)}
                  />
                </div>

                <div className="erp-field">
                  <label htmlFor="ewb-qty">Loaded qty</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      id="ewb-qty"
                      type="number"
                      min="0"
                      step="any"
                      value={form.loadedQty ?? ''}
                      onChange={(e) => setField('loadedQty', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <select
                      aria-label="Loaded quantity unit"
                      value={form.loadedQtyUnit || 'KL'}
                      onChange={(e) => setField('loadedQtyUnit', e.target.value)}
                      style={{ width: 90 }}
                    >
                      <option value="KL">KL</option>
                      <option value="MT">MT</option>
                    </select>
                  </div>
                </div>

                {active.matchStatus === 'UNMATCHED' && (
                  <div className="erp-callout warning" style={{ marginTop: 16 }}>
                    <AlertTriangle size={16} />
                    <span>
                      The matcher could not tie this waybill to a trip. Check the vehicle number and
                      pick the trip yourself before confirming.
                    </span>
                  </div>
                )}
              </div>

              <div className="erp-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeReview}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Confirming…' : 'Confirm & create CN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default InboundEwbPage;
