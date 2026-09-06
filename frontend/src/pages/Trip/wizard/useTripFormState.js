/**
 * useTripFormState Hook
 *
 * Holds all state, data-loading effects, and handlers for the trip form
 * wizard (TripFormPage): form fields, document upload/OCR pipeline, fuel
 * receipts, expenses, and the start/end trip submit logic.
 *
 * This logic was moved verbatim out of TripFormPage.jsx as part of the
 * 3-step wizard split (Workstream 0.10); none of the behaviour, validation
 * rules, or payload shapes changed.
 *
 * @param {Object} options
 * @param {boolean} options.isEditMode - Whether an existing trip is being edited
 * @param {string|undefined} options.tripId - Route param for edit mode
 * @param {Function} options.navigate - react-router navigate (used after save/end)
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { DriverService } from '../../Drivers/DriverService.jsx';
import { VehicleService } from '../../Profile/VehicleService.jsx';
import { DocumentService, TripService } from '../services';
import { getVehicleRegistration, getDriverName } from '../../../utils/dataFormatters';
import { getProfileField } from '../../../utils/session.js';

const useTripFormState = ({ isEditMode, tripId, navigate }) => {
  const [existingTrip, setExistingTrip] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const isCompletedTrip = existingTrip && existingTrip.status === 'COMPLETED';

  // Form data state
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    payload: '',
    date: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    driver: '',
  });

  // Manual input states for documents
  const [manualOdometerStart, setManualOdometerStart] = useState('');
  const [showManualOdometer, setShowManualOdometer] = useState(false);
  const [manualPayload, setManualPayload] = useState('');
  const [noSlipId, setNoSlipId] = useState(false);
  const [manualOdometerEnd, setManualOdometerEnd] = useState('');
  const [showManualOdometerEnd, setShowManualOdometerEnd] = useState(false);

  // Document upload states
  const [startDocs, setStartDocs] = useState({
    odometerStart: { file: null, preview: null, ocrData: null },
    weighInSlip: { file: null, preview: null, ocrData: null },
  });

  const [fuelReceipts, setFuelReceipts] = useState([]);

  const [endDocs, setEndDocs] = useState({
    odometerEnd: { file: null, preview: null, ocrData: null },
    proofOfDelivery: { file: null, preview: null, ocrData: null },
  });

  // Expenses state
  const [expenses, setExpenses] = useState({
    materialCost: '',
    toll: '',
    driverCost: '',
    driverTripExpense: '',
    royalty: '',
  });

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);

  // Dropdown options
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [, setLoadingDropdowns] = useState(false);
  const [, setDropdownError] = useState(null);
  const [, setUploadingDocs] = useState({});
  // Whether uploading is allowed: either editing an existing trip or a vehicle is selected
  const canUpload = isEditMode || Boolean(formData.vehicleNo);

  // Expenses modal state
  const [showExpensesModal, setShowExpensesModal] = useState(false);

  // Image cropper state
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    imageSrc: null,
    section: null,
    field: null,
    originalFile: null,
    receiptId: null, // For fuel receipts
    receiptType: null, // 'diesel' or 'adblue'
  });

  /**
   * Load existing trip data when in edit mode
   * Pre-fills form fields and documents for editing
   */
  useEffect(() => {
    if (isEditMode && tripId) {
      loadTripData();
    }
  }, [isEditMode, tripId]);

  const loadTripData = async () => {
    setLoadingTrip(true);
    try {
      const response = await TripService.getTripById(tripId);
      const trip = response.data;
      setExistingTrip(trip);

      // Pre-fill form data - handle both object and string formats for vehicle/driver
      setFormData({
        source: trip.routeSource || '',
        destination: trip.routeDestination || '',
        payload: trip.weighInWeight || '',
        date: trip.startTime ? new Date(trip.startTime).toISOString().split('T')[0] : '',
        vehicleNo: getVehicleRegistration(trip.journeyId?.vehicleId || trip.vehicleId) || '',
        driver: getDriverName(trip.journeyId?.driverId || trip.driverId) || '',
      });

      // Load start odometer reading if available
      if (trip.startOdometer) {
        setManualOdometerStart(trip.startOdometer.toString());
        setShowManualOdometer(true);
        setStartDocs((prev) => ({
          ...prev,
          odometerStart: {
            file: null,
            preview: null,
            ocrData: { reading: trip.startOdometer.toString() },
          },
        }));
      }

      // Load weigh-in weight if available
      if (trip.weighInWeight) {
        setManualPayload(trip.weighInWeight);
        setNoSlipId(true);
      }

      // Load end odometer reading if available
      if (trip.endOdometer) {
        setManualOdometerEnd(trip.endOdometer.toString());
        setShowManualOdometerEnd(true);
        setEndDocs((prev) => ({
          ...prev,
          odometerEnd: {
            file: null,
            preview: null,
            ocrData: { reading: trip.endOdometer.toString() },
          },
        }));
      }
    } catch (error) {
      console.error('Failed to load trip:', error);
      toast.error('Failed to load trip details');
    } finally {
      setLoadingTrip(false);
    }
  };

  /**
   * Load drivers first, then vehicles. When entering Add Trip (not edit mode)
   * we will auto-select the first fetched driver and, if that driver has an
   * assigned vehicle, prefill the vehicle dropdown.
   */
  useEffect(() => {
    let mounted = true;
    const businessRefId = getProfileField('business_ref_id') || null;

    const fetchDropdowns = async () => {
      setLoadingDropdowns(true);
      setDropdownError(null);
      try {
        // Fetch drivers (employees)
        const resp = await DriverService.getAllDrivers(businessRefId);

        // Normalize drivers list
        let items = [];
        if (Array.isArray(resp)) items = resp;
        else if (resp && Array.isArray(resp.data)) items = resp.data;
        else if (resp && resp.data && Array.isArray(resp.data.data)) items = resp.data.data;

        const normalizedDrivers = (items || []).map((d) => ({
          ...d,
          id: d.id || d._id || d._id,
          firstName: d.firstName || d.first_name || '',
          lastName: d.lastName || d.last_name || '',
          name:
            d.name ||
            `${(d.firstName || d.first_name || '').trim()} ${(d.lastName || d.last_name || '').trim()}`.trim(),
          // optional: vehicle assignment field name variations
          vehicle_registration_no:
            d.vehicle_registration_no ||
            d.vehicleRegistrationNumber ||
            d.assigned_vehicle ||
            d.assignedVehicle ||
            null,
        }));

        if (!mounted) return;
        setDrivers(normalizedDrivers);

        // After drivers are fetched, fetch vehicles
        const vehiclesResp = await DriverService.getAvailableVehicles(businessRefId);
        let vitems = [];
        if (Array.isArray(vehiclesResp)) vitems = vehiclesResp;
        else if (vehiclesResp && Array.isArray(vehiclesResp.data)) vitems = vehiclesResp.data;
        else if (vehiclesResp && vehiclesResp.data && Array.isArray(vehiclesResp.data.data))
          vitems = vehiclesResp.data.data;

        const normalizedVehicles = (vitems || []).map((v) => ({
          id: v.id || v._id || v._id,
          number:
            v.registrationNumber || v.registration_no || v.registration_no || v.registrationNumber,
          model: v.model || v.vehicleType || v.vehicle_type || v.model || '',
        }));

        if (!mounted) return;
        setVehicles(normalizedVehicles);

        // Do not auto-select driver or vehicle - let user choose
      } catch (err) {
        console.error('Failed to load drivers/vehicles for trip form:', err);
        if (mounted) setDropdownError(err?.detail || 'Could not load employees or vehicles.');
      } finally {
        if (mounted) setLoadingDropdowns(false);
      }
    };

    fetchDropdowns();

    return () => {
      mounted = false;
    };
  }, [isEditMode]);

  /**
   * Handle form input changes
   * @param {string} field - The form field name
   * @param {string} value - The new value
   */
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle single fuel receipt file change for an existing receipt card
  const handleFuelReceiptUpload = (receiptId, file) => {
    if (!file) return;
    if (!canUpload) {
      const msg = 'Select a vehicle to enable uploads';
      toast.warn(msg);
      setFuelReceipts((prev) =>
        prev.map((r) => (r.id === receiptId ? { ...r, uploadError: msg } : r)),
      );
      return;
    }

    // Find the receipt type
    const receipt = fuelReceipts.find((r) => r.id === receiptId);
    if (!receipt) return;

    // Open cropper with the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperState({
        isOpen: true,
        imageSrc: reader.result,
        section: 'fuel',
        field: null,
        originalFile: file,
        receiptId: receiptId,
        receiptType: receipt.type,
      });
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle single document file upload
   * Opens image cropper first, then processes the cropped image
   * @param {string} section - 'start' or 'end' documents
   * @param {string} field - Specific document field name
   * @param {File} file - The uploaded file object
   */
  const handleFileUpload = (section, field, file) => {
    if (!file) return;
    if (!canUpload) {
      const message = 'Please select a vehicle to upload documents';
      toast.warn(message);
      if (section === 'start') {
        setStartDocs((prev) => ({
          ...prev,
          [field]: { ...(prev[field] || {}), uploadError: message },
        }));
      } else {
        setEndDocs((prev) => ({
          ...prev,
          [field]: { ...(prev[field] || {}), uploadError: message },
        }));
      }
      return;
    }

    // Open cropper with the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperState({
        isOpen: true,
        imageSrc: reader.result,
        section,
        field,
        originalFile: file,
      });
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle cropped image from the cropper
   * Process the cropped blob and upload to backend
   */
  const handleCropComplete = async (croppedBlob) => {
    const { section, field, originalFile, receiptId } = cropperState;

    if (!croppedBlob || !section) return;

    // Convert blob to file with original filename
    const croppedFile = new File([croppedBlob], originalFile.name, {
      type: croppedBlob.type || 'image/jpeg',
    });

    // Create preview URL
    const previewUrl = URL.createObjectURL(croppedBlob);

    // Handle fuel receipts separately
    if (section === 'fuel' && receiptId) {
      setFuelReceipts((prev) =>
        prev.map((r) =>
          r.id === receiptId
            ? { ...r, file: croppedFile, preview: previewUrl, ocrData: null, uploadError: null }
            : r,
        ),
      );

      // Close cropper
      setCropperState({
        isOpen: false,
        imageSrc: null,
        section: null,
        field: null,
        originalFile: null,
        receiptId: null,
        receiptType: null,
      });

      // Upload fuel receipt to backend
      const selectedVehicle = vehicles.find((v) => v.number === formData.vehicleNo);
      let entityType = null;
      let entityId = null;
      if (selectedVehicle && selectedVehicle.id) {
        entityType = 'VEHICLE';
        entityId = selectedVehicle.id;
      } else if (isEditMode && existingTrip && (existingTrip.id || existingTrip._id)) {
        entityType = 'TRIP';
        entityId = existingTrip._id || existingTrip.id;
      }

      try {
        const uploaded = await DocumentService.uploadDocument({
          file: croppedFile,
          entityType,
          entityId,
          docType: 'FUEL_RECEIPT',
        });

        console.log('Fuel receipt upload response:', uploaded);

        // Update fuel receipt with OCR data and public URL from backend
        setFuelReceipts((prev) =>
          prev.map((r) =>
            r.id === receiptId
              ? {
                  ...r,
                  preview: uploaded.publicUrl || previewUrl,
                  uploaded: true,
                  documentMeta: uploaded,
                  ocrData: uploaded.ocrData || null,
                }
              : r,
          ),
        );

        if (uploaded.ocrData) {
          toast.success('Fuel receipt uploaded and processed successfully!');
        } else {
          toast.success('Fuel receipt uploaded successfully!');
        }
      } catch (err) {
        console.error('Failed to upload fuel receipt:', err);
        toast.error(err?.detail || err?.message || 'Upload failed');
        setFuelReceipts((prev) =>
          prev.map((r) =>
            r.id === receiptId
              ? { ...r, uploadError: err?.detail || err?.message || 'Upload failed' }
              : r,
          ),
        );
      }

      return;
    }

    // Handle regular documents (start/end documents)
    if (!field) return;

    // Update state with cropped image
    if (section === 'start') {
      setStartDocs((prev) => ({
        ...prev,
        [field]: { ...(prev[field] || {}), file: croppedFile, preview: previewUrl, ocrData: null },
      }));
    } else if (section === 'end') {
      setEndDocs((prev) => ({
        ...prev,
        [field]: { ...(prev[field] || {}), file: croppedFile, preview: previewUrl, ocrData: null },
      }));
    }

    // Close cropper
    setCropperState({
      isOpen: false,
      imageSrc: null,
      section: null,
      field: null,
      originalFile: null,
      receiptId: null,
      receiptType: null,
    });

    // Upload to backend
    const docKey = `${section}.${field}`;
    const docTypeMap = {
      odometerStart: 'ODOMETER',
      odometerEnd: 'ODOMETER',
      weighInSlip: 'WEIGH_IN_SLIP',
      proofOfDelivery: 'PROOF_OF_DELIVERY',
    };

    const docType = docTypeMap[field] || 'GENERAL';

    // Determine entity: prefer selected vehicle; fall back to existing trip id when editing
    const selectedVehicle = vehicles.find((v) => v.number === formData.vehicleNo);
    let entityType = null;
    let entityId = null;
    if (selectedVehicle && selectedVehicle.id) {
      entityType = 'VEHICLE';
      entityId = selectedVehicle.id;
    } else if (isEditMode && existingTrip && (existingTrip.id || existingTrip._id)) {
      entityType = 'TRIP';
      entityId = existingTrip._id || existingTrip.id;
    }

    // Upload document to backend
    try {
      setUploadingDocs((prev) => ({ ...prev, [docKey]: true }));
      const uploaded = await DocumentService.uploadDocument({
        file: croppedFile,
        entityType,
        entityId,
        docType,
      });

      console.log('Upload response:', uploaded);

      // Save returned document metadata with OCR data and public URL
      const docMeta = {
        file: croppedFile,
        preview: uploaded.publicUrl || previewUrl, // Use server's public URL
        uploaded: true,
        documentMeta: uploaded,
        ocrData: uploaded.ocrData || null, // Extract OCR data from response
      };

      if (section === 'start') {
        setStartDocs((prev) => ({ ...prev, [field]: docMeta }));
      } else {
        setEndDocs((prev) => ({ ...prev, [field]: docMeta }));
      }

      // Show success message with OCR data if available
      if (uploaded.ocrData) {
        toast.success('Document uploaded and processed successfully!');
      } else {
        toast.success('Document uploaded successfully!');
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
      toast.error(err?.detail || err?.message || 'Upload failed');
      const withError = {
        ...(section === 'start' ? startDocs[field] : endDocs[field]),
        uploadError: err?.detail || err?.message || 'Upload failed',
      };
      if (section === 'start') setStartDocs((prev) => ({ ...prev, [field]: withError }));
      else setEndDocs((prev) => ({ ...prev, [field]: withError }));
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docKey]: false }));
    }
  };

  /**
   * Handle cropper cancel
   */
  const handleCropperCancel = () => {
    setCropperState({
      isOpen: false,
      imageSrc: null,
      section: null,
      field: null,
      originalFile: null,
      receiptId: null,
      receiptType: null,
    });
  };

  /**
   * Handle multiple fuel receipt uploads
   * Allows batch uploading of fuel receipts (diesel/adblue)
   * Automatically triggers OCR processing for each file
   * @param {FileList} files - Array of uploaded files
   * @param {string} type - 'diesel' or 'adblue'
   */
  const handleMultipleFuelReceipts = (files, type) => {
    if (!files || files.length === 0) return;
    if (!canUpload) {
      const msg = 'Please select a vehicle to upload documents';
      toast.warn(msg);
      return;
    }

    const newReceipts = Array.from(files).map((file, index) => {
      const newId = Date.now() + index;
      const reader = new FileReader();

      reader.onloadend = () => {
        setFuelReceipts((prev) =>
          prev.map((receipt) =>
            receipt.id === newId ? { ...receipt, preview: reader.result } : receipt,
          ),
        );
        // Trigger OCR processing
        processOCR('fuel', type, newId);
      };
      reader.readAsDataURL(file);

      return {
        id: newId,
        type,
        file,
        preview: null,
        ocrData: null,
      };
    });

    setFuelReceipts((prev) => [...prev, ...newReceipts]);
  };

  /**
   * Remove a fuel receipt from the list
   * @param {number} id - The receipt ID to remove
   */
  const removeFuelReceipt = (id) => {
    setFuelReceipts((prev) => prev.filter((receipt) => receipt.id !== id));
  };

  /**
   * Simulate OCR processing for uploaded documents
   * TODO: Replace with actual OCR API integration
   * @param {string} section - 'start', 'end', or 'fuel'
   * @param {string} field - Document field name
   * @param {number} receiptId - Fuel receipt ID (for fuel receipts only)
   */
  const processOCR = async (section, field, receiptId = null) => {
    setIsProcessing(true);
    try {
      // Helper to get selected entity id/type
      const selectedVehicle = vehicles.find((v) => v.number === formData.vehicleNo);
      const entity = selectedVehicle
        ? { entityType: 'VEHICLE', entityId: selectedVehicle.id }
        : isEditMode && existingTrip
          ? { entityType: 'TRIP', entityId: existingTrip._id || existingTrip.id }
          : null;

      // Processing for fuel receipts
      if (section === 'fuel' && receiptId) {
        const receipt = fuelReceipts.find((r) => r.id === receiptId);
        if (!receipt) throw new Error('Receipt not found');

        let docMeta = receipt.documentMeta;

        // If not uploaded yet, try to upload (will work even without an entity)
        if (!docMeta && receipt.file) {
          const uploaded = await DocumentService.uploadDocument({
            file: receipt.file,
            entityType: entity?.entityType,
            entityId: entity?.entityId,
            docType: receipt.type === 'diesel' ? 'FUEL_RECEIPT' : 'FUEL_RECEIPT',
          });
          docMeta = uploaded;
          setFuelReceipts((prev) =>
            prev.map((r) =>
              r.id === receiptId ? { ...r, uploaded: true, documentMeta: uploaded } : r,
            ),
          );
        }

        // If we have a document id/meta, attempt server-side processing
        let ocrData = null;
        const docId = docMeta && (docMeta.id || docMeta._id || docMeta.documentId);
        if (docId) {
          const resp = await DocumentService.processDocument(docId);
          ocrData = resp?.ocr || resp?.data || resp;
        }

        // Fallback: if server didn't return OCR, keep existing mock behavior
        if (!ocrData) {
          ocrData =
            receipt.type === 'diesel'
              ? { quantity: '120', amount: '11460', date: new Date().toISOString().split('T')[0] }
              : { quantity: '10', amount: '450', date: new Date().toISOString().split('T')[0] };
        }

        setFuelReceipts((prev) => prev.map((r) => (r.id === receiptId ? { ...r, ocrData } : r)));
        return;
      }

      // Processing for start/end single documents
      const targetDocs = section === 'start' ? startDocs : endDocs;
      const doc = targetDocs[field];
      if (!doc) throw new Error('Document not found');

      let docMeta = doc.documentMeta;
      // If not uploaded, try upload (allow uploads without entity; server may store pending docs)
      if (!docMeta && doc.file) {
        const uploaded = await DocumentService.uploadDocument({
          file: doc.file,
          entityType: entity?.entityType,
          entityId: entity?.entityId,
          docType: field === 'weighInSlip' ? 'WEIGH_IN_SLIP' : 'ODOMETER',
        });
        docMeta = uploaded;
        if (section === 'start')
          setStartDocs((prev) => ({
            ...prev,
            [field]: { ...(prev[field] || {}), uploaded: true, documentMeta: uploaded },
          }));
        else
          setEndDocs((prev) => ({
            ...prev,
            [field]: { ...(prev[field] || {}), uploaded: true, documentMeta: uploaded },
          }));
      }

      let ocrData = null;
      const docId = docMeta && (docMeta.id || docMeta._id || docMeta.documentId);
      if (docId) {
        const resp = await DocumentService.processDocument(docId);
        ocrData = resp?.ocr || resp?.data || resp;
      }

      // Fallback to lightweight mock if backend didn't return ocr
      if (!ocrData) {
        if (field === 'odometerStart' || field === 'odometerEnd') {
          ocrData = {
            reading: String(Math.floor(Math.random() * 20000) + 10000),
            date: new Date().toISOString().split('T')[0],
            time: '10:30',
          };
        } else if (field === 'weighInSlip') {
          ocrData = { grossWeight: '25000', tareWeight: '10000', netWeight: '15000' };
        } else if (field === 'proofOfDelivery') {
          ocrData = {
            receiverName: 'Rajesh Kumar',
            signature: 'Present',
            date: new Date().toISOString().split('T')[0],
          };
        }
      }

      if (section === 'start') {
        setStartDocs((prev) => ({ ...prev, [field]: { ...(prev[field] || {}), ocrData } }));
      } else {
        setEndDocs((prev) => ({ ...prev, [field]: { ...(prev[field] || {}), ocrData } }));
      }
    } catch (err) {
      console.error('OCR processing failed:', err);
      // Minimal fallback to previous mock behavior when API fails
      const mockOCRData = {
        odometerStart: { reading: '12450', date: '2025-12-07', time: '10:30' },
        weighInSlip: { grossWeight: '25000', tareWeight: '10000', netWeight: '15000' },
        odometerEnd: { reading: '12630', date: '2025-12-07', time: '18:45' },
        proofOfDelivery: { receiverName: 'Rajesh Kumar', signature: 'Present', date: '2025-12-07' },
        diesel: { quantity: '120', amount: '11460', date: '2025-12-07' },
        adblue: { quantity: '10', amount: '450', date: '2025-12-07' },
      };

      if (section === 'start') {
        setStartDocs((prev) => ({
          ...prev,
          [field]: { ...prev[field], ocrData: mockOCRData[field] },
        }));
      } else if (section === 'end') {
        setEndDocs((prev) => ({
          ...prev,
          [field]: { ...prev[field], ocrData: mockOCRData[field] },
        }));
      } else if (section === 'fuel' && receiptId) {
        setFuelReceipts((prev) =>
          prev.map((receipt) =>
            receipt.id === receiptId ? { ...receipt, ocrData: mockOCRData[receipt.type] } : receipt,
          ),
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Save trip data
   * Validates required fields before submission
   * Creates and immediately starts a new trip
   */
  const handleSaveTrip = async () => {
    // Validate required fields
    if (!formData.source || !formData.destination || !formData.vehicleNo || !formData.driver) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      // Find selected vehicle and driver IDs
      const selectedVehicle = vehicles.find((v) => v.number === formData.vehicleNo);
      const selectedDriver = drivers.find((d) => d.name === formData.driver);

      if (!selectedVehicle || !selectedDriver) {
        toast.error('Invalid vehicle or driver selection');
        return;
      }

      // Use manual odometer input if no document is uploaded, otherwise use OCR data
      let odometerReading = undefined;
      if (showManualOdometer && manualOdometerStart) {
        odometerReading = parseFloat(manualOdometerStart);
      } else if (startDocs.odometerStart?.ocrData?.reading) {
        odometerReading = parseFloat(startDocs.odometerStart.ocrData.reading);
      }

      // Use manual payload if no slip ID toggle is on, otherwise use form payload or OCR data
      let weighInWeight = undefined;
      if (noSlipId && manualPayload) {
        weighInWeight = manualPayload;
      } else if (formData.payload) {
        weighInWeight = formData.payload;
      }

      const tripData = {
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        routeSource: formData.source,
        routeDestination: formData.destination,
        startOdometer: odometerReading,
        weighInWeight: weighInWeight,
      };

      const response = await TripService.directStartTrip(tripData);
      toast.success('Trip started successfully');

      // Store the trip ID for potential use
      const newTripId = response.data?.id || response.data?._id;
      if (newTripId) {
        setExistingTrip(response.data);
      }

      navigate('/trip-management');
    } catch (error) {
      console.error('Failed to start trip:', error);
      toast.error(error?.message || 'Failed to start trip');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Show expenses modal when End Trip button is clicked
   */
  const handleEndTripClick = () => {
    // Get end odometer from manual input or document
    let endOdometerReading = undefined;
    if (showManualOdometerEnd && manualOdometerEnd) {
      endOdometerReading = parseFloat(manualOdometerEnd);
    } else if (endDocs.odometerEnd?.ocrData?.reading) {
      endOdometerReading = parseFloat(endDocs.odometerEnd.ocrData.reading);
    }

    if (!endOdometerReading) {
      toast.error('Please provide end odometer reading to complete the trip');
      return;
    }

    // Show expenses modal
    setShowExpensesModal(true);
  };

  /**
   * End trip and mark as completed with expenses
   * If trip is not started yet (no tripId), it will start the trip first then end it
   */
  const handleEndTrip = async () => {
    // Get end odometer from manual input or document
    let endOdometerReading = undefined;
    if (showManualOdometerEnd && manualOdometerEnd) {
      endOdometerReading = parseFloat(manualOdometerEnd);
    } else if (endDocs.odometerEnd?.ocrData?.reading) {
      endOdometerReading = parseFloat(endDocs.odometerEnd.ocrData.reading);
    }

    if (!endOdometerReading) {
      toast.error('Please provide end odometer reading to complete the trip');
      return;
    }

    setIsProcessing(true);
    try {
      let currentTripId = tripId;

      // If no tripId exists, we need to start the trip first
      if (!currentTripId && !existingTrip) {
        // Validate start trip fields
        if (!formData.source || !formData.destination || !formData.vehicleNo || !formData.driver) {
          toast.error('Please fill all required start trip fields');
          setIsProcessing(false);
          return;
        }

        // Find selected vehicle and driver IDs
        const selectedVehicle = vehicles.find((v) => v.number === formData.vehicleNo);
        const selectedDriver = drivers.find((d) => d.name === formData.driver);

        if (!selectedVehicle || !selectedDriver) {
          toast.error('Invalid vehicle or driver selection');
          setIsProcessing(false);
          return;
        }

        // Get start odometer
        let startOdometerReading = undefined;
        if (showManualOdometer && manualOdometerStart) {
          startOdometerReading = parseFloat(manualOdometerStart);
        } else if (startDocs.odometerStart?.ocrData?.reading) {
          startOdometerReading = parseFloat(startDocs.odometerStart.ocrData.reading);
        }

        // Get weigh-in weight
        let weighInWeight = undefined;
        if (noSlipId && manualPayload) {
          weighInWeight = manualPayload;
        } else if (formData.payload) {
          weighInWeight = formData.payload;
        }

        const tripData = {
          vehicleId: selectedVehicle.id,
          driverId: selectedDriver.id,
          routeSource: formData.source,
          routeDestination: formData.destination,
          startOdometer: startOdometerReading,
          weighInWeight: weighInWeight,
        };

        console.log('Starting trip first before ending:', tripData);
        const startResponse = await TripService.directStartTrip(tripData);
        toast.success('Trip started successfully');

        // Get the new trip ID
        currentTripId = startResponse.data?.id || startResponse.data?._id;

        if (!currentTripId) {
          throw new Error('Failed to get trip ID after starting trip');
        }
      }

      // Now end the trip
      // Get start odometer for validation
      let startOdometerReading = undefined;
      if (manualOdometerStart) {
        startOdometerReading = parseFloat(manualOdometerStart);
      } else if (startDocs.odometerStart?.ocrData?.reading) {
        startOdometerReading = parseFloat(startDocs.odometerStart.ocrData.reading);
      }

      const endData = {
        endOdometer: endOdometerReading,
        startOdometer: startOdometerReading,
        // TODO: Include expenses data once backend is ready
        // expenses: {
        //   materialCost: expenses.materialCost ? parseFloat(expenses.materialCost) : null,
        //   toll: expenses.toll ? parseFloat(expenses.toll) : null,
        //   driverCost: expenses.driverCost ? parseFloat(expenses.driverCost) : null,
        //   driverTripExpense: expenses.driverTripExpense ? parseFloat(expenses.driverTripExpense) : null,
        //   royalty: expenses.royalty ? parseFloat(expenses.royalty) : null
        // }
      };

      // Log expenses data for now (will be sent to backend once API is ready)
      console.log('Trip expenses (pending backend integration):', {
        materialCost: expenses.materialCost ? parseFloat(expenses.materialCost) : null,
        toll: expenses.toll ? parseFloat(expenses.toll) : null,
        driverCost: expenses.driverCost ? parseFloat(expenses.driverCost) : null,
        driverTripExpense: expenses.driverTripExpense
          ? parseFloat(expenses.driverTripExpense)
          : null,
        royalty: expenses.royalty ? parseFloat(expenses.royalty) : null,
      });
      console.log('Ending trip with data:', endData);
      await TripService.endTrip(currentTripId, endData);
      toast.success('Trip ended successfully');
      navigate('/trip-management');
    } catch (error) {
      console.error('Failed to end trip:', error);
      toast.error(error?.message || 'Failed to end trip');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Check if Start Trip button should be enabled
   */
  const canStartTrip =
    !isEditMode && formData.source && formData.destination && formData.vehicleNo && formData.driver;

  /**
   * Check if End Trip button should be enabled
   */
  const canEndTrip =
    (showManualOdometerEnd && manualOdometerEnd) || endDocs.odometerEnd?.ocrData?.reading;

  return {
    // Page mode
    isEditMode,
    existingTrip,
    loadingTrip,
    isCompletedTrip,
    // Form fields
    formData,
    handleInputChange,
    // Manual document inputs
    manualOdometerStart,
    setManualOdometerStart,
    showManualOdometer,
    setShowManualOdometer,
    manualPayload,
    setManualPayload,
    noSlipId,
    setNoSlipId,
    manualOdometerEnd,
    setManualOdometerEnd,
    showManualOdometerEnd,
    setShowManualOdometerEnd,
    // Documents & fuel receipts
    startDocs,
    endDocs,
    fuelReceipts,
    handleFileUpload,
    handleMultipleFuelReceipts,
    handleFuelReceiptUpload,
    removeFuelReceipt,
    processOCR,
    // Expenses
    expenses,
    setExpenses,
    showExpensesModal,
    setShowExpensesModal,
    // Cropper
    cropperState,
    handleCropComplete,
    handleCropperCancel,
    // UI
    isProcessing,
    vehicles,
    drivers,
    canUpload,
    // Submit
    handleSaveTrip,
    handleEndTripClick,
    handleEndTrip,
    canStartTrip,
    canEndTrip,
  };
};

export default useTripFormState;
