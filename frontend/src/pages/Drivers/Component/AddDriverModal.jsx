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
      const errorMessage = submitError?.message || 'Failed to add driver. Please try again.';
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
                aria-label="First Name"
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
                aria-label="Last Name"
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
                aria-label="Email"
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
                aria-label="Mobile Number"
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
                aria-label="Location"
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
                aria-label="Password"
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
                aria-label="Role"
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
