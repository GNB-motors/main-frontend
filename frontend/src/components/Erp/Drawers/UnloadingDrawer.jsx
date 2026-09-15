import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ErpDrawer from '../ErpDrawer';
import UnloadingApi from '../../../pages/ErpUnloading/UnloadingService';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const UnloadingDrawer = ({ 
  isOpen, 
  onClose, 
  trip = null, 
  onSuccess 
}) => {
  const [form, setForm] = useState({
    unloadedQty: '',
    detentionDays: '0',
    sbRateOverride: '',
    sbRateRemark: '',
  });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen && trip) {
      setForm({
        unloadedQty: trip.loadedQty != null ? String(trip.loadedQty) : '',
        detentionDays: '0',
        sbRateOverride: '',
        sbRateRemark: '',
      });
      setPreview(null);
    }
  }, [isOpen, trip]);

  const runPreview = async () => {
    if (!trip) return;
    setBusy(true);
    try {
      const payload = {
        tripId: trip._id || trip.tripId,
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
    if (!trip) return;
    setBusy(true);
    try {
      const payload = {
        tripId: trip._id || trip.tripId,
        unloadedQty: Number(form.unloadedQty),
        detentionDays: Number(form.detentionDays) || 0,
        sbRateRemark: form.sbRateRemark,
      };
      if (form.sbRateOverride !== '') {
        payload.sbRateOverride = Number(form.sbRateOverride);
      }
      await UnloadingApi.save(payload);
      toast.success('Unloading saved');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Cancel
      </button>
      <button
        type="submit"
        form="unloading-form"
        className="btn btn-primary"
        disabled={busy || !preview}
      >
        {busy ? 'Saving…' : 'Save Unloading'}
      </button>
    </>
  );

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Unloading Entry for ${trip?.tripNumber || ''}`}
      subtitle="Calculate shortage, detention, and net freight settlement"
      footer={footer}
    >
      <form id="unloading-form" onSubmit={handleSave}>
        <div className="erp-card" style={{ padding: '16px', background: '#f8fafc', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Loaded Details</h4>
          <p style={{ margin: 0 }}>
            Qty: <strong>{trip?.loadedQty} {trip?.qtyUnit || 'KL'}</strong>
          </p>
          <p style={{ margin: '4px 0 0 0' }}>
            Rate: <strong>{money(trip?.sbRate || 0)}</strong> ({trip?.sbRateType})
          </p>
        </div>

        <div className="erp-form-grid">
          <div className="erp-field">
            <label>Unloaded qty <span className="required">*</span></label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={form.unloadedQty}
              onChange={(e) => setForm({ ...form, unloadedQty: e.target.value })}
            />
          </div>

          <div className="erp-field">
            <label>Detention days</label>
            <input
              type="number"
              min="0"
              value={form.detentionDays}
              onChange={(e) => setForm({ ...form, detentionDays: e.target.value })}
            />
          </div>

          <div className="erp-field">
            <label>Manual Rate Override</label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Optional"
              value={form.sbRateOverride}
              onChange={(e) => setForm({ ...form, sbRateOverride: e.target.value })}
            />
          </div>

          <div className="erp-field full">
            <label>Rate remarks</label>
            <input
              placeholder="Reason for manual rate..."
              value={form.sbRateRemark}
              onChange={(e) => setForm({ ...form, sbRateRemark: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={runPreview}
            disabled={busy || form.unloadedQty === ''}
          >
            Calculate Preview
          </button>
        </div>

        {preview && (
          <div className="erp-card" style={{ marginTop: '20px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Settlement Preview
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
              <div className="erp-cell-muted">Gross Freight</div>
              <div className="erp-numeric">{money(preview.grossAmount)}</div>

              <div className="erp-cell-muted">Shortage ({preview.shortageQty} {trip?.qtyUnit || 'KL'})</div>
              <div className="erp-numeric" style={{ color: preview.shortageDeduction > 0 ? '#dc2626' : 'inherit' }}>
                {preview.shortageDeduction > 0 ? `− ${money(preview.shortageDeduction)}` : money(0)}
              </div>

              <div className="erp-cell-muted">Detention ({preview.detentionDays} days)</div>
              <div className="erp-numeric" style={{ color: preview.detentionAmount > 0 ? '#16a34a' : 'inherit' }}>
                {preview.detentionAmount > 0 ? `+ ${money(preview.detentionAmount)}` : money(0)}
              </div>

              <div className="erp-cell-strong" style={{ paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>Net Freight</div>
              <div className="erp-numeric erp-cell-strong" style={{ paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                {money(preview.netAmount)}
              </div>
            </div>
          </div>
        )}
      </form>
    </ErpDrawer>
  );
};

export default UnloadingDrawer;
