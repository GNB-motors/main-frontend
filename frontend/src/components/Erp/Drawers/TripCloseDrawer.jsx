import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../ErpDrawer';
import TripCloseService from '../../../pages/ErpTrips/TripCloseService';

const todayInput = () => new Date().toISOString().slice(0, 10);

const TripCloseDrawer = ({ 
  isOpen, 
  onClose, 
  trip = null, 
  onSuccess 
}) => {
  const [form, setForm] = useState({
    unloadedAt: todayInput(),
    unloadLocation: '',
    closeRemarks: '',
    reportEmptyEnabled: false,
    reportEmptyTo: '',
    reportEmptyKm: '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen && trip) {
      setForm({
        unloadedAt: todayInput(),
        unloadLocation: trip.toLocation || '',
        closeRemarks: '',
        reportEmptyEnabled: false,
        reportEmptyTo: '',
        reportEmptyKm: '',
      });
    }
  }, [isOpen, trip]);

  const handleClose = async (e) => {
    e.preventDefault();
    if (!trip) return;
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
      await TripCloseService.closeTrip(trip._id || trip.tripId, payload);
      toast.success('Trip closed');
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
        form="close-trip-form"
        className="btn btn-primary"
        disabled={busy}
      >
        {busy ? 'Closing…' : 'Close Trip'}
      </button>
    </>
  );

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Close Trip ${trip?.tripNumber || ''}`}
      subtitle="Record operational trip unload date and optional report-empty run details"
      footer={footer}
    >
      <form id="close-trip-form" onSubmit={handleClose}>
        <div className="erp-form-grid">
          <div className="erp-field">
            <label>Unloaded date <span className="required">*</span></label>
            <input
              type="date"
              required
              value={form.unloadedAt}
              onChange={(e) => setForm({ ...form, unloadedAt: e.target.value })}
            />
          </div>

          <div className="erp-field">
            <label>Unload location <span className="required">*</span></label>
            <input
              required
              value={form.unloadLocation}
              onChange={(e) => setForm({ ...form, unloadLocation: e.target.value })}
            />
          </div>

          <div className="erp-field full">
            <label>Closing remarks</label>
            <textarea
              value={form.closeRemarks}
              onChange={(e) => setForm({ ...form, closeRemarks: e.target.value })}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        <div className="erp-callout" style={{ marginTop: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <AlertTriangle size={20} style={{ marginTop: 4, color: '#f59e0b' }} />
          <div style={{ flex: 1 }}>
            <strong>Report Empty (Optional)</strong>
            <p className="erp-muted" style={{ margin: '4px 0 12px', fontSize: '13px' }}>
              If the vehicle is reporting empty to another location, record it here to unlock an empty-run advance.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.reportEmptyEnabled}
                onChange={(e) => setForm({ ...form, reportEmptyEnabled: e.target.checked })}
                style={{ width: 'auto', margin: 0 }}
              />
              Enable report empty tracking
            </label>
            
            {form.reportEmptyEnabled && (
              <div className="erp-form-grid" style={{ marginTop: 16 }}>
                <div className="erp-field">
                  <label>Report to location <span className="required">*</span></label>
                  <input
                    required={form.reportEmptyEnabled}
                    value={form.reportEmptyTo}
                    onChange={(e) => setForm({ ...form, reportEmptyTo: e.target.value })}
                    placeholder="e.g. Siliguri"
                  />
                </div>
                <div className="erp-field">
                  <label>Distance (km) <span className="required">*</span></label>
                  <input
                    type="number"
                    min="1"
                    required={form.reportEmptyEnabled}
                    value={form.reportEmptyKm}
                    onChange={(e) => setForm({ ...form, reportEmptyKm: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </ErpDrawer>
  );
};

export default TripCloseDrawer;
