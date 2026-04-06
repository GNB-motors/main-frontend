import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CircularProgress } from '@mui/material';
import { ChevronDown, Trash2, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import { TripService, OCRService } from '../Trip/services';
import './MileageTracking.css';

/* ── UI Icons ── */
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

/* ── Dropzone Slot ── */
const SlotUpload = ({ docType, title, label, inputId, required, doc, isScanning, onDrop, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onDrop(docType, files);
  };
  const hasData = !!doc;

  return (
    <div className="modern-document-slot">
      <div className="slot-header">
        <h3>{title}{required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}</h3>
      </div>
      <input type="file" id={inputId} accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) { onDrop(docType, [e.target.files[0]]); e.target.value = ''; } }} />
      {!hasData ? (
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
                  : <><Loader2 size={13} className="spinning" /> Scanning...</>}
              </div>
              <div className="slot-actions">
                <label htmlFor={inputId} className="slot-action-btn edit" style={{ cursor: 'pointer' }}>Replace</label>
                <button className="slot-action-btn delete" onClick={(e) => { e.preventDefault(); onRemove(docType); }}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Form Page ── */
const MileageFuelLogPage = () => {
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
    const [lastOdometer, setLastOdometer] = useState(null);
    const [loadingLastOdometer, setLoadingLastOdometer] = useState(false);
    const [formData, setFormData] = useState({ fuelType: 'DIESEL', fillingType: 'PARTIAL', litres: '', rate: '', odometerReading: '', location: '' });
    const [fixedDocs, setFixedDocs] = useState({ fuel: null, odometer: null });
    const [ocrScanning, setOcrScanning] = useState({ fuel: false, odometer: false });

    useEffect(() => {
        const el = document.querySelector('.page-content');
        if (el) el.classList.add('no-padding');
        return () => { if (el) el.classList.remove('no-padding'); };
    }, []);

    useEffect(() => {
        if (!selectedVehicle) { setLastOdometer(null); return; }
        const fetchOdo = async () => {
            setLoadingLastOdometer(true);
            try { const res = await apiClient.get(`/api/mileage/last-odometer/${selectedVehicle.id}`); setLastOdometer(res.data?.data || null); }
            catch (err) { console.error("Failed to fetch last odometer", err); }
            finally { setLoadingLastOdometer(false); }
        };
        fetchOdo();
    }, [selectedVehicle]);

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
                const vList = vehRes?.data || [];
                setVehicles(vList.map(v => ({ id: v._id, name: v.registrationNumber, registration: `${v.vehicleType} - ${v.model || 'N/A'}` })));
                const dList = drvRes?.data || [];
                setDrivers(dList.map(d => ({ id: d._id, name: `${d.firstName} ${d.lastName || ''}`.trim(), licenseNo: d.licenseNo || 'N/A' })));
            } catch { toast.error('Failed to load drivers and vehicles'); }
            finally { setLoadingVehicles(false); setLoadingDrivers(false); }
        };
        fetchDeps();
    }, []);

    const filteredVehicles = useMemo(() => vehicles.filter(v =>
        v.name.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.registration.toLowerCase().includes(vehicleSearch.toLowerCase())
    ), [vehicleSearch, vehicles]);

    const filteredDrivers = useMemo(() => drivers.filter(d =>
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) || d.licenseNo.toLowerCase().includes(driverSearch.toLowerCase())
    ), [driverSearch, drivers]);

    const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleDocDrop = useCallback(async (docType, files) => {
        if (files.length === 0) return;
        const file = files[0];
        if (!validateImageFile(file)) { toast.error('Valid image required (JPG, PNG, WEBP)'); return; }
        const reader = new FileReader();
        reader.onload = async (e) => {
            setFixedDocs(prev => ({ ...prev, [docType]: { file, preview: e.target.result, ocrStatus: 'scanning' } }));
            setOcrScanning(prev => ({ ...prev, [docType]: true }));
            try {
                const ocrDocType = docType === 'odometer' ? 'ODOMETER' : 'FUEL_RECEIPT';
                const ocrResult = await OCRService.scan(file, ocrDocType);
                if (ocrResult.success) {
                    const data = ocrResult.data;
                    setFixedDocs(prev => ({ ...prev, [docType]: { ...prev[docType], ocrData: data, ocrStatus: 'success' } }));
                    if (docType === 'fuel' && data.volume) {
                        setFormData(prev => ({ ...prev, litres: data.volume, rate: data.rate || prev.rate, location: data.location || prev.location }));
                        toast.success(`Autofilled Volume: ${data.volume}L`);
                    } else if (docType === 'odometer' && data.reading) {
                        const numericReading = parseFloat(data.reading.toString().replace(/[^\d.]/g, ''));
                        if (!isNaN(numericReading)) { setFormData(prev => ({ ...prev, odometerReading: numericReading })); toast.success(`Autofilled Odometer: ${numericReading}`); }
                        else { toast.warning(`Could not parse odometer value. Please enter manually.`); }
                    }
                } else {
                    setFixedDocs(prev => ({ ...prev, [docType]: { ...prev[docType], ocrStatus: 'error' } }));
                    toast.warning(`OCR Failed. Please enter values manually.`);
                }
            } catch { setFixedDocs(prev => ({ ...prev, [docType]: { ...prev[docType], ocrStatus: 'error' } })); }
            finally { setOcrScanning(prev => ({ ...prev, [docType]: false })); }
        };
        reader.readAsDataURL(file);
    }, []);

    const removeDoc = useCallback((docType) => { setFixedDocs(prev => ({ ...prev, [docType]: null })); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVehicle || !selectedDriver) return toast.error("Please select a vehicle and a driver.");
        if (!fixedDocs.fuel) return toast.error("Fuel Slip is required.");
        if (formData.fillingType === 'FULL_TANK' && !fixedDocs.odometer) return toast.error("Odometer Image is required for FULL TANK logs.");
        const currentOdo = parseFloat(formData.odometerReading);
        if (formData.fillingType === 'FULL_TANK' && lastOdometer && lastOdometer.odometerReading) {
            if (currentOdo <= lastOdometer.odometerReading) return toast.error(`Odometer reading must be strictly greater than the previous reading (${lastOdometer.odometerReading} km)`);
        }
        setIsLoading(true);
        try {
            const fuelData = new FormData();
            fuelData.append('file', fixedDocs.fuel.file); fuelData.append('docType', 'FUEL_SLIP');
            fuelData.append('entityType', 'VEHICLE'); fuelData.append('entityId', selectedVehicle.id);
            const fuelRes = await apiClient.post('/api/documents', fuelData, { headers: { 'Content-Type': 'multipart/form-data' } });
            let odoDocId = '';
            if (fixedDocs.odometer) {
                const odoData = new FormData();
                odoData.append('file', fixedDocs.odometer.file); odoData.append('docType', 'ODOMETER');
                odoData.append('entityType', 'VEHICLE'); odoData.append('entityId', selectedVehicle.id);
                const odoRes = await apiClient.post('/api/documents', odoData, { headers: { 'Content-Type': 'multipart/form-data' } });
                odoDocId = odoRes.data.data?._id || odoRes.data._id || '';
            }
            const payload = {
                ...formData, vehicleId: selectedVehicle.id, driverId: selectedDriver.id,
                documentId: fuelRes.data.data?._id || fuelRes.data._id || '', odometerDocId: odoDocId,
                litres: parseFloat(formData.litres), rate: parseFloat(formData.rate),
                odometerReading: formData.odometerReading ? parseInt(formData.odometerReading, 10) : undefined
            };
            await apiClient.post('/api/mileage/fuel-log', payload);
            toast.success('Mileage log submitted successfully!');
            navigate('/mileage-tracking');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit log.'); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="page-container mileage-form-page">
            <div className="mileage-form-header">
                <button className="back-btn" onClick={() => navigate('/mileage-tracking')}>
                    <ArrowLeft size={18} /> <span>Back to Mileage Tracking</span>
                </button>
                <h2>Log Fuel Entry</h2>
                <p>Fill in the fuel details and upload supporting documents.</p>
            </div>

            <div className="mileage-form-content">
                <form onSubmit={handleSubmit}>
                    {/* Vehicle & Driver */}
                    <div className="mileage-form-row">
                        <div className="mileage-form-group">
                            <label>Select Vehicle *</label>
                            <div className="dropdown-wrapper">
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
                            {selectedVehicle && (
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {loadingLastOdometer ? <><Loader2 size={12} className="spinning"/> Fetching prior logs...</>
                                        : lastOdometer ? <span><b>Previous Odometer:</b> {lastOdometer.odometerReading} km <span style={{ color: '#94a3b8' }}>({new Date(lastOdometer.refuelTime).toLocaleDateString()})</span></span>
                                        : <span>No prior FULL_TANK logs found. Starting fresh.</span>}
                                </div>
                            )}
                        </div>
                        <div className="mileage-form-group">
                            <label>Select Driver *</label>
                            <div className="dropdown-wrapper">
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

                    {/* Fuel & Filling Type */}
                    <div className="mileage-form-row">
                        <div className="mileage-form-group">
                            <label>Fuel Type</label>
                            <select name="fuelType" value={formData.fuelType} onChange={handleFormChange}>
                                <option value="DIESEL">Diesel</option>
                                <option value="ADBLUE">AdBlue</option>
                            </select>
                        </div>
                        <div className="mileage-form-group">
                            <label>Filling Type</label>
                            <select name="fillingType" value={formData.fillingType} onChange={handleFormChange}>
                                <option value="PARTIAL">Partial Fill</option>
                                <option value="FULL_TANK">Full Tank (Closes Mileage Interval)</option>
                            </select>
                        </div>
                    </div>

                    {/* Litres & Rate */}
                    <div className="mileage-form-row">
                        <div className="mileage-form-group">
                            <label>Litres *</label>
                            <input type="number" step="any" placeholder="0.00" name="litres" value={formData.litres} onChange={handleFormChange} required />
                        </div>
                        <div className="mileage-form-group">
                            <label>Rate Per Litre *</label>
                            <input type="number" step="any" placeholder="0.00" name="rate" value={formData.rate} onChange={handleFormChange} required />
                        </div>
                    </div>

                    {/* Odometer & Location */}
                    <div className="mileage-form-row">
                        {formData.fillingType === 'FULL_TANK' && (
                        <div className="mileage-form-group">
                            <label>Odometer Reading (KM) *</label>
                            <input type="number" placeholder="105450" name="odometerReading" value={formData.odometerReading} onChange={handleFormChange} required />
                        </div>
                        )}
                        <div className="mileage-form-group">
                            <label>Location</label>
                            <input type="text" placeholder="E.g. Reliance Pump" name="location" value={formData.location} onChange={handleFormChange} />
                        </div>
                    </div>

                    {/* Documents */}
                    <div style={{ marginTop: 8 }}>
                        <label style={{ display: 'block', marginBottom: 12, color: '#5D5D5E', fontSize: 14, fontWeight: 600 }}>Upload Documents</label>
                        <div className="mileage-slots-row">
                            <SlotUpload docType="fuel" title="FUEL RECEIPT" label="fuel slip" inputId="drop-fuel" required doc={fixedDocs.fuel} isScanning={ocrScanning.fuel} onDrop={handleDocDrop} onRemove={removeDoc} />
                            {formData.fillingType === 'FULL_TANK' && (
                                <SlotUpload docType="odometer" title="END ODOMETER IMAGE" label="odometer image" inputId="drop-odometer" required doc={fixedDocs.odometer} isScanning={ocrScanning.odometer} onDrop={handleDocDrop} onRemove={removeDoc} />
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="mileage-actions">
                        <button type="button" className="mileage-btn mileage-btn-secondary" onClick={() => navigate('/mileage-tracking')}>Cancel</button>
                        <button type="submit" disabled={isLoading} className="mileage-btn mileage-btn-primary">
                            {isLoading ? <><CircularProgress size={16} color="inherit" style={{ marginRight: 8 }} /> Submitting</> : 'Submit Fuel Log'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MileageFuelLogPage;
