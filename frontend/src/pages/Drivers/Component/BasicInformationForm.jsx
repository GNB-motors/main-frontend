import React, { useState, useEffect, forwardRef } from 'react';
import UserIcon from '../assets/UserIcon.jsx';
import { RoleService } from '../RoleService.jsx';
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
    roleId: initialData.roleId || '',
  });

  // Custom roles created by the Owner under Roles & Permissions. Pre-defined
  // roles (Driver / Manager / Field Agent) are always shown regardless of
  // whether this fetch succeeds — custom roles are an addition on top, not a
  // replacement, so a failed fetch here never blocks adding a plain employee.
  const [customRoles, setCustomRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    RoleService.getRoles()
      .then((data) => {
        if (cancelled) return;
        const roles = (data.roles || []).filter((r) => r.isCustom);
        setCustomRoles(roles);
      })
      .catch((err) => {
        console.error('Failed to load custom roles', err);
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
        roleId: initialData.roleId || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // The dropdown's <option value> encodes both pieces of information the
  // backend needs: which base access level (role) and, for custom roles,
  // which specific Role document (roleId) — e.g. "MANAGER" or
  // "MANAGER:64f...". Splitting it here keeps the <select> a single,
  // simple controlled input instead of two fields the Owner has to keep
  // in sync themselves.
  const handleRoleChange = (value) => {
    const [role, roleId] = value.split(':');
    setFormData(prev => ({ ...prev, role, roleId: roleId || '' }));
  };

  const selectedRoleValue = formData.roleId ? `${formData.role}:${formData.roleId}` : formData.role;

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
                  value={selectedRoleValue}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  disabled={rolesLoading}
                >
                  <option value="DRIVER">Driver</option>
                  <option value="MANAGER">Manager</option>
                  <option value="FIELD_AGENT">Field Agent</option>
                  {customRoles.length > 0 && (
                    <optgroup label="Custom roles">
                      {customRoles.map((r) => (
                        <option key={r._id} value={`${r.baseRole}:${r._id}`}>
                          {r.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
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
