/**
 * IntakePhase Component - Phase 1 of Trip Creation
 * 
 * Handles document sorting and categorization:
 * - Slot A: End Odometer Image (1 file)
 * - Slot B: Full Tank Fuel Slip (1 file)
 * - Slot C: Weight Slips (multiple files)
 * - Slot D: Partial Fill Fuel Receipts (multiple files, optional)
 * 
 * OCR Integration:
 * - Automatically scans documents on upload
 * - Displays extracted data in real-time
 */

import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { X, Trash2, Upload, ChevronDown, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../../components/DropZone/DropZone.css';
import './IntakePhase.css';
import DropZone from '../../../components/DropZone/DropZone';
import { TripService, OCRService } from '../services';

const IntakePhase = ({
  fixedDocs,
  setFixedDocs,
  weightSlips,
  setWeightSlips,
  selectedVehicle,
  setSelectedVehicle,
  selectedDriver,
  setSelectedDriver,
  onStartProcessing,
  onCancel,
  tripId,
  isIntakeLoading
}) => {
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);

  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [vehicleError, setVehicleError] = useState(null);
  const [driverError, setDriverError] = useState(null);

  // Fetch vehicles on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      setVehicleError(null);
      try {
        const response = await TripService.getVehicles({ limit: 100 });
        
        const vehiclesList = response?.data || [];
        setVehicles(vehiclesList.map(v => ({
          id: v._id,
          name: v.registrationNumber,
          registration: `${v.vehicleType} - ${v.model || 'N/A'}`,
          type: v.vehicleType,
          model: v.model,
          status: v.status
        })));
        
        if (vehiclesList.length === 0) {
          toast.info('No vehicles found. Please add vehicles first.');
        }
      } catch (error) {
        const errorMsg = error?.message || 'Failed to fetch vehicles';
        setVehicleError(errorMsg);
        console.error('Vehicle fetch error:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  // Fetch drivers on mount
  useEffect(() => {
    const fetchDrivers = async () => {
      setLoadingDrivers(true);
      setDriverError(null);
      try {
        const response = await TripService.getDrivers({ limit: 100 });
        
        const driversList = response?.data || [];
        setDrivers(driversList.map(d => ({
          id: d._id,
          name: `${d.firstName} ${d.lastName || ''}`.trim(),
          licenseNo: d.licenseNo || 'N/A',
          phone: d.mobileNumber || 'N/A',
          status: d.status,
          email: d.email
        })));
        
        if (driversList.length === 0) {
          toast.info('No drivers found. Please add drivers first.');
        }
      } catch (error) {
        const errorMsg = error?.message || 'Failed to fetch drivers';
        setDriverError(errorMsg);
        console.error('Driver fetch error:', error);
      } finally {
        setLoadingDrivers(false);
      }
    };

    fetchDrivers();
  }, []);

  // Filter vehicles based on search
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v =>
      v.name.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.registration.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
  }, [vehicleSearch, vehicles]);

  // Filter drivers based on search
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d =>
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.licenseNo.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.phone.includes(driverSearch)
    );
  }, [driverSearch, drivers]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const vehicleDropdown = document.querySelector('.intake-selections .selection-field:first-child');
      const driverDropdown = document.querySelector('.intake-selections .selection-field:last-child');
      
      if (vehicleDropdown && !vehicleDropdown.contains(e.target)) {
        setShowVehicleDropdown(false);
      }
      if (driverDropdown && !driverDropdown.contains(e.target)) {
        setShowDriverDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // OCR Scanning States
  const [ocrScanning, setOcrScanning] = useState({
    odometer: false,
    fuel: false,
  });
  const [ocrResults, setOcrResults] = useState({
    odometer: null,
    fuel: null,
  });
  const [weightSlipOcrResults, setWeightSlipOcrResults] = useState([]); // Array matching weightSlips indices
  const [weightSlipScanning, setWeightSlipScanning] = useState([]); // Array of boolean for each slip

  // OCR Preview Modal State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [selectedOcrData, setSelectedOcrData] = useState(null);
  const [selectedOcrType, setSelectedOcrType] = useState('');

  // Handle fixed document uploads (odometer, fuel) with OCR
  const handleFixedDocDrop = useCallback(async (docType, files) => {
    if (files.length === 0) return;

    const file = files[0]; // Only accept 1 file
    if (!validateImageFile(file)) {
      toast.error('Please upload a valid image file');
      return;
    }

    // Read file for preview first
    const reader = new FileReader();
    reader.onload = async (e) => {
      // Set document with preview immediately
      setFixedDocs(prev => ({
        ...prev,
        [docType]: {
          file,
          preview: e.target.result,
          s3Url: null,
          ocrData: null,
          ocrStatus: 'scanning'
        }
      }));

      // Start OCR scanning
      setOcrScanning(prev => ({ ...prev, [docType]: true }));
      
      try {
        // Determine OCR document type
        const ocrDocType = docType === 'odometer' ? 'ODOMETER' : 'FUEL_RECEIPT';
        
        console.log(`🔍 Starting OCR scan for ${ocrDocType}...`);
        const ocrResult = await OCRService.scan(file, ocrDocType);
        
        if (ocrResult.success) {
          console.log(`✅ OCR scan successful for ${ocrDocType}:`, ocrResult.data);
          
          // Update document with OCR data
          setFixedDocs(prev => ({
            ...prev,
            [docType]: {
              ...prev[docType],
              ocrData: ocrResult.data,
              ocrStatus: 'success'
            }
          }));
          
          setOcrResults(prev => ({ ...prev, [docType]: ocrResult }));
          
          // Show success message with key data
          if (docType === 'odometer' && ocrResult.data?.reading) {
            toast.success(`Odometer reading detected: ${ocrResult.data.reading}`);
          } else if (docType === 'fuel' && ocrResult.data?.volume) {
            toast.success(`Fuel volume detected: ${ocrResult.data.volume}L`);
          } else {
            toast.success(`${docType} scanned successfully`);
          }
        } else {
          console.warn(`⚠️ OCR scan failed for ${ocrDocType}:`, ocrResult.error);
          setFixedDocs(prev => ({
            ...prev,
            [docType]: {
              ...prev[docType],
              ocrData: null,
              ocrStatus: 'error',
              ocrError: ocrResult.error
            }
          }));
          toast.warning(`OCR scan incomplete for ${docType}. You can still proceed.`);
        }
      } catch (error) {
        console.error(`❌ OCR error for ${docType}:`, error);
        setFixedDocs(prev => ({
          ...prev,
          [docType]: {
            ...prev[docType],
            ocrData: null,
            ocrStatus: 'error',
            ocrError: error.message
          }
        }));
      } finally {
        setOcrScanning(prev => ({ ...prev, [docType]: false }));
      }
    };
    reader.readAsDataURL(file);
  }, [setFixedDocs]);

  // Handle partial fill fuel receipt uploads (multiple files like weight slips)
  const handlePartialFuelDrop = useCallback((files) => {
    if (files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (!validateImageFile(file)) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      return true;
    });

    const newPartialFuels = [];
    let processed = 0;

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPartialFuels.push({
          file: {
            originalFile: file,
            preview: e.target.result,
            s3Url: null
          },
          fuelType: 'partial',
          index: (fixedDocs.partialFuel?.length || 0) + newPartialFuels.length + 1
        });

        processed++;
        if (processed === validFiles.length) {
          setFixedDocs(prev => ({
            ...prev,
            partialFuel: [...(prev.partialFuel || []), ...newPartialFuels]
          }));
          toast.success(`Added ${validFiles.length} partial fuel receipt(s)`);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [fixedDocs.partialFuel, setFixedDocs]);

  // Handle weight slip uploads (multiple)
  const handleWeightSlipsDrop = useCallback((files) => {
    if (files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (!validateImageFile(file)) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      return true;
    });

    const newSlips = [];
    let processed = 0;
    const startIndex = weightSlips.length;

    validFiles.forEach((file, fileIndex) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const slipIndex = startIndex + fileIndex;
        
        // Add slip with scanning status
        const newSlip = {
          file: {
            originalFile: file,
            preview: e.target.result,
            s3Url: null
          },
          origin: '',
          destination: '',
          weight: '',
          isDone: false,
          ocrData: null,
          ocrStatus: 'scanning'
        };
        
        newSlips.push(newSlip);
        processed++;
        
        if (processed === validFiles.length) {
          setWeightSlips(prev => [...prev, ...newSlips]);
          
          // Initialize scanning states for new slips
          setWeightSlipScanning(prev => [
            ...prev,
            ...new Array(validFiles.length).fill(true)
          ]);
          setWeightSlipOcrResults(prev => [
            ...prev,
            ...new Array(validFiles.length).fill(null)
          ]);
          
          toast.success(`Added ${validFiles.length} weight slip(s). Scanning...`);
          
          // Run OCR on all new slips
          validFiles.forEach(async (f, idx) => {
            const actualIndex = startIndex + idx;
            try {
              console.log(`🔍 Starting OCR scan for weight slip #${actualIndex + 1}...`);
              const ocrResult = await OCRService.scanWeightCert(f);
              
              if (ocrResult.success) {
                console.log(`✅ Weight slip #${actualIndex + 1} scanned:`, ocrResult.data);
                
                // Update weight slip with OCR data
                setWeightSlips(prev => {
                  const updated = [...prev];
                  if (updated[actualIndex]) {
                    // Try to get odometer reading from fixedDocs if not present in slip OCR
                    let endOdometer = ocrResult.data?.endOdometer || updated[actualIndex].endOdometer;
                    if (!endOdometer && fixedDocs?.odometer?.ocrData?.reading) {
                      endOdometer = fixedDocs.odometer.ocrData.reading;
                    }
                    updated[actualIndex] = {
                      ...updated[actualIndex],
                      ocrData: ocrResult.data,
                      ocrStatus: 'success',
                      // Autofill all available fields from OCR data
                      weight: ocrResult.data?.netWeight || ocrResult.data?.finalWeight || updated[actualIndex].weight,
                      endOdometer,
                      grossWeight: ocrResult.data?.grossWeight || updated[actualIndex].grossWeight,
                      tareWeight: ocrResult.data?.tareWeight || updated[actualIndex].tareWeight,
                      netWeight: ocrResult.data?.netWeight || updated[actualIndex].netWeight,
                      materialType: ocrResult.data?.materialType || updated[actualIndex].materialType,
                      origin: ocrResult.data?.origin || updated[actualIndex].origin,
                      destination: ocrResult.data?.destination || updated[actualIndex].destination,
                      // Add more fields as needed
                    };
                  }
                  return updated;
                });
                
                setWeightSlipOcrResults(prev => {
                  const updated = [...prev];
                  updated[actualIndex] = ocrResult;
                  return updated;
                });
                
                if (ocrResult.data?.netWeight || ocrResult.data?.grossWeight) {
                  toast.success(`Weight slip #${actualIndex + 1}: ${ocrResult.data.netWeight || ocrResult.data.grossWeight} kg detected`);
                }
              } else {
                console.warn(`⚠️ Weight slip #${actualIndex + 1} OCR failed:`, ocrResult.error);
                setWeightSlips(prev => {
                  const updated = [...prev];
                  if (updated[actualIndex]) {
                    updated[actualIndex] = {
                      ...updated[actualIndex],
                      ocrData: null,
                      ocrStatus: 'error',
                      ocrError: ocrResult.error
                    };
                  }
                  return updated;
                });
              }
            } catch (error) {
              console.error(`❌ Weight slip #${actualIndex + 1} OCR error:`, error);
              setWeightSlips(prev => {
                const updated = [...prev];
                if (updated[actualIndex]) {
                  updated[actualIndex] = {
                    ...updated[actualIndex],
                    ocrData: null,
                    ocrStatus: 'error',
                    ocrError: error.message
                  };
                }
                return updated;
              });
            } finally {
              setWeightSlipScanning(prev => {
                const updated = [...prev];
                updated[actualIndex] = false;
                return updated;
              });
            }
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, [setWeightSlips, weightSlips.length, fixedDocs]);

  // Remove fixed document
  const removeFixedDoc = useCallback((docType) => {
    setFixedDocs(prev => ({
      ...prev,
      [docType]: null
    }));
    setOcrResults(prev => ({ ...prev, [docType]: null }));
  }, [setFixedDocs]);

  // Remove partial fuel receipt
  const removePartialFuel = useCallback((index) => {
    setFixedDocs(prev => ({
      ...prev,
      partialFuel: prev.partialFuel?.filter((_, i) => i !== index) || []
    }));
  }, [setFixedDocs]);

  // Remove weight slip
  const removeWeightSlip = useCallback((index) => {
    setWeightSlips(prev => prev.filter((_, i) => i !== index));
    setWeightSlipOcrResults(prev => prev.filter((_, i) => i !== index));
    setWeightSlipScanning(prev => prev.filter((_, i) => i !== index));
  }, [setWeightSlips]);

  // Open OCR preview modal
  const openOcrPreview = useCallback((type, data) => {
    setSelectedOcrType(type);
    setSelectedOcrData(data);
    setShowOcrModal(true);
  }, []);

  return (
    <div className="intake-phase">
      {/* Vehicle & Driver Selection */}
      <div className="intake-selections">
        {/* Vehicle Dropdown */}
        <div className="selection-field">
          <label>Select Vehicle *</label>
          <div className="dropdown-wrapper">
            <button
              className="dropdown-button"
              onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
            >
              <span>{selectedVehicle ? selectedVehicle.name : 'Choose vehicle...'}</span>
              <ChevronDown size={16} className={showVehicleDropdown ? 'rotated' : ''} />
            </button>

            {showVehicleDropdown && (
              <div className="dropdown-menu">
                {loadingVehicles ? (
                  <div className="dropdown-empty">Loading vehicles...</div>
                ) : vehicleError ? (
                  <div className="dropdown-empty" style={{ color: '#e74c3c' }}>Error: {vehicleError}</div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search vehicle..."
                      className="dropdown-search"
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="dropdown-list">
                      {filteredVehicles.length > 0 ? (
                        filteredVehicles.map(vehicle => (
                          <button
                            key={vehicle.id}
                            className={`dropdown-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setShowVehicleDropdown(false);
                              setVehicleSearch('');
                              toast.success(`Vehicle selected: ${vehicle.name}`);
                            }}
                          >
                            <div className="item-main">{vehicle.name}</div>
                            <div className="item-sub">{vehicle.registration}</div>
                          </button>
                        ))
                      ) : (
                        <div className="dropdown-empty">No vehicles found</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Driver Dropdown */}
        <div className="selection-field">
          <label>Select Driver *</label>
          <div className="dropdown-wrapper">
            <button
              className="dropdown-button"
              onClick={() => setShowDriverDropdown(!showDriverDropdown)}
            >
              <span>{selectedDriver ? selectedDriver.name : 'Choose driver...'}</span>
              <ChevronDown size={16} className={showDriverDropdown ? 'rotated' : ''} />
            </button>

            {showDriverDropdown && (
              <div className="dropdown-menu">
                {loadingDrivers ? (
                  <div className="dropdown-empty">Loading drivers...</div>
                ) : driverError ? (
                  <div className="dropdown-empty" style={{ color: '#e74c3c' }}>Error: {driverError}</div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search driver..."
                      className="dropdown-search"
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="dropdown-list">
                      {filteredDrivers.length > 0 ? (
                        filteredDrivers.map(driver => (
                          <button
                            key={driver.id}
                            className={`dropdown-item ${selectedDriver?.id === driver.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowDriverDropdown(false);
                              setDriverSearch('');
                              toast.success(`Driver selected: ${driver.name}`);
                            }}
                          >
                            <div className="item-main">{driver.name}</div>
                            <div className="item-sub">{driver.licenseNo} • {driver.phone}</div>
                          </button>
                        ))
                      ) : (
                        <div className="dropdown-empty">No drivers found</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="intake-header">
        <p>Please sort your documents into the correct categories. Start with the fixed documents.</p>
      </div>

      {/* Fixed Documents Row */}
      <div className="intake-fixed-docs">
        <div className="intake-doc-slot">
          <h3>Slot A: End Odometer Image</h3>
          {!fixedDocs.odometer ? (
            <DropZone
              onDrop={(files) => handleFixedDocDrop('odometer', files)}
              acceptedFormats={['image/*']}
              maxFiles={1}
              label="Drop End Odometer Image Here"
            />
          ) : (
            <div className="document-preview-container">
              <img src={fixedDocs.odometer.preview} alt="Odometer" className="document-thumbnail" />
              
              {/* OCR Status Indicator */}
              <div className={`ocr-status-badge ${fixedDocs.odometer.ocrStatus || 'pending'}`}>
                {ocrScanning.odometer ? (
                  <><Loader2 size={14} className="spinning" /> Scanning...</>
                ) : fixedDocs.odometer.ocrStatus === 'success' ? (
                  <><CheckCircle size={14} /> OCR Done</>
                ) : fixedDocs.odometer.ocrStatus === 'error' ? (
                  <><AlertCircle size={14} /> OCR Failed</>
                ) : null}
              </div>
              
              {/* OCR Data Preview */}
              {fixedDocs.odometer.ocrData && (
                <div className="ocr-data-preview">
                  <div className="ocr-data-item">
                    <span className="ocr-label">Reading:</span>
                    <span className="ocr-value">{fixedDocs.odometer.ocrData.reading || 'N/A'}</span>
                  </div>
                  {fixedDocs.odometer.ocrData.confidence && (
                    <div className="ocr-data-item">
                      <span className="ocr-label">Confidence:</span>
                      <span className="ocr-value">{fixedDocs.odometer.ocrData.confidence}%</span>
                    </div>
                  )}
                  <button 
                    className="btn-view-ocr"
                    onClick={() => openOcrPreview('Odometer', fixedDocs.odometer.ocrData)}
                    title="View full OCR data"
                  >
                    <Eye size={14} /> Details
                  </button>
                </div>
              )}
              
              <button
                className="btn-remove"
                onClick={() => removeFixedDoc('odometer')}
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="intake-doc-slot">
          <h3>Slot B: Full Tank Fuel Slip</h3>
          {!fixedDocs.fuel ? (
            <DropZone
              onDrop={(files) => handleFixedDocDrop('fuel', files)}
              acceptedFormats={['image/*']}
              maxFiles={1}
              label="Drop Full Tank Fuel Slip Here"
            />
          ) : (
            <div className="document-preview-container">
              <img src={fixedDocs.fuel.preview} alt="Fuel Receipt" className="document-thumbnail" />
              <span className="fuel-type-badge fullTank">Full Tank</span>
              
              {/* OCR Status Indicator */}
              <div className={`ocr-status-badge ${fixedDocs.fuel.ocrStatus || 'pending'}`}>
                {ocrScanning.fuel ? (
                  <><Loader2 size={14} className="spinning" /> Scanning...</>
                ) : fixedDocs.fuel.ocrStatus === 'success' ? (
                  <><CheckCircle size={14} /> OCR Done</>
                ) : fixedDocs.fuel.ocrStatus === 'error' ? (
                  <><AlertCircle size={14} /> OCR Failed</>
                ) : null}
              </div>
              
              {/* OCR Data Preview */}
              {fixedDocs.fuel.ocrData && (
                <div className="ocr-data-preview">
                  {fixedDocs.fuel.ocrData.volume && (
                    <div className="ocr-data-item">
                      <span className="ocr-label">Volume:</span>
                      <span className="ocr-value">{fixedDocs.fuel.ocrData.volume}L</span>
                    </div>
                  )}
                  {fixedDocs.fuel.ocrData.rate && (
                    <div className="ocr-data-item">
                      <span className="ocr-label">Rate:</span>
                      <span className="ocr-value">₹{fixedDocs.fuel.ocrData.rate}/L</span>
                    </div>
                  )}
                  {fixedDocs.fuel.ocrData.location && (
                    <div className="ocr-data-item">
                      <span className="ocr-label">Location:</span>
                      <span className="ocr-value ocr-value-truncate">{fixedDocs.fuel.ocrData.location}</span>
                    </div>
                  )}
                  <button 
                    className="btn-view-ocr"
                    onClick={() => openOcrPreview('Fuel Receipt', fixedDocs.fuel.ocrData)}
                    title="View full OCR data"
                  >
                    <Eye size={14} /> Details
                  </button>
                </div>
              )}
              
              <button
                className="btn-remove"
                onClick={() => removeFixedDoc('fuel')}
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Weight Slips Section */}
      <div className="intake-weight-slips">
        <div className="weight-slips-header">
          <h2>Slot C: Weight Slips</h2>
          <span className="counter">{weightSlips.length} files</span>
        </div>

        {/* Weight Slips List */}
        {weightSlips.length > 0 && (
          <div className="weight-slips-grid">
            {weightSlips.map((slip, index) => (
              <div key={index} className="weight-slip-item">
                <div className="slip-thumbnail-container">
                  <img src={slip.file.preview} alt={`Slip ${index + 1}`} className="slip-thumbnail" />
                  <div className="slip-index">#{index + 1}</div>
                  
                  {/* OCR Status Indicator for Weight Slips */}
                  <div className={`slip-ocr-status ${slip.ocrStatus || 'pending'}`}>
                    {weightSlipScanning[index] ? (
                      <Loader2 size={12} className="spinning" />
                    ) : slip.ocrStatus === 'success' ? (
                      <CheckCircle size={12} />
                    ) : slip.ocrStatus === 'error' ? (
                      <AlertCircle size={12} />
                    ) : null}
                  </div>
                  
                  {/* Weight Preview if OCR successful */}
                  {slip.ocrData && (slip.ocrData.netWeight || slip.ocrData.grossWeight) && (
                    <div className="slip-weight-preview">
                      {slip.ocrData.netWeight ? `${slip.ocrData.netWeight} kg` : `G: ${slip.ocrData.grossWeight} kg`}
                    </div>
                  )}
                  
                  <button
                    className="btn-view-slip-ocr"
                    onClick={() => openOcrPreview(`Weight Slip #${index + 1}`, slip.ocrData)}
                    title="View OCR data"
                    disabled={!slip.ocrData}
                  >
                    <Eye size={14} />
                  </button>
                  
                  <button
                    className="btn-remove-slip"
                    onClick={() => removeWeightSlip(index)}
                    title="Remove"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compact Upload Area */}
        <div className="compact-upload-zone">
          <DropZone
            onDrop={handleWeightSlipsDrop}
            acceptedFormats={['image/*']}
            multiple={true}
            label={weightSlips.length === 0 ? "Drop weight slips here or click to upload" : "Add more weight slips"}
            isCompact={true}
          />
        </div>
      </div>

      {/* Partial Fill Fuel Receipts Section */}
      <div className="intake-partial-fuel">
        <div className="partial-fuel-header">
          <h2>Slot D: Partial Fill Fuel (Optional)</h2>
          <span className="counter">{fixedDocs.partialFuel?.length || 0} files</span>
        </div>

        {fixedDocs.partialFuel && fixedDocs.partialFuel.length > 0 && (
          <div className="partial-fuel-grid">
            {fixedDocs.partialFuel.map((fuel, index) => (
              <div key={index} className="partial-fuel-item">
                <div className="fuel-thumbnail-container">
                  <img src={fuel.file.preview} alt={`Partial Fuel ${fuel.index}`} className="fuel-thumbnail" />
                  <div className="fuel-index">Partial #{fuel.index}</div>
                  <button
                    className="btn-remove-fuel"
                    onClick={() => removePartialFuel(index)}
                    title="Remove"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compact Upload Area */}
        <div className="compact-upload-zone">
          <DropZone
            onDrop={handlePartialFuelDrop}
            acceptedFormats={['image/*']}
            multiple={true}
            label={(fixedDocs.partialFuel?.length || 0) === 0 ? "Drop partial fuel receipts here or click to upload" : "Add more partial fuel receipts"}
            isCompact={true}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="intake-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button 
          className="btn btn-primary" 
          onClick={onStartProcessing}
          disabled={isIntakeLoading || ocrScanning.odometer || ocrScanning.fuel || weightSlipScanning.some(s => s)}
        >
          {isIntakeLoading
            ? 'Initializing Trip...'
            : (ocrScanning.odometer || ocrScanning.fuel || weightSlipScanning.some(s => s))
              ? 'Scanning Documents...'
              : 'Start Processing'}
        </button>
      </div>

      {/* OCR Data Preview Modal */}
      {showOcrModal && selectedOcrData && (
        <div className="ocr-modal-overlay" onClick={() => setShowOcrModal(false)}>
          <div className="ocr-modal" onClick={e => e.stopPropagation()}>
            <div className="ocr-modal-header">
              <h3>{selectedOcrType} - OCR Data</h3>
              <button className="ocr-modal-close" onClick={() => setShowOcrModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ocr-modal-body">
              {Object.entries(selectedOcrData).map(([key, value]) => (
                value !== null && value !== undefined && (
                  <div key={key} className="ocr-modal-row">
                    <span className="ocr-modal-key">{formatOcrKey(key)}</span>
                    <span className="ocr-modal-value">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                )
              ))}
            </div>
            <div className="ocr-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowOcrModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Format OCR key to human-readable label
 */
function formatOcrKey(key) {
  const keyMap = {
    reading: 'Reading',
    confidence: 'Confidence',
    sharpness: 'Sharpness',
    qualityIssues: 'Quality Issues',
    location: 'Location',
    datetime: 'Date/Time',
    vehicleNo: 'Vehicle No',
    volume: 'Volume (L)',
    rate: 'Rate (₹/L)',
    documentType: 'Document Type',
    date: 'Date',
    grossWeight: 'Gross Weight (kg)',
    tareWeight: 'Tare Weight (kg)',
    netWeight: 'Net Weight (kg)',
    finalWeight: 'Final Weight (kg)',
    missingFields: 'Missing Fields',
    status: 'Status',
  };
  return keyMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

/**
 * Validate that file is a valid image
 */
function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const isValidType = validTypes.includes(file.type);
  const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  return isValidType && isValidExtension && file.size <= 10 * 1024 * 1024; // 10MB max
}

export default IntakePhase;
