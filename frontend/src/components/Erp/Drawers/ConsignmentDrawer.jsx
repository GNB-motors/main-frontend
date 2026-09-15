import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../ErpDrawer';
import ConsignmentService from '../../../pages/ErpConsignments/ConsignmentService';

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

const ConsignmentDrawer = ({ 
  isOpen, 
  onClose, 
  trip = null, 
  onSuccess 
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [biltyFile, setBiltyFile] = useState(null);
  const [biltyDocumentId, setBiltyDocumentId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen && trip) {
      setForm({
        ...EMPTY_FORM,
        cnDate: trip.tripDate ? String(trip.tripDate).slice(0, 10) : todayInput(),
        loadingDate: trip.tripDate ? String(trip.tripDate).slice(0, 10) : todayInput(),
        loadedQty: trip.plannedQty ?? '',
        loadedQtyUnit: 'KL',
      });
      setBiltyFile(null);
      setBiltyDocumentId('');
    }
  }, [isOpen, trip]);

  const handleUpload = async () => {
    if (!trip || !biltyFile) {
      toast.error('Choose a bilty file first');
      return;
    }
    setUploading(true);
    try {
      const res = await ConsignmentService.uploadBilty({
        tripId: trip._id,
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
    if (!trip) return;
    setBusy(true);
    try {
      const seals = form.sealNumbers
        ? form.sealNumbers.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await ConsignmentService.saveCn({
        tripId: trip._id,
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
        form="cn-form"
        className="btn btn-primary"
        disabled={busy || !biltyDocumentId}
      >
        {busy ? 'Saving…' : 'Save CN'}
      </button>
    </>
  );

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Consignment Note for ${trip?.tripNumber || ''}`}
      subtitle="Enter bilty details and upload consignment document scan"
      footer={footer}
    >
      <form id="cn-form" onSubmit={handleSave}>
        <div className="erp-form-grid">
          <div className="erp-field">
            <label>CN number <span className="required">*</span></label>
            <input
              required
              value={form.cnNumber}
              onChange={(e) => setForm({ ...form, cnNumber: e.target.value })}
              placeholder="As printed on bilty"
            />
          </div>
          <div className="erp-field">
            <label>CN date <span className="required">*</span></label>
            <input
              type="date"
              required
              value={form.cnDate}
              onChange={(e) => setForm({ ...form, cnDate: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label>Loading date <span className="required">*</span></label>
            <input
              type="date"
              required
              value={form.loadingDate}
              onChange={(e) => setForm({ ...form, loadingDate: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label>Loaded qty <span className="required">*</span></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                step="any"
                min="0"
                required
                style={{ flex: 1 }}
                value={form.loadedQty}
                onChange={(e) => setForm({ ...form, loadedQty: e.target.value })}
              />
              <select
                value={form.loadedQtyUnit}
                onChange={(e) => setForm({ ...form, loadedQtyUnit: e.target.value })}
                style={{ width: '80px' }}
              >
                <option value="KL">KL</option>
                <option value="MT">MT</option>
              </select>
            </div>
          </div>
          <div className="erp-field full">
            <label>Seal numbers</label>
            <input
              value={form.sealNumbers}
              onChange={(e) => setForm({ ...form, sealNumbers: e.target.value })}
              placeholder="Comma-separated"
            />
          </div>
        </div>

        <div className="erp-callout" style={{ marginTop: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <Upload size={20} style={{ marginTop: 4 }} />
          <div>
            <strong>Bilty Upload</strong>
            <p className="erp-muted" style={{ margin: '4px 0 12px', fontSize: '13px' }}>
              Upload the LR / consignment note scan before saving.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  setBiltyFile(e.target.files?.[0] || null);
                  setBiltyDocumentId('');
                }}
                style={{ border: 'none', padding: 0 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!biltyFile || uploading}
                onClick={handleUpload}
              >
                {uploading ? 'Uploading…' : 'Upload bilty'}
              </button>
              {biltyDocumentId && (
                <span className="erp-badge success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={14} /> Uploaded
                </span>
              )}
            </div>
          </div>
        </div>
      </form>
    </ErpDrawer>
  );
};

export default ConsignmentDrawer;
