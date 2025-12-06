import React, { useState } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import './RefuelModal.css';

const RefuelModal = ({ isOpen, onClose, tripId, vehicleNo }) => {
  // Image upload states
  const [dieselReceipt, setDieselReceipt] = useState(null);
  const [adblueReceipt, setAdblueReceipt] = useState(null);
  const [dieselPreview, setDieselPreview] = useState(null);
  const [adbluePreview, setAdbluePreview] = useState(null);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'diesel') {
          setDieselReceipt(file);
          setDieselPreview(reader.result);
        } else {
          setAdblueReceipt(file);
          setAdbluePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessOCR = async () => {
    if (!dieselReceipt) {
      alert('Please upload diesel receipt');
      return;
    }

    setIsProcessing(true);
    
    // Simulate OCR processing - Replace with actual OCR API call
    setTimeout(() => {
      setOcrData({
        diesel: {
          date: '2025-12-06',
          quantity: '120',
          pricePerLiter: '95.50',
          totalAmount: '11460',
          fuelStation: 'Indian Oil Station',
          location: 'Kolkata, WB'
        },
        adblue: adblueReceipt ? {
          date: '2025-12-06',
          quantity: '10',
          pricePerLiter: '45.00',
          totalAmount: '450',
          fuelStation: 'Indian Oil Station',
          location: 'Kolkata, WB'
        } : null
      });
      setIsProcessing(false);
    }, 2000);
  };

  const handleSubmit = () => {
    if (!ocrData) {
      alert('Please process the receipts first');
      return;
    }

    // TODO: Submit to backend API
    console.log('Submitting refuel data:', {
      tripId,
      vehicleNo,
      dieselData: ocrData.diesel,
      adblueData: ocrData.adblue,
      dieselReceipt,
      adblueReceipt
    });

    // Close modal and reset
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setDieselReceipt(null);
    setAdblueReceipt(null);
    setDieselPreview(null);
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
      <div className="modal-content refuel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Refueling</h3>
          <button className="close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="trip-info-header">
            <p><strong>Vehicle:</strong> {vehicleNo}</p>
            <p><strong>Trip ID:</strong> #{tripId}</p>
          </div>

          <div className="upload-section">
            <h4>Diesel Receipt <span className="required">*</span></h4>
            <div className="upload-area">
              <input
                type="file"
                id="diesel-receipt"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'diesel')}
                style={{ display: 'none' }}
              />
              <label htmlFor="diesel-receipt" className="upload-label">
                {dieselPreview ? (
                  <div className="preview-container">
                    <img src={dieselPreview} alt="Diesel receipt" />
                    <div className="preview-overlay">
                      <Upload size={24} />
                      <span>Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={40} />
                    <p>Click to upload diesel receipt</p>
                    <span>PNG, JPG up to 10MB</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="upload-section">
            <h4>AdBlue Receipt <span className="optional">(Optional)</span></h4>
            <div className="upload-area">
              <input
                type="file"
                id="adblue-receipt"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'adblue')}
                style={{ display: 'none' }}
              />
              <label htmlFor="adblue-receipt" className="upload-label">
                {adbluePreview ? (
                  <div className="preview-container">
                    <img src={adbluePreview} alt="AdBlue receipt" />
                    <div className="preview-overlay">
                      <Upload size={24} />
                      <span>Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={40} />
                    <p>Click to upload AdBlue receipt</p>
                    <span>PNG, JPG up to 10MB</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {dieselReceipt && !ocrData && (
            <button 
              className="process-btn"
              onClick={handleProcessOCR}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader size={16} className="spinner" />
                  Processing...
                </>
              ) : (
                'Process Receipts'
              )}
            </button>
          )}

          {ocrData && (
            <div className="ocr-results">
              <h4>Processed Data</h4>
              
              <div className="ocr-section">
                <h5>Diesel</h5>
                <div className="ocr-grid">
                  <div className="ocr-field">
                    <label>Date</label>
                    <input type="date" value={ocrData.diesel.date} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Quantity (L)</label>
                    <input type="number" value={ocrData.diesel.quantity} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Price/Liter (₹)</label>
                    <input type="number" value={ocrData.diesel.pricePerLiter} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Total Amount (₹)</label>
                    <input type="number" value={ocrData.diesel.totalAmount} readOnly />
                  </div>
                  <div className="ocr-field full-width">
                    <label>Fuel Station</label>
                    <input type="text" value={ocrData.diesel.fuelStation} readOnly />
                  </div>
                  <div className="ocr-field full-width">
                    <label>Location</label>
                    <input type="text" value={ocrData.diesel.location} readOnly />
                  </div>
                </div>
              </div>

              {ocrData.adblue && (
                <div className="ocr-section">
                  <h5>AdBlue</h5>
                  <div className="ocr-grid">
                    <div className="ocr-field">
                      <label>Date</label>
                      <input type="date" value={ocrData.adblue.date} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Quantity (L)</label>
                      <input type="number" value={ocrData.adblue.quantity} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Price/Liter (₹)</label>
                      <input type="number" value={ocrData.adblue.pricePerLiter} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Total Amount (₹)</label>
                      <input type="number" value={ocrData.adblue.totalAmount} readOnly />
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
            disabled={!ocrData}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefuelModal;
