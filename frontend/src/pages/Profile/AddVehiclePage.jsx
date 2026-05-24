import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VehicleService } from './VehicleService.jsx';
import { listAccounts, reassignVehicleAccount } from './FleetEdgeAccountService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import PageHeader from '../Drivers/Component/PageHeader.jsx';
import VehicleBasicInformationForm from './Component/VehicleBasicInformationForm.jsx';
import VehicleDocumentUpload, { VEHICLE_DOC_TYPES, emptyDocsState } from './Component/VehicleDocumentUpload.jsx';
import FormFooter from '../Drivers/Component/FormFooter.jsx';
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
        const savedVehicle = await VehicleService.addVehicle(businessRefId, formData, token);
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
      const msg = err?.detail || 'Failed to create/update vehicle';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
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
    </div>
  );
};

export default AddVehiclePage;
