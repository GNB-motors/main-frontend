// Add/Edit employee form modals. Split from driversComponents.jsx (WS0.7); markup preserved.
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import NewButton from '@/components/ui/NewButton';

// --- Add Driver Modal Component ---
export const AddDriverModal = ({ isOpen, onClose, onSubmit, isLoading: isSubmitting }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DRIVER');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (!firstName) {
      setError('First name is required.');
      return;
    }

    const driverData = {
      firstName: firstName || null,
      lastName: lastName || null,
      email: email || null,
      mobileNumber: mobileNumber || null,
      location: location || null,
      password: password || null,
      role: role || 'DRIVER',
    };

    try {
      await onSubmit(driverData);
      // Clear form and close modal on successful submission (handled by parent)
      // No need to clear here if useEffect handles it based on isOpen
    } catch (submitError) {
      const errorMessage = submitError?.detail || 'Failed to add driver. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setMobileNumber('');
      setLocation('');
      setPassword('');
      setRole('DRIVER');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="drivers-modal-overlay" onClick={onClose}>
      <div className="drivers-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="drivers-modal-header">
          <h4>Add New Employee</h4>
          <button onClick={onClose} className="drivers-close-btn">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="drivers-modal-form">
          <div className="drivers-form-row">
            <div className="drivers-form-group">
              <label htmlFor="driverFirstName">First Name *</label>
              <input
                id="driverFirstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="drivers-form-group">
              <label htmlFor="driverLastName">Last Name</label>
              <input
                id="driverLastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="drivers-form-row">
            <div className="drivers-form-group">
              <label htmlFor="driverEmail">Email</label>
              <input
                id="driverEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
            </div>
            <div className="drivers-form-group">
              <label htmlFor="driverMobile">Mobile Number</label>
              <input
                id="driverMobile"
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+919XXXXXXXXX"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="drivers-form-row">
            <div className="drivers-form-group">
              <label htmlFor="driverLocation">Location</label>
              <input
                id="driverLocation"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Pune Base"
                disabled={isSubmitting}
              />
            </div>
            <div className="drivers-form-group">
              <label htmlFor="driverPassword">Password</label>
              <input
                id="driverPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temporary password"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="drivers-form-row">
            <div className="drivers-form-group">
              <label htmlFor="driverRole">Role</label>
              <input
                id="driverRole"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., DRIVER, MANAGER"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && <div className="drivers-error-message">{error}</div>}

          <div className="drivers-modal-actions">
            <NewButton
              variant="secondary"
              size="md"
              type="button"
              text="Cancel"
              onClick={onClose}
              disabled={isSubmitting}
            />
            <NewButton
              variant="primary"
              size="md"
              type="submit"
              text="Add Employee"
              loading={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Edit Driver Modal Component ---
export const EditDriverModal = ({
  isOpen,
  onClose,
  onSubmit,
  driver,
  isLoading: isSubmitting,
  availableVehicles = [],
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [vehicleRegistrationNo, setVehicleRegistrationNo] = useState('');
  const [error, setError] = useState(null);

  // Populate form when driver data is available
  useEffect(() => {
    if (driver) {
      setFirstName(driver.firstName || driver.first_name || '');
      setLastName(driver.lastName || driver.last_name || '');
      setEmail(driver.email || '');
      setMobileNumber(driver.mobileNumber || driver.mobile_number || '');
      setLocation(driver.location || '');
      setRole(driver.role || '');
      setStatus(driver.status || 'PENDING');
      setVehicleRegistrationNo(driver.vehicle_registration_no || ''); // Use vehicle_registration_no from backend
      setError(null);
    }
    // Reset if modal closes or driver changes to null
    if (!isOpen || !driver) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setMobileNumber('');
      setLocation('');
      setRole('');
      setStatus('');
      setVehicleRegistrationNo('');
      setError(null);
    }
  }, [driver, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!firstName) {
      setError('First name is required.');
      return;
    }

    // Prepare only the fields allowed by EmployeeUpdate schema
    const updateData = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || undefined,
      mobileNumber: mobileNumber || undefined,
      location: location || undefined,
      role: role || undefined,
      status: status || undefined,
      vehicle_registration_no: vehicleRegistrationNo || null, // Send null if empty string
    };

    try {
      await onSubmit(driver.id, updateData); // Pass driver ID and updateData
      // Parent handles closing and state update
    } catch (submitError) {
      const errorMessage = submitError?.detail || 'Failed to update driver. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!isOpen || !driver) return null;

  return (
    <div className="drivers-modal-overlay" onClick={onClose}>
      <div className="drivers-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="drivers-modal-header">
          <h4>
            Edit Employee:{' '}
            {`${driver?.firstName || ''} ${driver?.lastName || ''}`.trim() || driver?.name}
          </h4>
          <button onClick={onClose} className="drivers-close-btn">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="drivers-modal-form">
          <div className="drivers-form-row">
            <div className="drivers-form-group">
              <label htmlFor="editDriverFirstName">First Name *</label>
              <input
                id="editDriverFirstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="drivers-form-group">
              <label htmlFor="editDriverLastName">Last Name</label>
              <input
                id="editDriverLastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="drivers-form-row">
            <div className="drivers-form-group">
              <label htmlFor="editDriverEmail">Email</label>
              <input
                id="editDriverEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
            </div>
            <div className="drivers-form-group">
              <label htmlFor="editDriverMobile">Mobile Number</label>
              <input
                id="editDriverMobile"
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+919XXXXXXXXX"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="drivers-form-row">
            <div className="drivers-form-group">
              <label htmlFor="editDriverLocation">Location</label>
              <input
                id="editDriverLocation"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Pune Base"
                disabled={isSubmitting}
              />
            </div>
            <div className="drivers-form-group">
              <label htmlFor="editDriverRole">Role</label>
              <input
                id="editDriverRole"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Driver, Manager"
                disabled={isSubmitting}
              />
            </div>
            <div className="drivers-form-group">
              <label htmlFor="editDriverStatus">Status</label>
              <select
                id="editDriverStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
          <div className="drivers-form-row">
            <div className="drivers-form-group">
              <label htmlFor="editDriverVehicle">Assign Vehicle (Optional)</label>
              <select
                id="editDriverVehicle"
                value={vehicleRegistrationNo}
                onChange={(e) => setVehicleRegistrationNo(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select a vehicle (optional)</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.registration_no}>
                    {vehicle.registration_no} - {vehicle.vehicle_type || 'Unknown Type'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="drivers-error-message">{error}</div>}

          <div className="drivers-modal-actions">
            <NewButton
              variant="secondary"
              size="md"
              type="button"
              text="Cancel"
              onClick={onClose}
              disabled={isSubmitting}
            />
            <NewButton
              variant="primary"
              size="md"
              type="submit"
              text="Save Changes"
              loading={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};
