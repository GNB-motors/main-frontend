import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DRIVER');
  const [vehicleRegistrationNo, setVehicleRegistrationNo] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [themeColors, setThemeColors] = useState(getThemeCSS());

  const businessRefId = localStorage.getItem('profile_business_ref_id') || null;

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        // Attempt to fetch vehicles even if businessRefId is not present in localStorage.
        // Some environments populate org context on the server side or return a scoped list.
        console.log('Fetching available vehicles for add-driver page, orgId=', businessRefId);
        const data = await DriverService.getAvailableVehicles(businessRefId, localStorage.getItem('authToken'));
        const normalized = (data || []).map(v => ({
          id: v._id || v.id,
          registration_no: v.registrationNumber || v.registration_no || '',
          vehicle_type: v.vehicleType || v.vehicle_type || '',
        }));
        setAvailableVehicles(normalized);
        console.log('Available vehicles set:', normalized.length);
      } catch (err) {
        console.error('Failed to load vehicles for add page', err);
      }
    };
    fetchVehicles();
  }, [businessRefId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
        mobileNumber: mobileNumber || null,
        location: location || null,
        password: password || null,
        role: role || 'DRIVER',
        ...(vehicleRegistrationNo && { vehicle_registration_no: vehicleRegistrationNo }),
      };

      await DriverService.addDriver(businessRefId, payload);
      toast.success('Employee created successfully');
      navigate('/drivers');
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
        <h2>Add Employee</h2>
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
            <input value={location} onChange={(e) => setLocation(e.target.value)} />
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
          <div className="drivers-form-group">
            <label>Assign Vehicle (optional)</label>
            <select value={vehicleRegistrationNo} onChange={(e) => setVehicleRegistrationNo(e.target.value)}>
              <option value="">Select a vehicle</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.registration_no}>{v.registration_no} - {v.vehicle_type}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="button" className="drivers-btn drivers-btn-secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="drivers-btn drivers-btn-primary" style={{ marginLeft: 8 }} disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Employee'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddDriverPage;
