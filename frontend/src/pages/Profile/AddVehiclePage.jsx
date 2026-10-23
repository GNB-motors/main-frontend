import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { VehicleService } from './VehicleService.js';
import { listAccounts, reassignVehicleAccount } from './FleetEdgeAccountService.js';
import { useActiveBranch } from '../../contexts/BranchContext.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import VehicleBasicInformationForm from './Component/VehicleBasicInformationForm.jsx';
import logger from '../../utils/logger';
import './AddVehiclePage.css';
import './VehiclesPage.css';
import { ImportVehicleDialog } from './ImportVehicleDialog';
import { mapFetchedDocsToUiState } from './addVehicleDocMapping';
import { getToken, getProfileField, getUserRole } from '../../utils/session.js';
} from './Component/VehicleDocumentUpload.jsx';
  emptyDocsState,
  VEHICLE_DOC_TYPES,
import VehicleDocumentUpload, {
import useVehicleManufacturers from './useVehicleManufacturers.js';
import { eligibleAccounts, canonicalManufacturer } from './vehicleManufacturerOptions.js';

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
  const [liveManufacturer, setLiveManufacturer] = useState('');
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(false);
  const [accountsAttempt, setAccountsAttempt] = useState(0);
  const [accountNotice, setAccountNotice] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [createdVehicleId, setCreatedVehicleId] = useState(null);
  const savingRef = useRef(false);
  const completedUploads = useRef(new Map());
  const assignedAccountRef = useRef('');
  const originalManufacturerRef = useRef('');
  const canAssignAccount = ['OWNER', 'SUPER_ADMIN'].includes(getUserRole());
  const { manufacturers, metadataError, retryMetadata } = useVehicleManufacturers();
  const compatibleAccounts = eligibleAccounts(fleetEdgeAccounts, liveManufacturer);

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
    if (!getToken() || !canAssignAccount) return undefined;
    const controller = new AbortController();
    setAccountsLoading(true);
    setAccountsError(false);
    listAccounts({ signal: controller.signal })
      .then((accounts) => {
        if (!controller.signal.aborted) setFleetEdgeAccounts(accounts || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAccountsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAccountsLoading(false);
      });
    return () => controller.abort();
  }, [canAssignAccount, accountsAttempt]);

  useEffect(() => {
    if (!canAssignAccount || accountsLoading || accountsError || !liveManufacturer) return;
    // Opening an existing vehicle must not silently remove its saved account.
    if (
      selectedAccountId === assignedAccountRef.current &&
      liveManufacturer === originalManufacturerRef.current
    )
      return;
    if (
      selectedAccountId &&
      !eligibleAccounts(fleetEdgeAccounts, liveManufacturer).some(
        (account) => String(account._id) === selectedAccountId,
      )
    ) {
      setSelectedAccountId('');
      setAccountNotice(
        'Account cleared because it is unavailable or incompatible with this manufacturer.',
      );
    }
  }, [
    canAssignAccount,
    liveManufacturer,
    selectedAccountId,
    fleetEdgeAccounts,
    accountsLoading,
    accountsError,
  ]);

  // If navigated here for editing, prefill form from location.state.editingVehicle
  useEffect(() => {
    const loadVehicleData = async () => {
      setCreatedVehicleId(null);
      setSaveMessage('');
      completedUploads.current.clear();
      const editing = location?.state?.editingVehicle;
      if (editing) {
        setIsEdit(true);
        const vId = editing.id || editing._id;
        setVehicleId(vId);
        const existingAccount = String(editing.fleetEdgeAccountId || '');
        setSelectedAccountId(existingAccount);
        assignedAccountRef.current = existingAccount;
        originalManufacturerRef.current = canonicalManufacturer(editing.manufacturer);

        const regNo = editing.registration_no || editing.registrationNumber || '';
        setLiveRegNumber(regNo);

        setInitialFormData({
          registration_no: regNo,
          chassis_number: editing.chassis_number || editing.chassisNumber || '',
          model: editing.model || '',
          manufacturer: editing.manufacturer || '',
          // Absent for orgs without Mileage Integrity — the API projects it out.
          expected_mileage: editing.expectedMileage?.kmPerL ?? '',
        });

        // Fetch existing vehicle documents — server returns subdocs with files[]
        try {
          const fetchedDocs = await VehicleService.getVehicleDocuments(vId);
          setDocuments(mapFetchedDocsToUiState(fetchedDocs, emptyDocsState));
        } catch (err) {
          logger.warn('AddVehiclePage', 'Failed to load vehicle documents', err);
        }
      } else {
        setIsEdit(false);
        setVehicleId(null);
        setInitialFormData({});
        setDocuments(emptyDocsState());
        setLiveRegNumber('');
        setSelectedAccountId('');
        assignedAccountRef.current = '';
        originalManufacturerRef.current = '';
      }
    };

    loadVehicleData();
  }, [location?.state?.editingVehicle]);

  const handleSubmit = async (formData) => {
    if (savingRef.current || saveBlocked) return;
    savingRef.current = true;
    setIsSubmitting(true);
    setSaveMessage('');
    const failures = [];
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

        const prior = completedUploads.current.get(meta.key);
        if (
          prior &&
          prior.expiryDate === entry.expiryDate &&
          prior.files.length === filesInOrder.length &&
          prior.files.every((file, index) => file === filesInOrder[index])
        )
          continue;
        try {
          await VehicleService.uploadVehicleDocument(entityId, meta.backendType, filesInOrder, {
            sides: sidesInOrder,
            expiryDate: entry.expiryDate || undefined,
          });
          completedUploads.current.set(meta.key, {
            files: filesInOrder,
            expiryDate: entry.expiryDate,
          });
        } catch (docErr) {
          logger.warn('AddVehiclePage', `Failed to upload ${meta.backendType}`, docErr);
          failures.push(`${meta.label} upload failed`);
        }
      }
    };

    try {
      let savedId = vehicleId || createdVehicleId;
      if (isEdit || createdVehicleId) {
        await VehicleService.updateVehicle(businessRefId, savedId, formData);
      } else {
        const savedVehicle = await VehicleService.addVehicle(businessRefId, {
          ...formData,
          branchId: selectedBranchId,
        });
        savedId = savedVehicle._id || savedVehicle.id;
        if (!savedId) {
          setSaveBlocked(true);
          throw new Error(
            'Vehicle saved, but its ID was not returned. Reload the vehicle list before retrying.',
          );
        }
        setCreatedVehicleId(savedId);
      }
      await uploadDocuments(savedId);
      if (canAssignAccount && selectedAccountId !== assignedAccountRef.current) {
        try {
          await reassignVehicleAccount(savedId, selectedAccountId || null);
          assignedAccountRef.current = selectedAccountId;
        } catch (error) {
          failures.push(error?.message || 'Account assignment failed');
        }
      }
      if (failures.length) {
        setSaveMessage(
          `Vehicle saved. ${failures.join('. ')}. Retry save to finish; the vehicle will not be created again.`,
        );
        return;
      }
      toast.success(
        `Vehicle "${formData.registration_no}" ${isEdit ? 'updated' : 'added'} successfully`,
      );
      navigate('/vehicles');
    } catch (err) {
      logger.warn('AddVehiclePage', 'Add/Edit vehicle error', err);
      // Registration already belongs to a vehicle in this enterprise → offer Import.
      if (err?.body?.code === 'ALREADY_IN_ENTERPRISE' && err.body.data?.vehicle) {
        setImportCandidate(err.body.data.vehicle);
        return;
      }
      const msg = err?.message || 'Failed to create/update vehicle';
      setSaveMessage(msg);
      toast.error(msg);
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const confirmImport = async () => {
    if (!importCandidate?.id) return;
    setImporting(true);
    try {
      await VehicleService.importVehicle(importCandidate.id);
      toast.success('Vehicle imported and activated in this location.');
      setImportCandidate(null);
      navigate('/vehicles');
    } catch (err) {
      toast.error(err?.message || 'Failed to import vehicle');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!vehicleId) return;
    await VehicleService.deleteVehicleDocument(vehicleId, documentId);
  };

  const handleFooterSubmit = (e) => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <div className="vehicles-page-container add-vehicle-page" style={themeColors}>
      <div className="add-vehicle-container">
        {saveMessage && (
          <div className="vehicle-save-message" role="alert">
            {saveMessage}
          </div>
        )}
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
                  : 'Enter vehicle details, choose a manufacturer and optionally assign an account.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Basic Information + Integrated Telematics & Terminal */}
        <VehicleBasicInformationForm
          ref={formRef}
          initialData={initialFormData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isEdit={isEdit || Boolean(createdVehicleId)}
          activeBranchId={activeBranchId}
          activeBranch={activeBranch}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          fleetEdgeAccounts={compatibleAccounts}
          manufacturers={manufacturers}
          metadataError={metadataError}
          onRetryMetadata={retryMetadata}
          manufacturer={liveManufacturer}
          onManufacturerChange={setLiveManufacturer}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          onRetryAccounts={() => setAccountsAttempt((value) => value + 1)}
          canAssignAccount={canAssignAccount}
          accountNotice={accountNotice}
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
              disabled={isSubmitting || saveBlocked}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Truck size={16} />
                  <span>
                    {createdVehicleId ? 'Retry save' : isEdit ? 'Update vehicle' : 'Add vehicle'}
                  </span>
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
