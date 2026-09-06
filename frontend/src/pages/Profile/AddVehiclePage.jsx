import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VehicleService } from './VehicleService.jsx';
import { listAccounts, reassignVehicleAccount } from './FleetEdgeAccountService.jsx';
import { useActiveBranch } from '../../contexts/BranchContext.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import PageHeader from '../Drivers/Component/PageHeader.jsx';
import VehicleBasicInformationForm from './Component/VehicleBasicInformationForm.jsx';
import VehicleDocumentUpload, {
  VEHICLE_DOC_TYPES,
  emptyDocsState,
} from './Component/VehicleDocumentUpload.jsx';
import FormFooter from '../Drivers/Component/FormFooter.jsx';
import { getToken, getProfileField } from '../../utils/session.js';
import { mapFetchedDocsToUiState } from './addVehicleDocMapping';
import { ImportVehicleDialog } from './ImportVehicleDialog';
import { VehicleLocationField, VehicleFleetEdgeAccountField } from './vehicleLocationFields';
import './VehiclesPage.css';

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

        setInitialFormData({
          registration_no: editing.registration_no || editing.registrationNumber || '',
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

    // No hard requirement: an empty selection means "Enterprise" (no specific
    // location), which the backend stores as an enterprise-level vehicle.

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

  return (
    <div className="vehicles-page-container" style={themeColors}>
      <div className="vehicles-content-wrapper" style={{ paddingBottom: '80px' }}>
        <PageHeader
          backLabel="Vehicles"
          backPath="/vehicles"
          currentLabel={isEdit ? initialFormData.registration_no || 'Vehicle' : null}
          title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
          description={
            isEdit
              ? 'Update vehicle information including registration, chassis number, and model.'
              : 'Configure essential vehicle details, including registration, chassis number, and model.'
          }
          onBack={() => navigate(-1)}
        />

        {!isEdit && (activeBranchId || branches.length > 0) && (
          <VehicleLocationField
            activeBranchId={activeBranchId}
            activeBranch={activeBranch}
            branches={branches}
            selectedBranchId={selectedBranchId}
            onChange={setSelectedBranchId}
          />
        )}

        {!isEdit && fleetEdgeAccounts.length > 1 && (
          <VehicleFleetEdgeAccountField
            accounts={fleetEdgeAccounts}
            selectedAccountId={selectedAccountId}
            onChange={setSelectedAccountId}
          />
        )}

        <VehicleBasicInformationForm
          ref={formRef}
          initialData={initialFormData}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          isSubmitting={isSubmitting}
          isEdit={isEdit}
        />

        <VehicleDocumentUpload
          initialData={documents}
          onDocumentsChange={setDocuments}
          onDeleteDocument={handleDeleteDocument}
          isSubmitting={isSubmitting}
        />
      </div>

      <FormFooter
        onCancel={() => navigate(-1)}
        onSubmit={handleFooterSubmit}
        isSubmitting={isSubmitting}
        isEdit={isEdit}
        submitText={isEdit ? 'Update Vehicle' : 'Add Vehicle'}
      />

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
