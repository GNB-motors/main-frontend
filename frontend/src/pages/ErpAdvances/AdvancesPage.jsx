/**
 * Trip Advances (ISOCL ERP Stage 4)
 *
 * The costing panel shows the whole derivation — litres, the per-state diesel
 * prices behind the average, servicing and whether it was waived — because the
 * argument with a driver is never about the total, it is about a line in it.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Wallet,
  X,
  Info,
  AlertTriangle,
  CheckCircle2,
  Fuel,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import AdvanceService from './AdvanceService';
import PlacementService from '../ErpPlacement/PlacementService';
import '../../styles/erp.css';

const STATUS_TONE = {
  PENDING_APPROVAL: 'warning',
  APPROVED: 'open',
  PAID: 'success',
  CANCELLED: 'danger',
};

const LEG_LABELS = {
  EMPTY: 'Empty run to loading point',
  LOAD: 'Loaded trip',
  REPORT_EMPTY: 'Report empty after unloading',
};

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const AdvancesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [advances, setAdvances] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Raise modal
  const [showRaise, setShowRaise] = useState(false);
  const [tripId, setTripId] = useState('');
  const [legTypes, setLegTypes] = useState(['LOAD']);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [costing, setCosting] = useState(null);
  const [costingError, setCostingError] = useState('');
  const [busy, setBusy] = useState(false);

  // Pay modal
  const [payTarget, setPayTarget] = useState(null);
  const [paymentMode, setPaymentMode] = useState('BANK');
  const [paymentRef, setPaymentRef] = useState('');

  const fetchAdvances = useCallback(async (status = '', page = 1) => {
    setLoading(true);
    try {
      const res = await AdvanceService.getAdvances({
        ...(status ? { status } : {}),
        page,
        limit: 20,
      });
      setAdvances(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      if (err.status === 404) {
        toast.error('Advances are not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setAdvances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlacements = useCallback(async () => {
    try {
      const res = await PlacementService.getPlacements({ status: 'PLACED', limit: 100 });
      setPlacements((res.data || []).filter((p) => p.tripId));
    } catch {
      setPlacements([]);
    }
  }, []);

  useEffect(() => {
    fetchAdvances(statusFilter);
    fetchPlacements();
  }, [fetchAdvances, fetchPlacements, statusFilter]);

  useEffect(() => {
    if (location.state?.action === 'openAdvance' && location.state?.trip) {
      setShowRaise(true);
      setTripId(location.state.trip._id);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Re-cost whenever the trip or the chosen legs change.
  useEffect(() => {
    if (!showRaise || !tripId || legTypes.length === 0) {
      setCosting(null);
      return;
    }
    let cancelled = false;
    setCostingError('');
    AdvanceService.preview({ tripId, legTypes })
      .then((res) => {
        if (!cancelled) setCosting(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setCosting(null);
          setCostingError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showRaise, tripId, legTypes]);

  const toggleLeg = (leg) =>
    setLegTypes((prev) => (prev.includes(leg) ? prev.filter((l) => l !== leg) : [...prev, leg]));

  const openRaise = () => {
    setTripId('');
    setLegTypes(['LOAD']);
    setRequestedAmount('');
    setCosting(null);
    setCostingError('');
    setShowRaise(true);
  };

  const budget = costing?.summary?.netPayable ?? 0;
  const asked = requestedAmount === '' ? budget : Number(requestedAmount);
  const overBudget = asked > budget;

  const handleRaise = async (e) => {
    e.preventDefault();
    if (!tripId || legTypes.length === 0) {
      toast.error('Pick a trip and at least one leg');
      return;
    }
    setBusy(true);
    try {
      // Anything the costing flagged must be acknowledged; the server re-checks.
      const acknowledgedWarnings = [];
      if (overBudget) acknowledgedWarnings.push('OVER_BUDGET');
      if (costing?.hire?.exceeds) acknowledgedWarnings.push('HIRE_CAP');

      const res = await AdvanceService.requestAdvance({
        tripId,
        legTypes,
        ...(requestedAmount !== '' ? { requestedAmount: Number(requestedAmount) } : {}),
        acknowledgedWarnings,
      });

      toast.success(
        res.data.status === 'PENDING_APPROVAL'
          ? `${res.data.advanceNumber} raised — waiting for approval`
          : `${res.data.advanceNumber} approved`,
      );
      setShowRaise(false);
      fetchAdvances(statusFilter);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await AdvanceService.pay(payTarget._id, { paymentMode, paymentRef });
      toast.success('Advance paid');
      setPayTarget(null);
      setPaymentRef('');
      fetchAdvances(statusFilter, meta.page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Trip Advances</h1>
          <p className="erp-subtitle">
            Diesel costed at the average pump price across the route&apos;s states
          </p>
        </div>
        <div className="erp-header-actions">
          <button className="btn btn-primary" onClick={openRaise}>
            <Wallet size={18} />
            Raise Advance
          </button>
        </div>
      </div>

      <div className="erp-toolbar">
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PENDING_APPROVAL">Awaiting approval</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading advances...</p>
          </div>
        ) : advances.length === 0 ? (
          <div className="erp-state">
            <Wallet size={48} />
            <p>No advances yet</p>
            <button className="btn btn-primary" onClick={openRaise}>
              <Wallet size={18} />
              Raise the first one
            </button>
          </div>
        ) : (
          <>
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Advance</th>
                    <th>Trip</th>
                    <th>Legs</th>
                    <th>Budget</th>
                    <th>Deductions</th>
                    <th>Net Payable</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {advances.map((a) => (
                    <tr key={a._id}>
                      <td className="erp-cell-strong">{a.advanceNumber}</td>
                      <td>
                        <div>{a.tripId?.tripNumber || '—'}</div>
                        <div className="erp-cell-muted">
                          {a.tripId?.fromLocation} → {a.tripId?.toLocation}
                        </div>
                      </td>
                      <td className="erp-cell-muted">{(a.legTypes || []).join(', ')}</td>
                      <td className="erp-numeric">{money(a.grossBudget)}</td>
                      <td className="erp-numeric">
                        {a.totalDeductions > 0 ? `− ${money(a.totalDeductions)}` : '—'}
                      </td>
                      <td className="erp-numeric erp-cell-strong">{money(a.netPayable)}</td>
                      <td>
                        <span className={`erp-badge ${STATUS_TONE[a.status] || 'neutral'}`}>
                          {a.status === 'PENDING_APPROVAL' ? 'AWAITING APPROVAL' : a.status}
                        </span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          {a.status === 'APPROVED' && (
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                setPayTarget(a);
                                setPaymentMode('BANK');
                                setPaymentRef('');
                              }}
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="erp-pagination">
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === 1}
                  onClick={() => fetchAdvances(statusFilter, meta.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {meta.page} of {meta.totalPages} · {meta.total} advances
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => fetchAdvances(statusFilter, meta.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Raise ────────────────────────────────────────────────────────── */}
      {showRaise && (
        <div className="erp-modal-backdrop" onClick={() => setShowRaise(false)}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2>Raise Advance</h2>
              <button className="btn-icon" onClick={() => setShowRaise(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRaise}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div className="erp-field full">
                    <label htmlFor="adv-trip">
                      Trip <span className="required">*</span>
                    </label>
                    <select
                      id="adv-trip"
                      value={tripId}
                      onChange={(e) => setTripId(e.target.value)}
                      required
                    >
                      <option value="">Select a placed trip…</option>
                      {placements.map((p) => (
                        <option key={p._id} value={p.tripId}>
                          {p.placementNumber} · {p.doId?.doNumber} ·{' '}
                          {p.vehicleId?.registrationNumber || p.hireVehicleNumber}
                        </option>
                      ))}
                    </select>
                    {placements.length === 0 && (
                      <span className="erp-field-hint">
                        No placed trips — place a vehicle first.
                      </span>
                    )}
                  </div>

                  <div className="erp-field full">
                    <label>
                      Legs <span className="required">*</span>
                    </label>
                    <div className="erp-weekdays">
                      {['EMPTY', 'LOAD', 'REPORT_EMPTY'].map((leg) => (
                        <button
                          type="button"
                          key={leg}
                          className={`erp-weekday ${legTypes.includes(leg) ? 'selected' : ''}`}
                          onClick={() => toggleLeg(leg)}
                        >
                          {LEG_LABELS[leg]}
                        </button>
                      ))}
                    </div>
                    <span className="erp-field-hint">
                      A load leg needs the loading quantity in; a report-empty leg needs the trip
                      unloaded.
                    </span>
                  </div>
                </div>

                {costingError && (
                  <div
                    className="erp-callout"
                    style={{ background: '#fee2e2', color: '#b91c1c', marginTop: 16 }}
                  >
                    <AlertTriangle size={16} />
                    <span>{costingError}</span>
                  </div>
                )}

                {costing?.warnings?.map((w) => (
                  <div className="erp-callout info" key={w} style={{ marginTop: 12 }}>
                    <Info size={16} />
                    <span>{w}</span>
                  </div>
                ))}

                {/* ── Costing breakdown ── */}
                {costing && (
                  <div className="erp-container" style={{ marginTop: 16 }}>
                    <div className="erp-table-scroll">
                      <table className="erp-table" style={{ minWidth: 0 }}>
                        <tbody>
                          {costing.legs.map((leg) => (
                            <React.Fragment key={leg.legType}>
                              <tr>
                                <td colSpan={2} className="erp-cell-strong">
                                  {LEG_LABELS[leg.legType] || leg.legType}
                                </td>
                              </tr>
                              {!leg.isFlat && (
                                <>
                                  <tr>
                                    <td className="erp-cell-muted">
                                      Diesel — {leg.litresRequired} L at{' '}
                                      {money(Math.round(leg.dieselRatePerL))}/L
                                      <div
                                        className="erp-cell-muted"
                                        style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
                                      >
                                        <Fuel size={12} />
                                        {leg.dieselRateStates
                                          ?.map((s) => `${s.state} ₹${s.rate}`)
                                          .join(' · ')}
                                      </div>
                                    </td>
                                    <td className="erp-numeric">{money(leg.dieselAmount)}</td>
                                  </tr>
                                  <tr>
                                    <td className="erp-cell-muted">
                                      Servicing
                                      {leg.servicingWaived && ' — waived, same material'}
                                    </td>
                                    <td className="erp-numeric">{money(leg.servicingAmount)}</td>
                                  </tr>
                                  <tr>
                                    <td className="erp-cell-muted">Borders</td>
                                    <td className="erp-numeric">{money(leg.bordersAmount)}</td>
                                  </tr>
                                  <tr>
                                    <td className="erp-cell-muted">Miscellaneous</td>
                                    <td className="erp-numeric">{money(leg.miscAmount)}</td>
                                  </tr>
                                </>
                              )}
                              <tr>
                                <td className="erp-cell-strong">Leg total</td>
                                <td className="erp-numeric erp-cell-strong">
                                  {money(leg.grossBudget)}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}

                          {costing.summary.carriedForwardAmount > 0 && (
                            <tr>
                              <td className="erp-cell-muted">
                                Carried-forward empty running
                                <div className="erp-cell-muted">
                                  From earlier deleted placements on this tanker
                                </div>
                              </td>
                              <td className="erp-numeric">
                                + {money(costing.summary.carriedForwardAmount)}
                              </td>
                            </tr>
                          )}

                          {costing.deductions.map((d, i) => (
                            <tr key={`${d.type}-${i}`}>
                              <td className="erp-cell-muted">
                                {d.type.replace(/_/g, ' ').toLowerCase()}
                              </td>
                              <td className="erp-numeric">− {money(d.amount)}</td>
                            </tr>
                          ))}

                          <tr>
                            <td className="erp-cell-strong">Net payable</td>
                            <td className="erp-numeric erp-cell-strong">
                              {money(costing.summary.netPayable)}
                            </td>
                          </tr>
                          {costing.summary.unrecoveredDeduction > 0 && (
                            <tr>
                              <td className="erp-cell-muted">
                                Left to recover on the next advance
                              </td>
                              <td className="erp-numeric">
                                {money(costing.summary.unrecoveredDeduction)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {costing && (
                  <div className="erp-field full" style={{ marginTop: 16 }}>
                    <label htmlFor="adv-amount">Amount to pay out (₹)</label>
                    <input
                      id="adv-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(e.target.value)}
                      placeholder={String(budget)}
                    />
                    <span className="erp-field-hint">
                      Blank pays the calculated {money(budget)}.
                    </span>
                  </div>
                )}

                {overBudget && (
                  <div
                    className="erp-callout"
                    style={{ background: '#fef3c7', color: '#b45309', marginTop: 12 }}
                  >
                    <AlertTriangle size={16} />
                    <span>
                      {money(asked - budget)} over budget — this will need approval before it can
                      be paid.
                    </span>
                  </div>
                )}

                {costing?.hire?.exceeds && (
                  <div
                    className="erp-callout"
                    style={{ background: '#fef3c7', color: '#b45309', marginTop: 12 }}
                  >
                    <AlertTriangle size={16} />
                    <span>
                      Advance is {costing.hire.percent}% of the hire charge, over the{' '}
                      {costing.hire.capPercent}% cap — needs approval.
                    </span>
                  </div>
                )}

                {costing && !overBudget && !costing.hire?.exceeds && (
                  <div className="erp-callout success" style={{ marginTop: 12 }}>
                    <CheckCircle2 size={16} />
                    <span>Within budget — this will be approved straight away.</span>
                  </div>
                )}
              </div>

              <div className="erp-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRaise(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy || !costing}>
                  {busy ? 'Raising...' : 'Raise Advance'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Pay ──────────────────────────────────────────────────────────── */}
      {payTarget && (
        <div className="erp-modal-backdrop" onClick={() => setPayTarget(null)}>
          <div
            className="erp-modal"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="erp-modal-header">
              <h2>Pay {payTarget.advanceNumber}</h2>
              <button className="btn-icon" onClick={() => setPayTarget(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePay}>
              <div className="erp-modal-body">
                <div className="erp-callout info">
                  <Info size={16} />
                  <span>
                    Paying out <strong>{money(payTarget.netPayable)}</strong>. Any recovery this
                    advance deducted is settled at the same time.
                  </span>
                </div>

                <div className="erp-form-grid">
                  <div className="erp-field">
                    <label htmlFor="pay-mode">
                      Mode <span className="required">*</span>
                    </label>
                    <select
                      id="pay-mode"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="BANK">Bank transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="FUEL_CARD">Fuel card</option>
                    </select>
                  </div>
                  <div className="erp-field">
                    <label htmlFor="pay-ref">Reference</label>
                    <input
                      id="pay-ref"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="NEFT-001"
                    />
                  </div>
                </div>
              </div>

              <div className="erp-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPayTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Paying...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancesPage;
