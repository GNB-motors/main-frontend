import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Truck, Sparkles, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { VehicleService } from './VehicleService.jsx';
import { listAccounts, reassignVehicleAccount } from './FleetEdgeAccountService.jsx';
import { useActiveBranch } from '../../contexts/BranchContext.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import VehicleBasicInformationForm from './Component/VehicleBasicInformationForm.jsx';
import VehicleDocumentUpload, {
  VEHICLE_DOC_TYPES,
  emptyDocsState,
} from './Component/VehicleDocumentUpload.jsx';
import { getToken, getProfileField } from '../../utils/session.js';
import { mapFetchedDocsToUiState } from './addVehicleDocMapping';
import { ImportVehicleDialog } from './ImportVehicleDialog';
import './VehiclesPage.css';
import './AddVehiclePage.css';

const formatHSRP = (val) => {
  if (!val) return '';
  const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length > 4) {
    const state = clean.slice(0, 2);
    const rto = clean.slice(2, 4);
    const rest = clean.slice(4);
    return `${state} ${rto} ${rest}`;
  }
  return clean;
};

const AddVehiclePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [vehicleId, setVehicleId] = useState(null);
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [initialFormData, setInitialFormData] = useState({});
  const [documents, setDocuments] = useState(emptyDocsState);
  const [liveRegNumber, setLiveRegNumber] = useState('');

  const businessRefId = getProfileField('business_ref_id') || null;
  const [fleetEdgeAccounts, setFleetEdgeAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Owning location (branch) for the new vehicle. Defaults to the active location.
  const { branchId: activeBranchId, branches, activeBranch } = useActiveBranch();
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // When the entered registration number already belongs to an enterprise
  // vehicle, we surface the Import Vehicle modal instead of creating a duplicate.
  const [importCandidate, setImportCandidate] = useState(null);
  const [importing, setImporting] = useState(false);

  // Default the vehicle's location to the active location. '' means Enterprise
  // (no specific location) — a valid choice that creates an enterprise-level vehicle.
  useEffect(() => {
    if (isEdit) return; // location transfer on edit is a deferred feature
    setSelectedBranchId(activeBranchId ? String(activeBranchId) : '');
  }, [activeBranchId, isEdit]);

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    listAccounts(token)
      .then((accounts) => {
        const active = (accounts || []).filter((a) => a.status === 'ACTIVE');
        setFleetEdgeAccounts(active);
        if (active.length === 1) setSelectedAccountId(String(active[0]._id));
      })
      .catch(() => {});
  }, []);

  // If navigated here for editing, prefill form from location.state.editingVehicle
  useEffect(() => {
    const loadVehicleData = async () => {
      const editing = location?.state?.editingVehicle;
      if (editing) {
        setIsEdit(true);
        const vId = editing.id || editing._id;
        setVehicleId(vId);

        const regNo = editing.registration_no || editing.registrationNumber || '';
        setLiveRegNumber(regNo);

        setInitialFormData({
          registration_no: regNo,
          chassis_number: editing.chassis_number || editing.chassisNumber || '',
          model: editing.model || '',
          // Absent for orgs without Mileage Integrity — the API projects it out.
          expected_mileage: editing.expectedMileage?.kmPerL ?? '',
        });

        // Fetch existing vehicle documents — server returns subdocs with files[]
        try {
          const token = getToken();
          const fetchedDocs = await VehicleService.getVehicleDocuments(vId, token);
          setDocuments(mapFetchedDocsToUiState(fetchedDocs, emptyDocsState));
        } catch (err) {
          console.error('Failed to load vehicle documents', err);
        }
      } else {
        setIsEdit(false);
        setVehicleId(null);
        setInitialFormData({});
        setDocuments(emptyDocsState());
        setLiveRegNumber('');
      }
    };

    loadVehicleData();
  }, [location?.state?.editingVehicle]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    const token = getToken();

    if (!token) {
      toast.warn('No auth token found. Request may fail.');
    }

    // For each docType, collect the new files the user attached (skip slots
    // that hold an existing preview URL with no fresh file). Backend replaces
    // the whole subdoc when same docType is uploaded again.
    const uploadDocuments = async (entityId) => {
      for (const meta of VEHICLE_DOC_TYPES) {
        const entry = documents[meta.key];
        if (!entry) continue;

        const filesInOrder = [];
        const sidesInOrder = [];
        meta.sides.forEach((side) => {
          const slot = entry[side];
          if (slot && slot.file) {
            filesInOrder.push(slot.file);
            sidesInOrder.push(side);
          }
        });

        if (filesInOrder.length === 0) continue;

        try {
          await VehicleService.uploadVehicleDocument(
            entityId,
            meta.backendType,
            filesInOrder,
            token,
            {
              sides: sidesInOrder,
              expiryDate: entry.expiryDate || undefined,
            },
          );
        } catch (docErr) {
          console.error(`Failed to upload ${meta.backendType}`, docErr);
          toast.warning(`Failed to upload ${meta.label}`);
        }
      }
    };

    try {
      if (isEdit) {
        await VehicleService.updateVehicle(
          businessRefId,
          vehicleId || formData.registration_no,
          formData,
          token,
        );
        await uploadDocuments(vehicleId);
        toast.success(`Vehicle "${formData.registration_no}" updated successfully`);
        navigate('/vehicles');
      } else {
        const savedVehicle = await VehicleService.addVehicle(
          businessRefId,
          { ...formData, branchId: selectedBranchId },
          token,
        );
        const newVehicleId = savedVehicle._id || savedVehicle.id;
        if (newVehicleId) {
          await uploadDocuments(newVehicleId);
          if (selectedAccountId) {
            try {
              await reassignVehicleAccount(token, newVehicleId, selectedAccountId);
            } catch {
              /* non-fatal — resolver will tag on next ingestion */
            }
          }
        }
        toast.success(`Vehicle "${formData.registration_no}" created successfully`);
        navigate('/vehicles');
      }
    } catch (err) {
      console.error('Add/Edit vehicle error', err);
      // Registration already belongs to a vehicle in this enterprise → offer Import.
      if (err?.code === 'ALREADY_IN_ENTERPRISE' && err?.data?.vehicle) {
        setImportCandidate(err.data.vehicle);
        return;
      }
      const msg = err?.detail || err?.message || 'Failed to create/update vehicle';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmImport = async () => {
    if (!importCandidate?.id) return;
    setImporting(true);
    try {
      await VehicleService.importVehicle(importCandidate.id, getToken());
      toast.success('Vehicle imported and activated in this location.');
      setImportCandidate(null);
      navigate('/vehicles');
    } catch (err) {
      toast.error(err?.detail || err?.message || 'Failed to import vehicle');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!vehicleId) return;
    const token = getToken();
    await VehicleService.deleteVehicleDocument(vehicleId, documentId, token);
  };

  const handleFooterSubmit = (e) => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const docCount = VEHICLE_DOC_TYPES.reduce((count, { key, sides }) => {
    const entry = documents[key];
    if (!entry) return count;
    const hasSides = sides.some((s) => entry[s]?.preview || entry[s]?.file || entry[s]?.imageUrl);
    return count + (hasSides ? 1 : 0);
  }, 0);

  return (
    <div className="vehicles-page-container add-vehicle-page" style={themeColors}>
      <div className="add-vehicle-container">
        {/* Elevated Hero Header */}
        <div className="add-vehicle-hero">
          {/* Breadcrumb Navigation & Mode Pill */}
          <div className="add-vehicle-breadcrumb-row">
            <div className="add-vehicle-breadcrumb">
              <button
                type="button"
                className="add-vehicle-back-btn"
                onClick={() => navigate('/vehicles')}
                aria-label="Back to Vehicles"
              >
                <ArrowLeft size={14} />
              </button>
              <span
                className="add-vehicle-crumb-link"
                onClick={() => navigate('/vehicles')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate('/vehicles');
                }}
                role="button"
                tabIndex={0}
              >
                Vehicles
              </span>
              <span className="add-vehicle-crumb-separator">
                <ChevronRight size={14} />
              </span>
              <span className="add-vehicle-crumb-current">
                {isEdit
                  ? liveRegNumber
                    ? `${liveRegNumber} (Edit)`
                    : 'Edit Vehicle'
                  : 'Add Vehicle'}
              </span>
            </div>

            <div className={`add-vehicle-mode-badge ${isEdit ? 'edit' : 'create'}`}>
              <Sparkles size={13} />
              <span>{isEdit ? 'Editing Asset' : 'New Fleet Asset'}</span>
            </div>
          </div>

          {/* Title & Authentic Live HSRP Plate */}
          <div className="add-vehicle-header-main">
            <div className="add-vehicle-title-col">
              <h1 className="add-vehicle-heading">
                <span>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</span>
              </h1>
              <p className="add-vehicle-subtext">
                {isEdit
                  ? 'Update registration details, chassis number, vehicle model, and compliance documentation.'
                  : 'Configure essential vehicle specifications, telemetry link, terminal assignment, and compliance files.'}
              </p>
            </div>

            {/* Live Indian HSRP License Plate Preview */}
            <div className="hsrp-plate-hero" title="Live High Security Registration Plate preview">
              <div className="hsrp-blue-band">
                <span className="hsrp-chakra-symbol">⎈</span>
                <span className="hsrp-ind-text">IND</span>
              </div>
              <div className={`hsrp-number-display ${!liveRegNumber ? 'placeholder' : ''}`}>
                {liveRegNumber ? formatHSRP(liveRegNumber) : 'MH 04 AB 1234'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Basic Information + Integrated Telematics & Terminal */}
        <VehicleBasicInformationForm
          ref={formRef}
          initialData={initialFormData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isEdit={isEdit}
          activeBranchId={activeBranchId}
          activeBranch={activeBranch}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          fleetEdgeAccounts={fleetEdgeAccounts}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
          onRegistrationChange={setLiveRegNumber}
        />

        {/* Section 2: Compliance Documents Grid (Full Width & Balanced) */}
        <VehicleDocumentUpload
          initialData={documents}
          onDocumentsChange={setDocuments}
          onDeleteDocument={handleDeleteDocument}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Docked Frosted-Glass Action Bar */}
      <div className="add-vehicle-footer-bar">
        <div className="add-vehicle-footer-inner">
          <div className="add-vehicle-footer-status">
            <div className="footer-status-pill">
              <span>Target Asset:</span>
              <span className="footer-status-plate">
                {liveRegNumber
                  ? formatHSRP(liveRegNumber)
                  : isEdit
                    ? 'Existing Unit'
                    : 'Draft Unit'}
              </span>
              <span>•</span>
              <span>{docCount} of 5 compliance documents attached</span>
            </div>
          </div>

          <div className="add-vehicle-footer-actions">
            <button
              type="button"
              className="add-vehicle-btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="add-vehicle-btn-primary"
              onClick={handleFooterSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Truck size={16} />
                  <span>{isEdit ? 'Update Vehicle' : 'Add Vehicle to Fleet'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ImportVehicleDialog
        candidate={importCandidate}
        importing={importing}
        onCancel={() => setImportCandidate(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
};

export default AddVehiclePage;
