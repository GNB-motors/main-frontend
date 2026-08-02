import React, { useState, useEffect } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { FieldAgentFuelService } from './fieldAgentFuelService';
import './UploadFuelModal.css';

const UploadFuelModal = ({ isOpen, onClose, onUploadSuccess, vehicles = [], themeColors = {} }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    fuelType: 'DIESEL',
    fillingType: 'FULL_TANK',
    refuelTime: new Date().toISOString().slice(0, 16),
  });

  const [fuelPhoto, setFuelPhoto] = useState(null);
  const [odometerPhoto, setOdometerPhoto] = useState(null);

  useEffect(() => {
    if (isOpen) {
      FieldAgentFuelService.getDrivers()
        .then(setDrivers)
        .catch(() => setDrivers([]));
    } else {
      // Reset state on close
      setFormData({
        vehicleId: '',
        driverId: '',
        fuelType: 'DIESEL',
        fillingType: 'FULL_TANK',
        refuelTime: new Date().toISOString().slice(0, 16),
      });
      setFuelPhoto(null);
      setOdometerPhoto(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fuelPhoto) {
      setError('Fuel receipt photo is required.');
      return;
    }
    if (!formData.vehicleId) {
      setError('Vehicle is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('fuelPhoto', fuelPhoto);
      if (odometerPhoto) {
        data.append('odometerPhoto', odometerPhoto);
      }
      data.append('vehicleId', formData.vehicleId);
      data.append('fuelType', formData.fuelType);
      data.append('fillingType', formData.fillingType);

      // refuelTime format must be valid ISO, e.g. 2026-06-04T10:00:00.000Z
      const isoTime = new Date(formData.refuelTime).toISOString();
      data.append('refuelTime', isoTime);

      if (formData.driverId) {
        data.append('driverId', formData.driverId);
      }

      await FieldAgentFuelService.uploadFuelPhoto(data);
      onUploadSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.detail || 'Failed to upload fuel log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fa-modal-overlay">
      <div className="fa-modal-content" style={themeColors}>
        <div className="fa-modal-header">
          <h2>Upload Fuel Log</h2>
          <button className="fa-modal-close" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="fa-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="fa-modal-form">
          <div className="fa-form-row">
            <div className="fa-form-group">
              <label>Vehicle *</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                required
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber || v._id}
                  </option>
                ))}
              </select>
            </div>
            <div className="fa-form-group">
              <label>Driver (Optional)</label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              >
                <option value="">Select a driver</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.firstName} {d.lastName} {d.mobileNumber ? `(${d.mobileNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="fa-form-row">
            <div className="fa-form-group">
              <label>Fuel Type *</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                required
              >
                <option value="DIESEL">Diesel</option>
                <option value="ADBLUE">AdBlue</option>
              </select>
            </div>
            <div className="fa-form-group">
              <label>Filling Type *</label>
              <select
                value={formData.fillingType}
                onChange={(e) => setFormData({ ...formData, fillingType: e.target.value })}
                required
              >
                <option value="FULL_TANK">Full Tank</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>
          </div>

          <div className="fa-form-group">
            <label>Refuel Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.refuelTime}
              onChange={(e) => setFormData({ ...formData, refuelTime: e.target.value })}
              required
            />
          </div>

          <div className="fa-form-file-group">
            <label className="fa-file-label">
              <span>Fuel Receipt Photo *</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setFuelPhoto)}
                required
              />
              <div className="fa-file-box">
                <UploadCloud size={20} />
                <span>{fuelPhoto ? fuelPhoto.name : 'Choose a file'}</span>
              </div>
            </label>

            <label className="fa-file-label">
              <span>Odometer Photo (Optional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setOdometerPhoto)}
              />
              <div className="fa-file-box">
                <UploadCloud size={20} />
                <span>{odometerPhoto ? odometerPhoto.name : 'Choose a file'}</span>
              </div>
            </label>
          </div>

          <div className="fa-modal-footer">
            <button type="button" className="fa-btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="fa-btn-submit" disabled={loading}>
              {loading ? 'Uploading...' : 'Submit Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadFuelModal;
