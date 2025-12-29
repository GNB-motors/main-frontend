import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DriverService } from './DriverService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import PageHeader from './Component/PageHeader.jsx';
import BasicInformationForm from './Component/BasicInformationForm.jsx';
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

  const businessRefId = localStorage.getItem('profile_business_ref_id') || null;

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // If navigated here for editing, prefill form from location.state.editingDriver
  useEffect(() => {
    const editing = location?.state?.editingDriver;
    if (editing) {
      setIsEdit(true);
      setDriverId(editing.id || editing._id);
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
    } else {
      // Reset to add mode when no editing driver
      setIsEdit(false);
      setDriverId(null);
      setInitialFormData({});
    }
  }, [location?.state?.editingDriver]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        // Build update payload with only provided fields
        const updatePayload = {};
        if (formData.firstName !== undefined) updatePayload.firstName = formData.firstName;
        if (formData.lastName !== undefined) updatePayload.lastName = formData.lastName;
        if (formData.email !== undefined) updatePayload.email = formData.email;
        if (formData.mobileNumber !== undefined) updatePayload.mobileNumber = formData.mobileNumber;
        if (formData.location !== undefined) updatePayload.location = formData.location;
        if (formData.password) updatePayload.password = formData.password; // only include if non-empty
        if (formData.role !== undefined) updatePayload.role = formData.role;

        await DriverService.updateDriver(businessRefId, driverId, updatePayload);
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

        await DriverService.addDriver(businessRefId, payload);
        toast.success('Employee created successfully');
        navigate('/drivers');
      }
    } catch (err) {
      console.error('Add employee error', err);
      const msg = err?.message || err?.detail || 'Failed to create employee';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
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
