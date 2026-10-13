// Add/Edit employee form modals. Split from driversComponents.jsx (WS0.7); markup preserved.
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import NewButton from '@/components/ui/NewButton';

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
    };

    try {
      await onSubmit(driver.id, updateData); // Pass driver ID and updateData
      // Parent handles closing and state update
    } catch (submitError) {
      const errorMessage = submitError?.message || 'Failed to update driver. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!isOpen || !driver) return null;

  return (
    <div
      className="drivers-modal-overlay"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="drivers-modal-content"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
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
                aria-label="First Name"
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
                aria-label="Last Name"
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
                aria-label="Email"
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
                aria-label="Mobile Number"
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
                aria-label="Location"
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
                aria-label="Role"
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
