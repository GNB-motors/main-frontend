/**
 * Action-handler + modal-state hook for the Drivers page.
 * Extracted from DriversPage.jsx (WS0.7) so the page stays under the file-size
 * rule; logic preserved byte-identically.
 */
import { useState } from 'react';
import { toast } from 'react-toastify';
import { DriverService } from './DriverService.jsx';
import { getToken, getBranchId } from '../../utils/session.js';
import { isCrossBranchMove } from './driverList.js';

export function useDriverActions({
  navigate,
  businessRefId,
  drivers,
  setDrivers,
  fetchDrivers,
  setOpenMenuDriverId,
  setActionError,
}) {
  // Modal States
  // isAddModalOpen removed -- Add Employee is now a separate page at /drivers/add
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null); // Driver object to edit
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDriver, setDeletingDriver] = useState(null); // Driver object to delete
  // Employee about to be deactivated in their current branch (confirm modal).
  const [deactivatingDriver, setDeactivatingDriver] = useState(null);
  // Employee whose activation here would move them out of another branch (warn modal).
  const [movingDriver, setMovingDriver] = useState(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for add/edit/delete actions

  const handleOpenEditModal = (driver) => {
    // Navigate to the Add Driver page but pass the driver to edit via location state
    // so the same page can be used for editing with fields pre-filled.
    setOpenMenuDriverId(null); // Close action menu
    navigate('/drivers/add', { state: { editingDriver: driver } });
  };

  const handleOpenDeleteModal = (driver) => {
    setDeletingDriver(driver);
    setIsDeleteModalOpen(true);
    setOpenMenuDriverId(null); // Close action menu
  };

  // Activate a deactivated employee in the current location. If they are still
  // active in a DIFFERENT branch, activating here MOVES them (they get
  // deactivated there) — warn with a modal first. If they were simply
  // deactivated in this same branch, it's a plain re-enable, so run it directly.
  const handleActivateHere = (driver) => {
    setOpenMenuDriverId(null);
    if (isCrossBranchMove(driver, getBranchId())) {
      setMovingDriver(driver);
    } else {
      activateEmployee(driver);
    }
  };

  // Perform the actual activate/import call (shared by the direct path and the
  // "confirm move" modal). The active branch travels via X-Branch-Id (apiClient).
  const activateEmployee = async (driver) => {
    setIsActionSubmitting(true);
    try {
      await DriverService.importEmployee(driver.id);
      toast.success('Employee activated in this location');
      setMovingDriver(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err?.message || err?.detail || 'Could not activate employee here');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Open the confirm modal for deactivating an active employee in this branch.
  const handleOpenDeactivate = (driver) => {
    setOpenMenuDriverId(null);
    setDeactivatingDriver(driver);
  };

  // Deactivate an active employee in their current branch (no move). Suspends
  // their account and greys them out here until reactivated.
  const handleConfirmDeactivate = async (driver) => {
    setIsActionSubmitting(true);
    try {
      await DriverService.deactivateEmployee(driver.id);
      toast.success('Employee deactivated');
      setDeactivatingDriver(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err?.message || err?.detail || 'Could not deactivate employee');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleUpdateDriver = async (driverId, updateData) => {
    const token = getToken();
    if (!token) {
      throw new Error('Missing auth token. Please log in again.');
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      const updatedDriver = await DriverService.updateDriver(businessRefId, driverId, updateData);
      const ud = {
        ...updatedDriver,
        id: updatedDriver.id || updatedDriver._id || updatedDriver._id,
        firstName: updatedDriver.firstName || updatedDriver.first_name || '',
        lastName: updatedDriver.lastName || updatedDriver.last_name || '',
        name:
          updatedDriver.name ||
          `${(updatedDriver.firstName || updatedDriver.first_name || '').trim()} ${(updatedDriver.lastName || updatedDriver.last_name || '').trim()}`.trim(),
      };
      setDrivers((prevDrivers) => prevDrivers.map((d) => (d.id === driverId ? ud : d)));
      setIsEditModalOpen(false); // Close modal on success
      setEditingDriver(null);
      toast.success(`Employee "${updateData.name}" updated successfully!`);
    } catch (apiError) {
      console.error('Failed to update driver:', apiError);
      // Re-throw error for modal display
      throw apiError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = async (driverId) => {
    const token = getToken();
    if (!token) {
      setActionError('Authentication error. Please log in again.');
      return;
    }

    // Find the driver to check if it's the superadmin (although backend should prevent it)
    const driverToDelete = drivers.find((d) => d.id === driverId);
    if (driverToDelete?.is_superadmin) {
      setActionError('Cannot delete the Super Admin account.');
      toast.error('Cannot delete the Super Admin account.');
      setIsDeleteModalOpen(false);
      setDeletingDriver(null);
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await DriverService.deleteDriver(businessRefId, driverId);
      setDrivers((prev) => prev.filter((d) => d.id !== driverId)); // Update UI immediately
      setIsDeleteModalOpen(false); // Close modal on success
      setDeletingDriver(null);
      toast.success('Employee deleted successfully!');
    } catch (err) {
      console.error('Failed to delete employee:', err);
      const errorMessage = err.detail || err.message || 'Failed to delete employee.';
      setActionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEditModalOpen,
    editingDriver,
    isDeleteModalOpen,
    deletingDriver,
    deactivatingDriver,
    movingDriver,
    isActionSubmitting,
    isSubmitting,
    setIsEditModalOpen,
    setEditingDriver,
    setIsDeleteModalOpen,
    setDeletingDriver,
    setDeactivatingDriver,
    setMovingDriver,
    handleOpenEditModal,
    handleOpenDeleteModal,
    handleActivateHere,
    handleOpenDeactivate,
    handleConfirmDeactivate,
    handleUpdateDriver,
    handleDeleteDriver,
    activateEmployee,
  };
}
