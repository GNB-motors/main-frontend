import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VehicleService } from './VehicleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import PageHeader from '../Drivers/Component/PageHeader.jsx';
import VehicleBasicInformationForm from './Component/VehicleBasicInformationForm.jsx';
import VehicleDocumentUpload from './Component/VehicleDocumentUpload.jsx';
import FormFooter from '../Drivers/Component/FormFooter.jsx';
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
  const [documents, setDocuments] = useState({
    rc: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
    puc: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
    fitnessCertificate: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
  });

  const businessRefId = localStorage.getItem('profile_business_ref_id') || null;

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // If navigated here for editing, prefill form from location.state.editingVehicle
  useEffect(() => {
    const loadVehicleData = async () => {
      const editing = location?.state?.editingVehicle;
      if (editing) {
        setIsEdit(true);
        const vId = editing.id || editing._id;
        setVehicleId(vId);

        const formData = {
          registration_no: editing.registration_no || editing.registrationNumber || '',
          chassis_number: editing.chassis_number || editing.chassisNumber || '',
          model: editing.model || '',
        };

        setInitialFormData(formData);

        // Fetch existing vehicle documents
        try {
          const token = localStorage.getItem('authToken');
          const fetchedDocs = await VehicleService.getVehicleDocuments(vId, token);
          const updatedDocs = {
            rc: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
            puc: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
            fitnessCertificate: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
          };

          if (Array.isArray(fetchedDocs)) {
            fetchedDocs.forEach(doc => {
              const mappedType = {
                'RC': 'rc',
                'PUC': 'puc',
                'POLLUTION': 'puc',
                'FITNESS_CERTIFICATE': 'fitnessCertificate',
                'FC': 'fitnessCertificate',
              }[doc.docType];

              if (mappedType) {
                const url = doc.publicUrl || doc.file_url || doc.fileUrl || doc.url || doc.documentUrl;
                if (url) {
                  updatedDocs[mappedType].preview = url;
                  updatedDocs[mappedType].imageUrl = url;
                  updatedDocs[mappedType].name = doc.originalName || doc.docType;
                  updatedDocs[mappedType].documentId = doc._id || doc.id || null;
                }
              }
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
        setDocuments({
          rc: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
          puc: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
          fitnessCertificate: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
        });
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

    const docTypes = {
      rc: 'RC',
      puc: 'PUC',
      fitnessCertificate: 'FC',
    };

    const uploadDocuments = async (entityId) => {
      for (const [key, docType] of Object.entries(docTypes)) {
        const docData = documents[key];
        if (docData && docData.file) {
          try {
            // Delete old document if replacing
            const oldDocId = docData._previousDocumentId;
            if (oldDocId) {
              try { await VehicleService.deleteDocument(oldDocId, token); } catch (_) { /* best effort */ }
            }
            await VehicleService.uploadVehicleDocument(entityId, docType, docData.file, token);
          } catch (docErr) {
            console.error(`Failed to upload ${docType}`, docErr);
            toast.warning(`Failed to upload ${key} document`);
          }
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
    const token = localStorage.getItem('authToken');
    await VehicleService.deleteDocument(documentId, token);
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
