import React, { useState, useEffect } from 'react';
import { Info, AlertTriangle, Fuel, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../ErpDrawer';
import AdvanceService from '../../../pages/ErpAdvances/AdvanceService';
import PlacementService from '../../../pages/ErpPlacement/PlacementService';

const LEG_LABELS = {
  EMPTY: 'Empty run to loading point',
  LOAD: 'Loaded trip',
  REPORT_EMPTY: 'Report empty after unloading',
};

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const AdvanceDrawer = ({ 
  isOpen, 
  onClose, 
  mode = 'RAISE', // 'RAISE' or 'PAY'
  initialTripId = '', 
  payTarget = null, 
  onSuccess 
}) => {
  // Raise State
  const [tripId, setTripId] = useState(initialTripId);
  const [placements, setPlacements] = useState([]);
  const [legTypes, setLegTypes] = useState(['LOAD']);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [costing, setCosting] = useState(null);
  const [costingError, setCostingError] = useState('');
  const [busy, setBusy] = useState(false);

  // Pay State
  const [paymentMode, setPaymentMode] = useState('BANK');
  const [paymentRef, setPaymentRef] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'RAISE') {
        setTripId(initialTripId);
        setLegTypes(['LOAD']);
        setRequestedAmount('');
        if (!initialTripId) {
          fetchPlacements();
        }
      } else if (mode === 'PAY') {
        setPaymentMode('BANK');
        setPaymentRef('');
      }
    }
  }, [isOpen, mode, initialTripId]);

  const fetchPlacements = async () => {
    try {
      const res = await PlacementService.getPlacements({ status: 'PLACED', limit: 100 });
      setPlacements((res.data || []).filter((p) => p.tripId));
    } catch {
      setPlacements([]);
    }
  };

  useEffect(() => {
    if (!isOpen || mode !== 'RAISE' || !tripId || legTypes.length === 0) {
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
  }, [isOpen, mode, tripId, legTypes]);

  const toggleLeg = (leg) =>
    setLegTypes((prev) => (prev.includes(leg) ? prev.filter((l) => l !== leg) : [...prev, leg]));

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
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payTarget) return;
    setBusy(true);
    try {
      await AdvanceService.pay(payTarget._id, { paymentMode, paymentRef });
      toast.success('Advance paid');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'RAISE' ? 'Raise Advance' : `Pay ${payTarget?.advanceNumber || 'Advance'}`;
  const subtitle = mode === 'RAISE' ? 'Calculate fuel, toll, border, and driver advances' : 'Record payment release details';

  const footer = mode === 'RAISE' ? (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" form="advance-form" className="btn btn-primary" disabled={busy || !costing}>
        {busy ? 'Raising...' : 'Raise Advance'} <ArrowRight size={16} />
      </button>
    </>
  ) : (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" form="pay-advance-form" className="btn btn-primary" disabled={busy}>
        {busy ? 'Paying...' : 'Record Payment'}
      </button>
    </>
  );

  return (
    <ErpDrawer isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} footer={footer}>
      {mode === 'RAISE' ? (
        <form id="advance-form" onSubmit={handleRaise}>
          <div className="erp-form-grid">
            <div className="erp-field full">
              <label htmlFor="adv-trip">Trip <span className="required">*</span></label>
              {initialTripId ? (
                <input type="text" disabled value={`Trip Pre-selected`} className="erp-input disabled" style={{ backgroundColor: '#f1f5f9', opacity: 1 }} />
              ) : (
                <select id="adv-trip" value={tripId} onChange={(e) => setTripId(e.target.value)} required>
                  <option value="">Select a placed trip…</option>
                  {placements.map((p) => (
                    <option key={p._id} value={p.tripId}>
                      {p.placementNumber} · {p.doId?.doNumber} · {p.vehicleId?.registrationNumber || p.hireVehicleNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="erp-field full">
              <label>Legs <span className="required">*</span></label>
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
            </div>
          </div>

          {costingError && (
            <div className="erp-callout" style={{ background: '#fee2e2', color: '#b91c1c', marginTop: 16 }}>
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

          {costing && (
            <div className="erp-container" style={{ marginTop: 16 }}>
              <div className="erp-table-scroll">
                <table className="erp-table" style={{ minWidth: 0 }}>
                  <tbody>
                    {costing.legs.map((leg) => (
                      <React.Fragment key={leg.legType}>
                        <tr>
                          <td colSpan={2} className="erp-cell-strong">{LEG_LABELS[leg.legType] || leg.legType}</td>
                        </tr>
                        {!leg.isFlat && (
                          <>
                            <tr>
                              <td className="erp-cell-muted">
                                Diesel — {leg.litresRequired} L at {money(Math.round(leg.dieselRatePerL))}/L
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  <Fuel size={12} />
                                  {leg.dieselRateStates?.map((s) => `${s.state} ₹${s.rate}`).join(' · ')}
                                </div>
                              </td>
                              <td className="erp-numeric">{money(leg.dieselAmount)}</td>
                            </tr>
                            <tr>
                              <td className="erp-cell-muted">Servicing {leg.servicingWaived && '— waived'}</td>
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
                          <td className="erp-numeric erp-cell-strong">{money(leg.grossBudget)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                    {costing.summary.carriedForwardAmount > 0 && (
                      <tr>
                        <td className="erp-cell-muted">Carried-forward empty running</td>
                        <td className="erp-numeric">+ {money(costing.summary.carriedForwardAmount)}</td>
                      </tr>
                    )}
                    {costing.deductions.map((d, i) => (
                      <tr key={`${d.type}-${i}`}>
                        <td className="erp-cell-muted">{d.type.replace(/_/g, ' ').toLowerCase()}</td>
                        <td className="erp-numeric">− {money(d.amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="erp-cell-strong">Net payable</td>
                      <td className="erp-numeric erp-cell-strong">{money(costing.summary.netPayable)}</td>
                    </tr>
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
              <span className="erp-field-hint">Blank pays the calculated {money(budget)}.</span>
            </div>
          )}

          {overBudget && (
            <div className="erp-callout" style={{ background: '#fef3c7', color: '#b45309', marginTop: 12 }}>
              <AlertTriangle size={16} />
              <span>{money(asked - budget)} over budget — this will need approval before it can be paid.</span>
            </div>
          )}
        </form>
      ) : (
        <form id="pay-advance-form" onSubmit={handlePay}>
          <div className="erp-callout info">
            <Info size={16} />
            <span>Paying out <strong>{money(payTarget?.netPayable)}</strong>. Any recovery this advance deducted is settled at the same time.</span>
          </div>
          <div className="erp-form-grid">
            <div className="erp-field full">
              <label htmlFor="pay-mode">Mode <span className="required">*</span></label>
              <select id="pay-mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="BANK">Bank transfer</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="FUEL_CARD">Fuel card</option>
              </select>
            </div>
            <div className="erp-field full">
              <label htmlFor="pay-ref">Reference</label>
              <input id="pay-ref" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="NEFT-001" />
            </div>
          </div>
        </form>
      )}
    </ErpDrawer>
  );
};

export default AdvanceDrawer;
