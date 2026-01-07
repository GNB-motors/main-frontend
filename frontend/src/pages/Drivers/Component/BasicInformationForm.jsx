import React, { useState, useEffect, forwardRef } from 'react';
import UserIcon from '../assets/UserIcon.jsx';
import './BasicInformationForm.css';

const BasicInformationForm = forwardRef(({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  isSubmitting = false,
  isEdit = false 
}, ref) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    mobileNumber: initialData.mobileNumber || '',
    location: initialData.location || '',
    password: initialData.password || '',
    role: initialData.role || 'DRIVER',
  });

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        mobileNumber: initialData.mobileNumber || '',
        location: initialData.location || '',
        password: initialData.password || '',
        role: initialData.role || 'DRIVER',
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="basic-info-wrapper">
      <div className="basic-info-outer-container">
        {/* Header Section */}
        <div className="basic-info-header">
          <div className="basic-info-header-content">
            <div className="basic-info-icon-wrapper">
              <UserIcon width={20} height={20} fill="#454547" />
            </div>
            <div className="basic-info-title">Basic Information</div>
          </div>
        </div>

        {/* Form Container */}
        <div className="basic-info-container">
          <form ref={ref} onSubmit={handleSubmit} className="basic-info-form">
            {/* Row 1: First Name, Last Name */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">First Name *</label>
                <input 
                  type="text"
                  className="basic-info-input"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  placeholder="Enter first name"
                />
              </div>
              
              <div className="basic-info-form-field">
                <label className="basic-info-label">Last Name</label>
                <input 
                  type="text"
                  className="basic-info-input"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Row 2: Email, Mobile Number */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">Email</label>
                <input 
                  type="email"
                  className="basic-info-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              
              <div className="basic-info-form-field">
                <label className="basic-info-label">Mobile Number</label>
                <input 
                  type="tel"
                  className="basic-info-input"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            {/* Row 3: Location, Password */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">Location</label>
                <input 
                  type="text"
                  className="basic-info-input"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter location"
                />
              </div>
              
              <div className="basic-info-form-field">
                <label className="basic-info-label">
                  Password {!isEdit && '*'}
                </label>
                <input 
                  type="password"
                  className={`basic-info-input ${isEdit ? 'basic-info-input-disabled' : ''}`}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required={!isEdit}
                  disabled={isEdit}
                  placeholder={isEdit ? "Cannot be edited" : "Enter password"}
                />
              </div>
            </div>

            {/* Row 4: Role */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">Role</label>
                <select 
                  className="basic-info-input"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                >
                  <option value="DRIVER">Driver</option>
                  <option value="MANAGER">manager</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

BasicInformationForm.displayName = 'BasicInformationForm';

export default BasicInformationForm;
