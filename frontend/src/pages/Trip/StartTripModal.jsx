import React, { useState, useEffect } from 'react';
import { X, Upload, Loader, Search } from 'lucide-react';
import './StartTripModal.css';

const StartTripModal = ({ isOpen, onClose }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  const [odometerImage, setOdometerImage] = useState(null);
  const [odometerPreview, setOdometerPreview] = useState(null);
  const [weighInImage, setWeighInImage] = useState(null);
  const [weighInPreview, setWeighInPreview] = useState(null);
  const [dieselReceipt, setDieselReceipt] = useState(null);
  const [dieselPreview, setDieselPreview] = useState(null);
  const [adblueReceipt, setAdblueReceipt] = useState(null);
  const [adbluePreview, setAdbluePreview] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState(null);

  // Mock vehicles data - Replace with API call
  useEffect(() => {
    if (isOpen) {
      setIsLoadingVehicles(true);
      // Simulate API call
      setTimeout(() => {
        setVehicles([
          { id: 1, vehicleNo: 'WB-01-1234', model: 'Tata LPT 1618', status: 'available' },
          { id: 2, vehicleNo: 'WB-02-5678', model: 'Ashok Leyland 1920', status: 'available' },
          { id: 3, vehicleNo: 'WB-03-7890', model: 'Eicher Pro 6025', status: 'available' },
          { id: 4, vehicleNo: 'WB-06-9001', model: 'Tata Prima 4038', status: 'available' },
          { id: 5, vehicleNo: 'WB-07-2345', model: 'BharatBenz 2523', status: 'available' },
        ]);
        setIsLoadingVehicles(false);
      }, 500);
    }
  }, [isOpen]);

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        switch (type) {
          case 'odometer':
            setOdometerImage(file);
            setOdometerPreview(reader.result);
            break;
          case 'weighin':
            setWeighInImage(file);
            setWeighInPreview(reader.result);
            break;
          case 'diesel':
            setDieselReceipt(file);
            setDieselPreview(reader.result);
            break;
          case 'adblue':
            setAdblueReceipt(file);
            setAdbluePreview(reader.result);
            break;
          default:
            break;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessOCR = async () => {
    if (!odometerImage || !weighInImage) {
      alert('Please upload required documents');
      return;
    }

    setIsProcessing(true);

    // Simulate OCR processing
    setTimeout(() => {
      setOcrData({
        odometer: {
          reading: '12450',
          date: '2025-12-06',
          time: '10:30'
        },
        weighIn: {
          grossWeight: '25000',
          tareWeight: '10000',
          netWeight: '15000',
          date: '2025-12-06',
          weighbridgeNo: 'WB-001'
        },
        diesel: dieselReceipt ? {
          quantity: '120',
          amount: '11460',
          date: '2025-12-05'
        } : null,
        adblue: adblueReceipt ? {
          quantity: '10',
          amount: '450',
          date: '2025-12-05'
        } : null
      });
      setIsProcessing(false);
    }, 2000);
  };

  const handleSubmit = () => {
    if (!selectedVehicle) {
      alert('Please select a vehicle');
      return;
    }
    if (!ocrData) {
      alert('Please process the documents first');
      return;
    }

    // TODO: Submit to backend API
    console.log('Starting new trip:', {
      vehicle: selectedVehicle,
      odometerData: ocrData.odometer,
      weighInData: ocrData.weighIn,
      dieselData: ocrData.diesel,
      adblueData: ocrData.adblue,
      odometerImage,
      weighInImage,
      dieselReceipt,
      adblueReceipt
    });

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedVehicle(null);
    setSearchQuery('');
    setShowDropdown(false);
    setOdometerImage(null);
    setOdometerPreview(null);
    setWeighInImage(null);
    setWeighInPreview(null);
    setDieselReceipt(null);
    setDieselPreview(null);
    setAdblueReceipt(null);
    setAdbluePreview(null);
    setOcrData(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content start-trip-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Start New Trip</h3>
          <button className="close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Vehicle Selection */}
          <div className="form-section">
            <h4>Select Vehicle <span className="required">*</span></h4>
            <div className="vehicle-search-container">
              <div className="search-input-wrapper">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by vehicle number or model..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="search-input"
                />
              </div>
              
              {showDropdown && (
                <div className="dropdown-menu">
                  {isLoadingVehicles ? (
                    <div className="dropdown-loading">
                      <Loader size={20} className="spinner" />
                      <span>Loading vehicles...</span>
                    </div>
                  ) : filteredVehicles.length > 0 ? (
                    filteredVehicles.map(vehicle => (
                      <div
                        key={vehicle.id}
                        className={`dropdown-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setSearchQuery(vehicle.vehicleNo);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="vehicle-info">
                          <span className="vehicle-number">{vehicle.vehicleNo}</span>
                          <span className="vehicle-model">{vehicle.model}</span>
                        </div>
                        <span className={`status-badge ${vehicle.status}`}>
                          {vehicle.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-empty">No vehicles found</div>
                  )}
                </div>
              )}
            </div>

            {selectedVehicle && (
              <div className="selected-vehicle-card">
                <div className="vehicle-details">
                  <h5>{selectedVehicle.vehicleNo}</h5>
                  <p>{selectedVehicle.model}</p>
                </div>
              </div>
            )}
          </div>

          {/* Odometer Image Upload */}
          <div className="form-section">
            <h4>Odometer Reading <span className="required">*</span></h4>
            <div className="upload-area compact">
              <input
                type="file"
                id="odometer-image"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'odometer')}
                style={{ display: 'none' }}
              />
              <label htmlFor="odometer-image" className="upload-label compact">
                {odometerPreview ? (
                  <div className="preview-compact">
                    <img src={odometerPreview} alt="Odometer" />
                    <div className="preview-overlay">
                      <Upload size={20} />
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder compact">
                    <Upload size={32} />
                    <span>Upload Odometer</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Weigh-in Slip Upload */}
          <div className="form-section">
            <h4>Weigh-in Slip <span className="required">*</span></h4>
            <div className="upload-area compact">
              <input
                type="file"
                id="weighin-image"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'weighin')}
                style={{ display: 'none' }}
              />
              <label htmlFor="weighin-image" className="upload-label compact">
                {weighInPreview ? (
                  <div className="preview-compact">
                    <img src={weighInPreview} alt="Weigh-in slip" />
                    <div className="preview-overlay">
                      <Upload size={20} />
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder compact">
                    <Upload size={32} />
                    <span>Upload Weigh-in Slip</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Fuel Receipts (Optional) */}
          <div className="form-section">
            <h4>Fuel Receipts <span className="optional">(Optional)</span></h4>
            <div className="fuel-receipts-grid">
              <div className="upload-area compact">
                <input
                  type="file"
                  id="diesel-receipt-start"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'diesel')}
                  style={{ display: 'none' }}
                />
                <label htmlFor="diesel-receipt-start" className="upload-label compact">
                  {dieselPreview ? (
                    <div className="preview-compact">
                      <img src={dieselPreview} alt="Diesel receipt" />
                      <div className="preview-overlay">
                        <Upload size={20} />
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder compact">
                      <Upload size={32} />
                      <span>Diesel Receipt</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="upload-area compact">
                <input
                  type="file"
                  id="adblue-receipt-start"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'adblue')}
                  style={{ display: 'none' }}
                />
                <label htmlFor="adblue-receipt-start" className="upload-label compact">
                  {adbluePreview ? (
                    <div className="preview-compact">
                      <img src={adbluePreview} alt="AdBlue receipt" />
                      <div className="preview-overlay">
                        <Upload size={20} />
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder compact">
                      <Upload size={32} />
                      <span>AdBlue Receipt</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Process Button */}
          {odometerImage && weighInImage && !ocrData && (
            <button 
              className="process-btn"
              onClick={handleProcessOCR}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader size={16} className="spinner" />
                  Processing Documents...
                </>
              ) : (
                'Process Documents'
              )}
            </button>
          )}

          {/* OCR Results */}
          {ocrData && (
            <div className="ocr-results">
              <h4>Processed Data</h4>
              
              <div className="ocr-section">
                <h5>Odometer Reading</h5>
                <div className="ocr-grid">
                  <div className="ocr-field">
                    <label>Reading (km)</label>
                    <input type="number" value={ocrData.odometer.reading} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Date</label>
                    <input type="date" value={ocrData.odometer.date} readOnly />
                  </div>
                </div>
              </div>

              <div className="ocr-section">
                <h5>Payload Weight</h5>
                <div className="ocr-grid">
                  <div className="ocr-field">
                    <label>Gross Weight (kg)</label>
                    <input type="number" value={ocrData.weighIn.grossWeight} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Tare Weight (kg)</label>
                    <input type="number" value={ocrData.weighIn.tareWeight} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Net Weight (kg)</label>
                    <input type="number" value={ocrData.weighIn.netWeight} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Date</label>
                    <input type="date" value={ocrData.weighIn.date} readOnly />
                  </div>
                </div>
              </div>

              {ocrData.diesel && (
                <div className="ocr-section">
                  <h5>Diesel Refuel</h5>
                  <div className="ocr-grid">
                    <div className="ocr-field">
                      <label>Quantity (L)</label>
                      <input type="number" value={ocrData.diesel.quantity} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Amount (₹)</label>
                      <input type="number" value={ocrData.diesel.amount} readOnly />
                    </div>
                  </div>
                </div>
              )}

              {ocrData.adblue && (
                <div className="ocr-section">
                  <h5>AdBlue Refuel</h5>
                  <div className="ocr-grid">
                    <div className="ocr-field">
                      <label>Quantity (L)</label>
                      <input type="number" value={ocrData.adblue.quantity} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Amount (₹)</label>
                      <input type="number" value={ocrData.adblue.amount} readOnly />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={!selectedVehicle || !ocrData}
          >
            Start Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartTripModal;
