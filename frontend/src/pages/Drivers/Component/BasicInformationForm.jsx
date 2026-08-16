import React, { useState, useEffect, forwardRef } from 'react';
import UserIcon from '../assets/UserIcon.jsx';
import { useActiveBranch } from '../../../contexts/BranchContext';
import './BasicInformationForm.css';

const BasicInformationForm = forwardRef(({
  initialData = {},
  onSubmit,
  isEdit = false,
  // Dynamic roles available to this enterprise (from the RBAC catalog). Drives
  // both role selectors — new roles appear here automatically, no hardcoding.
  roles = [],
}, ref) => {
  // Inside a location the employee's location is implied by the active branch,
  // so the free-text Location field is redundant and hidden.
  const { branchId } = useActiveBranch();
  const insideBranch = !!branchId;
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    mobileNumber: initialData.mobileNumber || '',
    location: initialData.location || '',
    password: initialData.password || '',
    // Two independent role selections. Empty = null = no access at that level.
    enterpriseRoleId: initialData.enterpriseRoleId || '',
    branchRoleId: initialData.branchRoleId || '',
    status: initialData.status || 'PENDING',
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
        enterpriseRoleId: initialData.enterpriseRoleId || '',
        branchRoleId: initialData.branchRoleId || '',
        status: initialData.status || 'PENDING',
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
                <label className="basic-info-label">Last Name {!isEdit && '*'}</label>
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
                <label className="basic-info-label">Mobile Number {!isEdit && '*'}</label>
                <input
                  type="tel"
                  className="basic-info-input"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            {/* Row 3: Password paired with the scope's role selector.
                - Enterprise ("All locations"): Location + Password (role on Row 4).
                - Inside a location: Location is implied, so Password sits beside the
                  Branch Role selector directly. */}
            <div className="basic-info-form-row">
              {!insideBranch && (
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
              )}

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

              {insideBranch && (
                <div className="basic-info-form-field">
                  <label className="basic-info-label">Branch Role</label>
                  <select
                    className="basic-info-input"
                    value={formData.branchRoleId}
                    onChange={(e) => handleInputChange('branchRoleId', e.target.value)}
                  >
                    <option value="">None (no branch access)</option>
                    {roles.map((r) => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                  <span className="basic-info-hint">Applies to this location.</span>
                </div>
              )}
            </div>

            {/* Row 4: Enterprise role — only at the enterprise ("All locations")
                scope. Inside a location the Branch Role above is the only choice. */}
            {!insideBranch && (
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label className="basic-info-label">Enterprise Role</label>
                  <select
                    className="basic-info-input"
                    value={formData.enterpriseRoleId}
                    onChange={(e) => handleInputChange('enterpriseRoleId', e.target.value)}
                  >
                    <option value="">None (no enterprise access)</option>
                    {roles.map((r) => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                  <span className="basic-info-hint">Grants access across all locations (enterprise).</span>
                </div>
              </div>
            )}

            {!isEdit && (
              <div className="basic-info-form-row">
                <span className="basic-info-hint">* Select at least one role (Enterprise or Branch) to create the employee.</span>
              </div>
            )}

            {isEdit && (
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label className="basic-info-label">Status</label>
                  <select
                    className="basic-info-input"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
            )}

            {roles.length === 0 && (
              <div className="basic-info-form-row">
                <span className="basic-info-hint">
                  No roles are available to your enterprise yet. Ask your administrator to enable roles under
                  Workforce → User Management.
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
});

BasicInformationForm.displayName = 'BasicInformationForm';

export default BasicInformationForm;
