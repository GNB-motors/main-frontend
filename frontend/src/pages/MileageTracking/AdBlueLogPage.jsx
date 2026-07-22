import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CircularProgress } from '@mui/material';
import { ChevronDown, Trash2, Loader2, CheckCircle, AlertCircle, ArrowLeft, Droplet } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import { TripService, OCRService } from '../Trip/services';
import './MileageTracking.css';

const StackedDocIcon = () => (
  <svg width="46" height="42" viewBox="0 0 56 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="2" width="28" height="36" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" transform="rotate(-8 20 8)" />
    <rect x="12" y="5" width="28" height="36" rx="4" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5" transform="rotate(4 28 18)" />
    <rect x="14" y="8" width="28" height="36" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.5" />
    <rect x="19" y="18" width="18" height="14" rx="2" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1" />
    <circle cx="23" cy="23" r="2" fill="#60a5fa" />
    <path d="M19 30 L24 24 L28 27 L31 24 L32 30" fill="#bfdbfe" stroke="none" />
  </svg>
);

const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  return validTypes.includes(file.type) &&
    validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) &&
    file.size <= 10 * 1024 * 1024;
};

const SlotUpload = ({ title, label, inputId, required, doc, isScanning, onDrop, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onDrop(files);
  };

  return (
    <div className="modern-document-slot">
      <div className="slot-header">
        <h3>{title}{required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}</h3>
        {!required && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Optional</span>}
      </div>
      <input type="file" id={inputId} accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) { onDrop([e.target.files[0]]); e.target.value = ''; } }} />
      {!doc ? (
        <div className={`slot-dropzone ${isDragging ? 'dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className={`slot-dropzone-inner ${isDragging ? 'dragging' : ''}`}>
            {isDragging ? (
              <><div className="slot-dropzone-drag-icon">⬇️</div><p className="slot-dropzone-drag-text">Drop it here!</p></>
            ) : (
              <><div className="slot-icon-wrapper"><StackedDocIcon /></div>
                <p className="slot-dropzone-title">Drag & drop <span className="slot-highlight">{label}</span></p>
                <p className="slot-dropzone-sub">or <label htmlFor={inputId} className="slot-browse-link">browse</label></p></>
            )}
          </div>
        </div>
      ) : (
        <div className="slot-filled-container">
          <div className="slot-image-wrapper">
            <img src={doc.preview} alt={title} />
            <div className="slot-image-overlay">
              <div className={`slot-badge ${doc.ocrStatus === 'success' ? 'success' : ''}`}>
                {isScanning ? <><Loader2 size={13} className="spinning" /> Scanning...</>
                  : doc.ocrStatus === 'success' ? <><CheckCircle size={13} className="badge-icon-svg" /> OCR Done</>
                  : doc.ocrStatus === 'error' ? <><AlertCircle size={13} style={{ color: '#ef4444' }} /> OCR Failed</>
                  : doc.ocrStatus === 'skipped' ? <><CheckCircle size={13} className="badge-icon-svg" /> Uploaded</>
                  : <><Loader2 size={13} className="spinning" /> Scanning...</>}
              </div>
              <div className="slot-actions">
                <label htmlFor={inputId} className="slot-action-btn edit" style={{ cursor: 'pointer' }}>Replace</label>
                <button type="button" className="slot-action-btn delete" onClick={(e) => { e.preventDefault(); onRemove(); }}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdBlueLogPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [formData, setFormData] = useState({ litres: '', amount: '', place: '' });
  const [receipt, setReceipt] = useState(null);
  const [ocrScanning, setOcrScanning] = useState(false);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => { setShowVehicleDropdown(false); setShowDriverDropdown(false); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const vehRes = await TripService.getVehicles({ limit: 100 });
        const drvRes = await TripService.getDrivers({ limit: 100 });
        setVehicles((vehRes?.data || []).map(v => ({
          id: v._id,
          name: v.registrationNumber,
          registration: `${v.vehicleType} - ${v.model || 'N/A'}`,
        })));
        setDrivers((drvRes?.data || []).map(d => ({
          id: d._id,
          name: `${d.firstName} ${d.lastName || ''}`.trim(),
          licenseNo: d.licenseNo || 'N/A',
        })));
      } catch {
        toast.error('Failed to load drivers and vehicles');
      } finally {
        setLoadingVehicles(false);
        setLoadingDrivers(false);
      }
    };
    fetchDeps();
  }, []);

  const filteredVehicles = useMemo(() => vehicles.filter(v =>
    v.name.toLowerCase().includes(vehicleSearch.toLowerCase())
    || v.registration.toLowerCase().includes(vehicleSearch.toLowerCase())
  ), [vehicleSearch, vehicles]);

  const filteredDrivers = useMemo(() => drivers.filter(d =>
    d.name.toLowerCase().includes(driverSearch.toLowerCase())
    || d.licenseNo.toLowerCase().includes(driverSearch.toLowerCase())
  ), [driverSearch, drivers]);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDocDrop = useCallback(async (files) => {
    if (!files.length) return;
    const file = files[0];
    if (!validateImageFile(file)) {
      toast.error('Valid image required (JPG, PNG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      setReceipt({ file, preview: e.target.result, ocrStatus: 'scanning' });
      setOcrScanning(true);
      try {
        const ocrResult = await OCRService.scan(file, 'FUEL_RECEIPT');
        if (ocrResult.success) {
          const data = ocrResult.data || {};
          setReceipt(prev => ({ ...prev, ocrData: data, ocrStatus: 'success' }));
          setFormData(prev => ({
            ...prev,
            litres: data.volume ?? prev.litres,
            amount: data.amount ?? (data.volume && data.rate ? Number(data.volume) * Number(data.rate) : prev.amount),
            place: data.location || prev.place,
          }));
          if (data.volume) toast.success(`Autofilled Volume: ${data.volume}L`);
        } else {
          setReceipt(prev => ({ ...prev, ocrStatus: 'error' }));
          toast.warning('OCR failed. Enter values manually.');
        }
      } catch {
        setReceipt(prev => ({ ...prev, ocrStatus: 'skipped' }));
      } finally {
        setOcrScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriver) return toast.error('Please select a vehicle and a driver.');
    if (formData.litres === '' || formData.amount === '') return toast.error('Litres and amount are required.');

    setIsLoading(true);
    try {
      let documentId;
      if (receipt?.file) {
        const receiptData = new FormData();
        receiptData.append('file', receipt.file);
        receiptData.append('docType', 'FUEL_SLIP');
        receiptData.append('entityType', 'VEHICLE');
        receiptData.append('entityId', selectedVehicle.id);
        if (receipt.ocrData) receiptData.append('ocrData', JSON.stringify(receipt.ocrData));
        const receiptRes = await apiClient.post('/api/documents', receiptData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
        documentId = receiptRes.data.data?._id || receiptRes.data._id;
      }

      const payload = {
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        litres: parseFloat(formData.litres),
        amount: parseFloat(formData.amount),
        ...(formData.place?.trim() && { place: formData.place.trim() }),
        ...(documentId && { documentId }),
      };

      await apiClient.post('/api/adblue-logs', payload, { timeout: 60000 });
      toast.success('AdBlue entry saved');
      navigate('/adblue-tracking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit AdBlue entry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container mileage-form-page">
      <div className="mileage-form-header">
        <div className="mileage-header-left">
          <button type="button" className="mileage-back-circle" onClick={() => navigate('/adblue-tracking')}>
            <ArrowLeft size={18} />
          </button>
          <div className="mileage-header-titles">
            <h2>Log AdBlue Entry</h2>
            <p>Record AdBlue top-ups. Proof upload is optional.</p>
          </div>
        </div>
        <div className="mileage-header-icon-badge">
          <Droplet size={22} strokeWidth={1.8} />
          <span>AdBlue</span>
        </div>
      </div>

      <div className="mileage-form-content">
        <form onSubmit={handleSubmit}>
          <div className="mileage-form-row">
            <div className="mileage-form-group">
              <label>Select Vehicle *</label>
              <div className="dropdown-wrapper" style={{ zIndex: showVehicleDropdown ? 200 : undefined }}>
                <button type="button" className={`dropdown-button ${loadingVehicles ? 'disabled' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setShowVehicleDropdown(!showVehicleDropdown); setShowDriverDropdown(false); }}>
                  <span>{selectedVehicle ? selectedVehicle.name : (loadingVehicles ? 'Loading...' : 'Choose vehicle...')}</span>
                  <ChevronDown size={16} className={showVehicleDropdown ? 'rotated' : ''} />
                </button>
                {showVehicleDropdown && (
                  <div className="dropdown-menu">
                    <input type="text" placeholder="Search vehicle..." className="dropdown-search" value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
                    <div className="dropdown-list">
                      {filteredVehicles.map(v => (
                        <button key={v.id} type="button" className={`dropdown-item ${selectedVehicle?.id === v.id ? 'selected' : ''}`} onClick={() => { setSelectedVehicle(v); setShowVehicleDropdown(false); }}>
                          <div className="item-main">{v.name}</div><div className="item-sub">{v.registration}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mileage-form-group">
              <label>Select Driver *</label>
              <div className="dropdown-wrapper" style={{ zIndex: showDriverDropdown ? 200 : undefined }}>
                <button type="button" className={`dropdown-button ${loadingDrivers ? 'disabled' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setShowDriverDropdown(!showDriverDropdown); setShowVehicleDropdown(false); }}>
                  <span>{selectedDriver ? selectedDriver.name : (loadingDrivers ? 'Loading...' : 'Choose driver...')}</span>
                  <ChevronDown size={16} className={showDriverDropdown ? 'rotated' : ''} />
                </button>
                {showDriverDropdown && (
                  <div className="dropdown-menu">
                    <input type="text" placeholder="Search driver..." className="dropdown-search" value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
                    <div className="dropdown-list">
                      {filteredDrivers.map(d => (
                        <button key={d.id} type="button" className={`dropdown-item ${selectedDriver?.id === d.id ? 'selected' : ''}`} onClick={() => { setSelectedDriver(d); setShowDriverDropdown(false); }}>
                          <div className="item-main">{d.name}</div><div className="item-sub">{d.licenseNo}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mileage-form-row">
            <div className="mileage-form-group">
              <label>Litres *</label>
              <input type="number" step="any" placeholder="0.00" name="litres" value={formData.litres} onChange={handleFormChange} required />
            </div>
            <div className="mileage-form-group">
              <label>Amount *</label>
              <input type="number" step="any" placeholder="0.00" name="amount" value={formData.amount} onChange={handleFormChange} required />
            </div>
          </div>

          <div className="mileage-form-row">
            <div className="mileage-form-group">
              <label>Place</label>
              <input type="text" placeholder="Where was AdBlue added?" name="place" value={formData.place} onChange={handleFormChange} />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', marginBottom: 12, color: '#5D5D5E', fontSize: 14, fontWeight: 600 }}>
              Upload Proof / Receipt
            </label>
            <div className="mileage-slots-row">
              <SlotUpload
                title="ADBLUE RECEIPT"
                label="AdBlue slip"
                inputId="drop-adblue"
                doc={receipt}
                isScanning={ocrScanning}
                onDrop={handleDocDrop}
                onRemove={() => setReceipt(null)}
              />
            </div>
          </div>

          <div className="mileage-actions">
            <button type="button" className="mileage-btn mileage-btn-secondary" onClick={() => navigate('/adblue-tracking')}>Cancel</button>
            <button type="submit" disabled={isLoading} className="mileage-btn mileage-btn-primary">
              {isLoading ? <><CircularProgress size={16} color="inherit" style={{ marginRight: 8 }} /> Submitting</> : 'Submit AdBlue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdBlueLogPage;
