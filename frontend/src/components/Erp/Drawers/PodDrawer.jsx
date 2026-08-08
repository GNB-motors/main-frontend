import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../ErpDrawer';
import PodService from '../../../pages/ErpPods/PodService';

const todayInput = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  receivedDate: todayInput(),
  copyType: 'HARD',
  receivedVia: 'BY_HAND',
  courierName: '',
  courierDocket: '',
  remarks: '',
};

const PodDrawer = ({ 
  isOpen, 
  onClose, 
  trip = null, 
  onSuccess 
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen && trip) {
      setForm(EMPTY_FORM);
      setFile(null);
      setDocumentId('');
    }
  }, [isOpen, trip]);

  const handleUpload = async () => {
    if (!trip || !file) {
      toast.error('Choose a challan scan first');
      return;
    }
    const targetTripId = trip.tripId || trip._id;
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
    if (!trip) return;
    setBusy(true);
    const targetTripId = trip.tripId || trip._id;
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
        form="pod-form"
        className="btn btn-primary"
        disabled={busy}
      >
        {busy ? 'Recording…' : 'Record POD'}
      </button>
    </>
  );

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Proof of Delivery (POD) for ${trip?.tripNumber || ''}`}
      subtitle="Record office receipt of physical/soft challan copy"
      footer={footer}
    >
      <form id="pod-form" onSubmit={handleRecord}>
        <div className="erp-form-grid">
          <div className="erp-field">
            <label>Received date <span className="required">*</span></label>
            <input
              type="date"
              required
              max={todayInput()}
              value={form.receivedDate}
              onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
            />
          </div>

          <div className="erp-field">
            <label>Copy type <span className="required">*</span></label>
            <select
              value={form.copyType}
              onChange={(e) => setForm({ ...form, copyType: e.target.value })}
            >
              <option value="HARD">Original hard copy</option>
              <option value="SOFT">Soft copy (Scan/WhatsApp)</option>
            </select>
          </div>

          <div className="erp-field">
            <label>Received via <span className="required">*</span></label>
            <select
              value={form.receivedVia}
              onChange={(e) => setForm({ ...form, receivedVia: e.target.value })}
            >
              <option value="BY_HAND">By hand</option>
              <option value="COURIER">Courier</option>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>

          {form.receivedVia === 'COURIER' && (
            <>
              <div className="erp-field">
                <label>Courier name</label>
                <input
                  value={form.courierName}
                  onChange={(e) => setForm({ ...form, courierName: e.target.value })}
                />
              </div>
              <div className="erp-field">
                <label>Docket number</label>
                <input
                  value={form.courierDocket}
                  onChange={(e) => setForm({ ...form, courierDocket: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="erp-field full">
            <label>Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="E.g., Missing one stamp..."
            />
          </div>
        </div>

        <div className="erp-callout" style={{ marginTop: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <Upload size={20} style={{ marginTop: 4 }} />
          <div>
            <strong>Challan Upload</strong>
            <p className="erp-muted" style={{ margin: '4px 0 12px', fontSize: '13px' }}>
              Upload the stamped POD / challan scan.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setDocumentId('');
                }}
                style={{ border: 'none', padding: 0 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? 'Uploading…' : 'Upload scan'}
              </button>
              {documentId && (
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

export default PodDrawer;
