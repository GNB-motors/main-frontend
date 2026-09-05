import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DriverService } from './DriverService.jsx';
import AccessControlApi from '../AccessControl/accessControlService';
import { useActiveBranch } from '../../contexts/BranchContext';
import { getThemeCSS } from '../../utils/colorTheme';
import { getProfileField } from '../../utils/session.js';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { UserPlus, Building2 } from 'lucide-react';
import PageHeader from './Component/PageHeader.jsx';
import BasicInformationForm from './Component/BasicInformationForm.jsx';
import DocumentUpload from './Component/DocumentUpload.jsx';
import FormFooter from './Component/FormFooter.jsx';
import NewButton from '@/components/ui/NewButton';
import './DriversPage.css';

const AddDriverPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);
  const { branchId: activeBranchId } = useActiveBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [initialFormData, setInitialFormData] = useState({});
  // RBAC roles available to this enterprise — dynamic source for the role
  // selectors (Enterprise Role / Branch Role). New roles show up automatically.
  const [roles, setRoles] = useState([]);
  // When the entered phone already belongs to an enterprise employee, we surface
  // the Import Employee modal instead of creating a duplicate.
  const [importCandidate, setImportCandidate] = useState(null);
  const [importing, setImporting] = useState(false);
  const [documents, setDocuments] = useState({
    driverLicense: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
    panCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
    aadharCard: { file: null, preview: null, imageUrl: null, name: '', documentId: null },
  });

  const businessRefId = getProfileField('business_ref_id') || null;

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // Load the enterprise's available roles for the role selectors.
  useEffect(() => {
    AccessControlApi.getRolesAndCatalog()
      .then((data) => setRoles(data?.roles || []))
      .catch(() => setRoles([]));
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
          status: editing.status || 'PENDING',
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
    // Client-side required checks for creating an employee. The footer submits the
    // form programmatically, which skips native HTML validation, so we validate
    // here and show a clear toast instead of letting the user hit a raw 400.
    if (!isEdit) {
      const missing = [];
      if (!formData.firstName?.trim()) missing.push('First name');
      if (!formData.lastName?.trim()) missing.push('Last name');
      if (!formData.mobileNumber?.trim()) missing.push('Mobile number');
      if (!formData.password) missing.push('Password');
      if (!formData.enterpriseRoleId && !formData.branchRoleId) missing.push('a Role (Enterprise or Branch)');
      if (missing.length) {
        toast.error(`To create an employee, please add: ${missing.join(', ')}.`);
        return;
      }
    }

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
                try { await DriverService.deleteDocument(oldDocId); } catch { /* best effort */ }
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
        if (formData.status !== undefined) updatePayload.status = formData.status;

        await DriverService.updateDriver(businessRefId, driverId, updatePayload);
        await uploadDocuments(driverId);

        toast.success('Employee updated successfully');
        navigate('/drivers');
      } else {
        // The chosen role drives BOTH the assignment and the explicit enum role we
        // send — the backend uses these directly (no server-side derivation).
        const chosenRoleId = formData.branchRoleId || formData.enterpriseRoleId;
        const chosenRole = roles.find((r) => r._id === chosenRoleId);
        const payload = {
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
          email: formData.email || null,
          mobileNumber: formData.mobileNumber || null,
          // Location is a free-text field only shown at the enterprise scope; inside
          // a branch it's implied by the active location, so omit it when empty
          // rather than sending null (the create validator wants a string or nothing).
          ...(formData.location ? { location: formData.location } : {}),
          password: formData.password || null,
          // Explicit enum role (from the chosen RBAC role's baseRole).
          role: chosenRole?.baseRole || undefined,
          // Explicit owning location for this employee (the active branch).
          branchId: activeBranchId || null,
          // Independent Enterprise / Branch role assignments — used to create the
          // EmployeeRoleAssignment. Null = no access at that level.
          enterpriseRoleId: formData.enterpriseRoleId || null,
          branchRoleId: formData.branchRoleId || null,
        };

        const savedEmployee = await DriverService.addDriver(businessRefId, payload);
        // All roles (including field agents, now branch-scoped) return { id, status }.
        const empId = savedEmployee._id || savedEmployee.id || savedEmployee.user?._id;
        await uploadDocuments(empId);

        toast.success('Employee created successfully');
        navigate('/drivers');
      }
    } catch (err) {
      console.error('Add employee error', err);
      // Phone already belongs to someone in the enterprise → offer Import instead
      // of a generic "already exists" error.
      if (err?.code === 'ALREADY_IN_ENTERPRISE' && err?.data?.employee) {
        setImportCandidate(err.data.employee);
        return;
      }
      const msg = err?.message || err?.detail || 'Failed to create/update employee';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmImport = async () => {
    if (!importCandidate?.id) return;
    setImporting(true);
    try {
      await DriverService.importEmployee(importCandidate.id);
      toast.success('Employee imported and activated in this location.');
      setImportCandidate(null);
      navigate('/drivers');
    } catch (err) {
      toast.error(err?.message || err?.detail || 'Failed to import employee');
    } finally {
      setImporting(false);
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
          roles={roles}
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

      {/* Import Employee — shown when the phone already exists in the enterprise. */}
      <Dialog open={!!importCandidate} onOpenChange={(o) => { if (!o && !importing) setImportCandidate(null); }}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader>
            <DialogTitle>Import existing employee</DialogTitle>
            <DialogDescription>
              This phone number already belongs to an employee in your enterprise. Import them into the
              current location instead of creating a duplicate — they become active here and are
              deactivated in their previous location.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            {importCandidate && (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserPlus size={18} />
                </div>
                <div className="text-sm">
                  <div className="font-semibold">
                    {[importCandidate.firstName, importCandidate.lastName].filter(Boolean).join(' ') || 'Employee'}
                  </div>
                  <div className="text-muted-foreground">{importCandidate.mobileNumber}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <Building2 size={13} />
                    Home: {importCandidate.homeBranch?.name || 'Enterprise'}
                  </div>
                </div>
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Their existing records stay with their previous location (history isn't moved). They become
              <strong> active in this location</strong>, and <strong>deactivated</strong> in the previous one —
              where they can no longer be assigned anything.
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

export default AddDriverPage;
