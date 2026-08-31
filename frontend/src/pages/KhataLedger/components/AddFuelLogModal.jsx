import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import FuelLogForm from '@/components/FuelLogForm/FuelLogForm';
import KhataLedgerService from '../KhataLedgerService';

const AddFuelLogModal = ({ open, onClose, driverId, vehicleId, onAdded }) => {
  const [resolvedDriverId, setResolvedDriverId] = useState(driverId || '');
  const [resolvedVehicleId, setResolvedVehicleId] = useState(vehicleId || '');
  const [lockDriver, setLockDriver] = useState(!!driverId);
  const [lockVehicle, setLockVehicle] = useState(!!vehicleId);

  useEffect(() => {
    if (!open) return;

    const resolveContext = async () => {
      const hasDriver = !!driverId;
      const hasVehicle = !!vehicleId;

      setLockDriver(hasDriver);
      setLockVehicle(hasVehicle);
      setResolvedDriverId(driverId || '');
      setResolvedVehicleId(vehicleId || '');

      if (hasDriver && hasVehicle) return;

      try {
        const assignment = await KhataLedgerService.getActiveAssignment({
          driverId: hasDriver ? driverId : undefined,
          vehicleId: hasVehicle ? vehicleId : undefined,
        });

        if (assignment) {
          if (hasVehicle && !hasDriver) {
            setResolvedDriverId(assignment.driverId || '');
          } else if (hasDriver && !hasVehicle) {
            setResolvedVehicleId(assignment.vehicleId || '');
          }
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.warn('Failed to resolve active assignment', err);
        }
      }
    };

    resolveContext();
  }, [open, driverId, vehicleId]);

  const handleSuccess = (fuelLog) => {
    toast.success('Fuel log added');
    onAdded?.(fuelLog);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Fuel Log</DialogTitle>
          <DialogDescription>
            Log a diesel fuel entry. The selected driver/vehicle context is prefilled from active assignments.
          </DialogDescription>
        </DialogHeader>
        <FuelLogForm
          initialVehicleId={resolvedVehicleId}
          initialDriverId={resolvedDriverId}
          lockVehicle={lockVehicle}
          lockDriver={lockDriver}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddFuelLogModal;
