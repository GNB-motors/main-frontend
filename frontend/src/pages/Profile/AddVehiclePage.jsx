import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VehicleService } from './VehicleService.jsx';
import { listAccounts, reassignVehicleAccount } from './FleetEdgeAccountService.jsx';
import { useActiveBranch } from '../../contexts/BranchContext.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import PageHeader from '../Drivers/Component/PageHeader.jsx';
import VehicleBasicInformationForm from './Component/VehicleBasicInformationForm.jsx';
import VehicleDocumentUpload, { VEHICLE_DOC_TYPES, emptyDocsState } from './Component/VehicleDocumentUpload.jsx';
import FormFooter from '../Drivers/Component/FormFooter.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Truck, Building2 } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';
import './VehiclesPage.css';

const BACKEND_TO_UI = VEHICLE_DOC_TYPES.reduce((acc, d) => {
  acc[d.backendType] = d.key;
  return acc;
}, {});

const META_BY_KEY = VEHICLE_DOC_TYPES.reduce((acc, d) => {
  acc[d.key] = d;
  return acc;
}, {});

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

  const businessRefId = localStorage.getItem('profile_business_ref_id') || null;
  const [fleetEdgeAccounts, setFleetEdgeAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Owning location (branch) for the new vehicle. Defaults to the active location.
  const { branchId: activeBranchId, branches } = useActiveBranch();
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
    const token = localStorage.getItem('authToken');
    if (!token) return;
    listAccounts(token)
      .then(accounts => {
        const active = (accounts || []).filter(a => a.status === 'ACTIVE');
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
          const token = localStorage.getItem('authToken');
          const fetchedDocs = await VehicleService.getVehicleDocuments(vId, token);
          const updatedDocs = emptyDocsState();

          if (Array.isArray(fetchedDocs)) {
            fetchedDocs.forEach((doc) => {
              const uiKey = BACKEND_TO_UI[doc.docType];
              if (!uiKey) return;
              const meta = META_BY_KEY[uiKey];

              updatedDocs[uiKey].documentId = doc._id || doc.id || null;
              updatedDocs[uiKey].expiryDate = doc.expiryDate || null;
              updatedDocs[uiKey].ocrStatus = doc.ocr?.status || null;
              updatedDocs[uiKey].ocrFields = doc.ocr?.fields || null;

              (doc.files || []).forEach((f) => {
                const side = meta.sides.includes(f.side)
                  ? f.side
                  : (meta.sides[0] || 'SINGLE');
                updatedDocs[uiKey][side] = {
                  file: null,
                  preview: f.publicUrl,
                  imageUrl: f.publicUrl,
                  name: doc.docType,
                  isPdf: (f.mimeType || '').includes('pdf'),
                };
              });
            });
          }
          setDocuments(updatedDocs);
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
    const token = localStorage.getItem('authToken');

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
            { sides: sidesInOrder, expiryDate: entry.expiryDate || undefined },
          );
        } catch (docErr) {
          console.error(`Failed to upload ${meta.backendType}`, docErr);
          toast.warning(`Failed to upload ${meta.label}`);
        }
      }
    };

    try {
      if (isEdit) {
        await VehicleService.updateVehicle(businessRefId, vehicleId || formData.registration_no, formData, token);
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
            } catch (_) { /* non-fatal — resolver will tag on next ingestion */ }
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
      await VehicleService.importVehicle(importCandidate.id, localStorage.getItem('authToken'));
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
    const token = localStorage.getItem('authToken');
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
          currentLabel={isEdit ? (initialFormData.registration_no || 'Vehicle') : null}
          title={isEdit ? "Edit Vehicle" : "Add Vehicle"}
          description={
            isEdit
              ? 'Update vehicle information including registration, chassis number, and model.'
              : 'Configure essential vehicle details, including registration, chassis number, and model.'
          }
          onBack={() => navigate(-1)}
        />

        {!isEdit && branches.length > 0 && (
          <div style={{ padding: '0 24px 16px', maxWidth: 480 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              Location
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, color: '#1e293b', background: '#fff', cursor: 'pointer' }}
            >
              <option value="">Enterprise (no specific location)</option>
              {branches.map((b) => (
                <option key={b._id} value={String(b._id)}>
                  {b.name}{b.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              The operating location this vehicle belongs to. Enterprise-level vehicles show only in the all-locations view.
            </p>
          </div>
        )}

        {!isEdit && fleetEdgeAccounts.length > 1 && (
          <div style={{ padding: '0 24px 16px', maxWidth: 480 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              FleetEdge Account (optional)
            </label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, color: '#1e293b', background: '#fff', cursor: 'pointer' }}
            >
              <option value="">— Not assigned —</option>
              {fleetEdgeAccounts.map(a => (
                <option key={a._id} value={String(a._id)}>{a.friendlyName || a.externalAccountId}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Assign this vehicle to a FleetEdge account. If left blank it will be tagged automatically on first data arrival.</p>
          </div>
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

      {/* Import Vehicle — shown when the registration already exists in the enterprise. */}
      <Dialog open={!!importCandidate} onOpenChange={(o) => { if (!o && !importing) setImportCandidate(null); }}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader>
            <DialogTitle>Import existing vehicle</DialogTitle>
            <DialogDescription>
              This registration number already belongs to a vehicle in your enterprise. Import it into the
              current location instead of creating a duplicate — it becomes active here and is deactivated
              in its previous location.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            {importCandidate && (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Truck size={18} />
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{importCandidate.registrationNumber}</div>
                  <div className="text-muted-foreground">
                    {[importCandidate.manufacturer, importCandidate.model].filter(Boolean).join(' ') || importCandidate.vehicleType || '—'}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <Building2 size={13} />
                    Currently in: {importCandidate.homeBranch?.name || 'Enterprise'}
                  </div>
                </div>
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Its existing records stay with its previous location (history isn't moved).
            </p>
          </div>

          <DialogFooter>
            <NewButton
              variant="secondary"
              size="md"
              type="button"
              text="Cancel"
              onClick={() => setImportCandidate(null)}
              disabled={importing}
            />
            <NewButton
              variant="primary"
              size="md"
              type="button"
              text="Import to this location"
              onClick={confirmImport}
              loading={importing}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddVehiclePage;
