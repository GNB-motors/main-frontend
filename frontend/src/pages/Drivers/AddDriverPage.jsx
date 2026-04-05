import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DriverService } from './DriverService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import PageHeader from './Component/PageHeader.jsx';
import BasicInformationForm from './Component/BasicInformationForm.jsx';
import DocumentUpload from './Component/DocumentUpload.jsx';
import FormFooter from './Component/FormFooter.jsx';
import './DriversPage.css';

const AddDriverPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [initialFormData, setInitialFormData] = useState({});
  const [documents, setDocuments] = useState({
    driverLicense: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
    panCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
    aadharCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
  });

  const businessRefId = localStorage.getItem('profile_business_ref_id') || null;

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // If navigated here for editing, prefill form from location.state.editingDriver
  useEffect(() => {
    const loadDriverData = async () => {
      const editing = location?.state?.editingDriver;
      if (editing) {
        setIsEdit(true);
        const empId = editing.id || editing._id;
        setDriverId(empId);
        const formData = {
          firstName: editing.firstName || editing.first_name || '',
          lastName: editing.lastName || editing.last_name || '',
          email: editing.email || '',
          mobileNumber: editing.mobileNumber || editing.mobile_number || '',
          location: editing.location || '',
          role: editing.role || 'DRIVER',
          password: '', // Don't prefill password
        };
        console.log('Editing driver:', editing);
        console.log('Setting form data:', formData);
        setInitialFormData(formData);

        try {
          const fetchedDocs = await DriverService.getEmployeeDocuments(empId);
          console.log('Fetched documents:', fetchedDocs);
          const updatedDocs = {
            driverLicense: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
            panCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
            aadharCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null }
          };

          if (Array.isArray(fetchedDocs)) {
            fetchedDocs.forEach(doc => {
              // Map API doc types to our state keys
              const mappedType = {
                'DRIVER_LICENSE': 'driverLicense',
                'DL': 'driverLicense',
                'LICENSE': 'driverLicense',
                'PAN': 'panCard',
                'AADHAAR': 'aadharCard',
                'AADHAR': 'aadharCard'
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
          console.error("Failed to load documents", err);
        }
      } else {
        // Reset to add mode when no editing driver
        setIsEdit(false);
        setDriverId(null);
        setInitialFormData({});
        setDocuments({
          driverLicense: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
          panCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
          aadharCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null }
        });
      }
    };

    loadDriverData();
  }, [location?.state?.editingDriver]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const docTypes = {
        driverLicense: 'DRIVER_LICENSE',
        panCard: 'PAN',
        aadharCard: 'AADHAAR'
      };

      const uploadDocuments = async (entityId) => {
        for (const [key, docType] of Object.entries(docTypes)) {
          const docData = documents[key];
          if (docData && docData.file) {
            try {
              // Delete old document if replacing
              const oldDocId = docData._previousDocumentId;
              if (oldDocId) {
                try { await DriverService.deleteDocument(oldDocId); } catch (_) { /* best effort */ }
              }
              await DriverService.uploadDocument(entityId, docType, docData.file);
            } catch (docErr) {
              console.error(`Failed to upload ${docType}`, docErr);
              toast.warning(`Failed to upload ${key} document`);
            }
          }
        }
      };

      if (isEdit) {
        const updatePayload = {};
        if (formData.firstName !== undefined) updatePayload.firstName = formData.firstName;
        if (formData.lastName !== undefined) updatePayload.lastName = formData.lastName;
        if (formData.email !== undefined) updatePayload.email = formData.email;
        if (formData.mobileNumber !== undefined) updatePayload.mobileNumber = formData.mobileNumber;
        if (formData.location !== undefined) updatePayload.location = formData.location;
        if (formData.password) updatePayload.password = formData.password;
        if (formData.role !== undefined) updatePayload.role = formData.role;

        await DriverService.updateDriver(businessRefId, driverId, updatePayload);
        await uploadDocuments(driverId);

        toast.success('Employee updated successfully');
        navigate('/drivers');
      } else {
        const payload = {
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
          email: formData.email || null,
          mobileNumber: formData.mobileNumber || null,
          location: formData.location || null,
          password: formData.password || null,
          role: formData.role || 'DRIVER',
        };

        const savedEmployee = await DriverService.addDriver(businessRefId, payload);
        const empId = savedEmployee._id || savedEmployee.id;
        await uploadDocuments(empId);

        toast.success('Employee created successfully');
        navigate('/drivers');
      }
    } catch (err) {
      console.error('Add employee error', err);
      const msg = err?.message || err?.detail || 'Failed to create/update employee';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    await DriverService.deleteDocument(documentId);
  };

  const handleFooterSubmit = (e) => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <div className="drivers-page" style={themeColors}>
      <div className="drivers-content-wrapper" style={{ paddingBottom: '80px' }}>
        <PageHeader
          backLabel="Employees"
          backPath="/drivers"
          currentLabel={isEdit ? (initialFormData.firstName && initialFormData.lastName ? `${initialFormData.firstName} ${initialFormData.lastName}` : initialFormData.firstName || 'Employee') : null}
          title="Employee Details"
          description={
            isEdit 
              ? 'Update employee information including personal details, contact information, and role assignment.' 
              : 'Configure essential employee details, including the name, contact information, location, and role assignment.'
          }
          onBack={() => navigate(-1)}
        />

        <BasicInformationForm
          ref={formRef}
          initialData={initialFormData}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          isSubmitting={isSubmitting}
          isEdit={isEdit}
        />

        <DocumentUpload
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
      />
    </div>
  );
};

export default AddDriverPage;
