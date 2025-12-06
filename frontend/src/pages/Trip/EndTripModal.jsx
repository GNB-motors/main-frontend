import React, { useState } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import './EndTripModal.css';

const EndTripModal = ({ isOpen, onClose, tripId, vehicleNo }) => {
  // Image upload states
  const [odometerImage, setOdometerImage] = useState(null);
  const [odometerPreview, setOdometerPreview] = useState(null);
  const [podImage, setPodImage] = useState(null);
  const [podPreview, setPodPreview] = useState(null);
  const [dieselReceipt, setDieselReceipt] = useState(null);
  const [dieselPreview, setDieselPreview] = useState(null);
  const [adblueReceipt, setAdblueReceipt] = useState(null);
  const [adbluePreview, setAdbluePreview] = useState(null);

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState(null);

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
          case 'pod':
            setPodImage(file);
            setPodPreview(reader.result);
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
    if (!odometerImage || !podImage) {
      alert('Please upload required documents');
      return;
    }

    setIsProcessing(true);

    // Simulate OCR processing - Replace with actual OCR API call
    setTimeout(() => {
      setOcrData({
        odometer: {
          reading: '12630',
          date: '2025-12-06',
          time: '18:45'
        },
        pod: {
          deliveryLocation: 'Greater Thane - 421302',
          receiverName: 'Rajesh Kumar',
          receiverSignature: 'Present',
          deliveryDate: '2025-12-06',
          deliveryTime: '18:30',
          remarks: 'Delivered in good condition'
        },
        diesel: dieselReceipt ? {
          quantity: '50',
          pricePerLiter: '95.50',
          totalAmount: '4775',
          date: '2025-12-06',
          location: 'Thane, MH'
        } : null,
        adblue: adblueReceipt ? {
          quantity: '5',
          pricePerLiter: '45.00',
          totalAmount: '225',
          date: '2025-12-06',
          location: 'Thane, MH'
        } : null
      });
      setIsProcessing(false);
    }, 2000);
  };

  const handleSubmit = () => {
    if (!ocrData) {
      alert('Please process the documents first');
      return;
    }

    // TODO: Submit to backend API
    console.log('Ending trip:', {
      tripId,
      vehicleNo,
      odometerData: ocrData.odometer,
      podData: ocrData.pod,
      dieselData: ocrData.diesel,
      adblueData: ocrData.adblue,
      odometerImage,
      podImage,
      dieselReceipt,
      adblueReceipt
    });

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setOdometerImage(null);
    setOdometerPreview(null);
    setPodImage(null);
    setPodPreview(null);
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
      <div className="modal-content end-trip-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>End Trip</h3>
          <button className="close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="trip-info-header">
            <p><strong>Vehicle:</strong> {vehicleNo}</p>
            <p><strong>Trip ID:</strong> #{tripId}</p>
          </div>

          {/* Odometer End */}
          <div className="form-section">
            <h4>Odometer Reading - End <span className="required">*</span></h4>
            <div className="upload-area compact">
              <input
                type="file"
                id="odometer-end"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'odometer')}
                style={{ display: 'none' }}
              />
              <label htmlFor="odometer-end" className="upload-label compact">
                {odometerPreview ? (
                  <div className="preview-compact">
                    <img src={odometerPreview} alt="Odometer end" />
                    <div className="preview-overlay">
                      <Upload size={20} />
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder compact">
                    <Upload size={32} />
                    <span>Upload Odometer Reading</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Proof of Delivery */}
          <div className="form-section">
            <h4>Proof of Delivery <span className="required">*</span></h4>
            <div className="upload-area compact">
              <input
                type="file"
                id="pod-image"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'pod')}
                style={{ display: 'none' }}
              />
              <label htmlFor="pod-image" className="upload-label compact">
                {podPreview ? (
                  <div className="preview-compact">
                    <img src={podPreview} alt="Proof of delivery" />
                    <div className="preview-overlay">
                      <Upload size={20} />
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder compact">
                    <Upload size={32} />
                    <span>Upload Proof of Delivery</span>
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
                  id="diesel-receipt-end"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'diesel')}
                  style={{ display: 'none' }}
                />
                <label htmlFor="diesel-receipt-end" className="upload-label compact">
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
                  id="adblue-receipt-end"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'adblue')}
                  style={{ display: 'none' }}
                />
                <label htmlFor="adblue-receipt-end" className="upload-label compact">
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
          {odometerImage && podImage && !ocrData && (
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
                <h5>Odometer Reading - End</h5>
                <div className="ocr-grid">
                  <div className="ocr-field">
                    <label>Reading (km)</label>
                    <input type="number" value={ocrData.odometer.reading} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Date & Time</label>
                    <input type="text" value={`${ocrData.odometer.date} ${ocrData.odometer.time}`} readOnly />
                  </div>
                </div>
              </div>

              <div className="ocr-section">
                <h5>Delivery Information</h5>
                <div className="ocr-grid">
                  <div className="ocr-field full-width">
                    <label>Delivery Location</label>
                    <input type="text" value={ocrData.pod.deliveryLocation} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Receiver Name</label>
                    <input type="text" value={ocrData.pod.receiverName} readOnly />
                  </div>
                  <div className="ocr-field">
                    <label>Delivery Date</label>
                    <input type="date" value={ocrData.pod.deliveryDate} readOnly />
                  </div>
                  <div className="ocr-field full-width">
                    <label>Remarks</label>
                    <input type="text" value={ocrData.pod.remarks} readOnly />
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
                      <label>Price/Liter (₹)</label>
                      <input type="number" value={ocrData.diesel.pricePerLiter} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Total Amount (₹)</label>
                      <input type="number" value={ocrData.diesel.totalAmount} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Location</label>
                      <input type="text" value={ocrData.diesel.location} readOnly />
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
                      <label>Price/Liter (₹)</label>
                      <input type="number" value={ocrData.adblue.pricePerLiter} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Total Amount (₹)</label>
                      <input type="number" value={ocrData.adblue.totalAmount} readOnly />
                    </div>
                    <div className="ocr-field">
                      <label>Location</label>
                      <input type="text" value={ocrData.adblue.location} readOnly />
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
            className="btn-primary end-trip-btn" 
            onClick={handleSubmit}
            disabled={!ocrData}
          >
            End Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndTripModal;
