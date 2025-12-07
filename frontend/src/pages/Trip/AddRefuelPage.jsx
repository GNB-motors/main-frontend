import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import '../PageStyles.css';
import './AddRefuelPage.css';
import { loadRefuelLogs, persistRefuelLogs, notifyRefuelLogsUpdated } from './refuelStorage';
import {
  mockVehicles as vehicleOptions,
  mockDrivers as driverOptions,
  paymentModes as paymentOptions,
  fuelTypes as fuelTypeOptions
} from './refuelMockData';

const getDefaultDate = () => new Date().toISOString().split('T')[0];

const getDefaultTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const AddRefuelPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    date: getDefaultDate(),
    time: getDefaultTime(),
    location: '',
    vendor: '',
    odometer: '',
    fuelType: fuelTypeOptions[0] || 'Diesel',
    quantity: '',
    unitPrice: '',
    paymentMethod: paymentOptions[0] || 'Fuel Card',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const pageContentEl = document.querySelector('.page-content');
    if (pageContentEl) {
      pageContentEl.classList.add('no-padding');
    }
    return () => {
      if (pageContentEl) {
        pageContentEl.classList.remove('no-padding');
      }
    };
  }, []);

  const calculatedAmount = useMemo(() => {
    const quantity = parseFloat(formData.quantity);
    const unitPrice = parseFloat(formData.unitPrice);

    if (Number.isNaN(quantity) || Number.isNaN(unitPrice)) {
      return '';
    }

    return (quantity * unitPrice).toFixed(2);
  }, [formData.quantity, formData.unitPrice]);

  const handleInputChange = (field, value) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    navigate('/refuel-logs');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requiredFields = [
      'vehicleId',
      'driverId',
      'date',
      'time',
      'location',
      'fuelType',
      'quantity',
      'unitPrice',
      'paymentMethod'
    ];

    const hasEmpty = requiredFields.some((field) => !formData[field]);
    if (hasEmpty) {
      setFormError('Please complete all required fields before saving.');
      return;
    }

    const selectedVehicle = vehicleOptions.find(
      (vehicle) => String(vehicle.id) === String(formData.vehicleId)
    );
    const selectedDriver = driverOptions.find(
      (driver) => String(driver.id) === String(formData.driverId)
    );

    if (!selectedVehicle || !selectedDriver) {
      setFormError('Select a valid vehicle and driver.');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const unitPrice = parseFloat(formData.unitPrice);

    if (Number.isNaN(quantity) || Number.isNaN(unitPrice)) {
      setFormError('Enter valid numeric values for quantity and unit price.');
      return;
    }

    const totalAmount = Number((quantity * unitPrice).toFixed(2));
    const odometer = formData.odometer ? parseInt(formData.odometer, 10) : null;

    if (formData.odometer && Number.isNaN(odometer)) {
      setFormError('Enter a valid odometer reading.');
      return;
    }

    const newLog = {
      id: `RF-${Date.now()}`,
      date: formData.date,
      time: formData.time,
      vehicleNo: selectedVehicle.number,
      vehicleModel: selectedVehicle.model,
      driverName: selectedDriver.name,
      driverPhone: selectedDriver.phone,
      location: formData.location,
      vendor: formData.vendor,
      fuelType: formData.fuelType,
      quantity,
      unitPrice,
      totalAmount,
      odometer,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes
    };

    try {
      setIsSaving(true);
      const existingLogs = loadRefuelLogs();
      persistRefuelLogs([newLog, ...existingLogs]);
      notifyRefuelLogsUpdated();
      navigate('/refuel-logs');
    } catch (error) {
      console.error('Unable to save refuel log', error);
      setFormError('Something went wrong while saving. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="add-refuel-page">
      <div className="add-refuel-container">
        <div className="add-refuel-header">
          <button type="button" className="back-btn" onClick={handleCancel}>
            <ArrowLeft size={20} />
            <span>Back to Refuel Logs</span>
          </button>
          <h1>Add Refuel Entry</h1>
        </div>

        <form className="add-refuel-content" onSubmit={handleSubmit}>
          {formError && <div className="form-error">{formError}</div>}

          <section className="form-section">
            <h2 className="section-title">Trip &amp; Vehicle</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Vehicle <span className="required">*</span></label>
                <select
                  value={formData.vehicleId}
                  onChange={(event) => handleInputChange('vehicleId', event.target.value)}
                >
                  <option value="">Select vehicle</option>
                  {vehicleOptions.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.number} - {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Driver <span className="required">*</span></label>
                <select
                  value={formData.driverId}
                  onChange={(event) => handleInputChange('driverId', event.target.value)}
                >
                  <option value="">Select driver</option>
                  {driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date <span className="required">*</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(event) => handleInputChange('date', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Time <span className="required">*</span></label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(event) => handleInputChange('time', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Location <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Fuel station or city"
                  value={formData.location}
                  onChange={(event) => handleInputChange('location', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Vendor</label>
                <input
                  type="text"
                  placeholder="Fuel operator"
                  value={formData.vendor}
                  onChange={(event) => handleInputChange('vendor', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Odometer (km)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Current reading"
                  value={formData.odometer}
                  onChange={(event) => handleInputChange('odometer', event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2 className="section-title">Fuel Details</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Fuel Type <span className="required">*</span></label>
                <select
                  value={formData.fuelType}
                  onChange={(event) => handleInputChange('fuelType', event.target.value)}
                >
                  {fuelTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity (litres) <span className="required">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Eg. 120"
                  value={formData.quantity}
                  onChange={(event) => handleInputChange('quantity', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Unit Price (₹/litre) <span className="required">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Eg. 90.50"
                  value={formData.unitPrice}
                  onChange={(event) => handleInputChange('unitPrice', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Total Amount (₹)</label>
                <input type="text" value={calculatedAmount} readOnly className="readonly" />
                <span className="helper-text">Calculated automatically</span>
              </div>

              <div className="form-group">
                <label>Payment Method <span className="required">*</span></label>
                <select
                  value={formData.paymentMethod}
                  onChange={(event) => handleInputChange('paymentMethod', event.target.value)}
                >
                  {paymentOptions.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group span-2">
                <label>Notes</label>
                <textarea
                  rows={3}
                  placeholder="Optional remarks about this refuel"
                  value={formData.notes}
                  onChange={(event) => handleInputChange('notes', event.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Refuel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRefuelPage;
