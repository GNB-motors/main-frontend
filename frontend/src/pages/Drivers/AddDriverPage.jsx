import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DriverService } from './DriverService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import './DriversPage.css';

const AddDriverPage = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DRIVER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [themeColors, setThemeColors] = useState(getThemeCSS());

  const location = useLocation();

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
      setDriverId(editing.id || editing._id || editing._id);
  setFirstName(editing.firstName || editing.first_name || '');
  setLastName(editing.lastName || editing.last_name || '');
  setEmail(editing.email || '');
  setMobileNumber(editing.mobileNumber || editing.mobile_number || '');
  setLocationValue(editing.location || '');
      setRole(editing.role || 'DRIVER');
      // Do not prefill password
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEdit) {
        // Build update payload with only provided fields
        const updatePayload = {};
        if (firstName !== undefined) updatePayload.firstName = firstName;
        if (lastName !== undefined) updatePayload.lastName = lastName;
        if (email !== undefined) updatePayload.email = email;
  if (mobileNumber !== undefined) updatePayload.mobileNumber = mobileNumber;
  if (locationValue !== undefined) updatePayload.location = locationValue;
        if (password) updatePayload.password = password; // only include if non-empty
        if (role !== undefined) updatePayload.role = role;

        await DriverService.updateDriver(businessRefId, driverId, updatePayload);
        toast.success('Employee updated successfully');
        navigate('/drivers');
      } else {
        const payload = {
          firstName: firstName || null,
          lastName: lastName || null,
          email: email || null,
          mobileNumber: mobileNumber || null,
          location: locationValue || null,
          password: password || null,
          role: role || 'DRIVER',
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

  return (
    <div className="drivers-page" style={themeColors}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} className="drivers-btn drivers-btn-secondary">Back</button>
        <h2>{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
      </div>

      <form className="drivers-add-page-form" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div className="drivers-form-row">
          <div className="drivers-form-group">
            <label>First Name *</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="drivers-form-group">
            <label>Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="drivers-form-row">
          <div className="drivers-form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="drivers-form-group">
            <label>Mobile Number</label>
            <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
          </div>
        </div>

        <div className="drivers-form-row">
          <div className="drivers-form-group">
            <label>Location</label>
            <input value={locationValue} onChange={(e) => setLocationValue(e.target.value)} />
          </div>
          <div className="drivers-form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <div className="drivers-form-row">
          <div className="drivers-form-group">
            <label>Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="button" className="drivers-btn drivers-btn-secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="drivers-btn drivers-btn-primary" style={{ marginLeft: 8 }} disabled={isSubmitting}>{isSubmitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Employee')}</button>
        </div>
      </form>
    </div>
  );
};

export default AddDriverPage;
