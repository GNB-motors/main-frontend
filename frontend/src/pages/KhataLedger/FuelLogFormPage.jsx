import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Fuel } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import FuelLogForm from '@/components/FuelLogForm/FuelLogForm';
import KhataLedgerService from './KhataLedgerService';
import LedgerPageHeader from './components/LedgerPageHeader';

/**
 * The fuel form carries a receipt dropzone, OCR readback and a dozen fields.
 * It used to live in a 90vh scrolling dialog; on its own route it gets the room
 * it needs and a shareable URL.
 *
 * Driver/vehicle context arrives as ?driverId= / ?vehicleId= and the missing
 * half is resolved from the active assignment.
 */
const FuelLogFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const driverId = searchParams.get('driverId') || '';
  const vehicleId = searchParams.get('vehicleId') || '';
  const returnTo = location.state?.from || '/khata-ledger/transactions';

  const [resolvedDriverId, setResolvedDriverId] = useState(driverId);
  const [resolvedVehicleId, setResolvedVehicleId] = useState(vehicleId);

  useEffect(() => {
    if (!driverId && !vehicleId) return;
    if (driverId && vehicleId) return;

    let cancelled = false;
    const resolve = async () => {
      try {
        const assignment = await KhataLedgerService.getActiveAssignment({
          driverId: driverId || undefined,
          vehicleId: vehicleId || undefined,
        });
        if (cancelled || !assignment) return;
        // The list endpoint populates both refs, so unwrap to the id either way.
        if (vehicleId && !driverId) {
          setResolvedDriverId(assignment.driverId?._id || assignment.driverId || '');
        } else if (driverId && !vehicleId) {
          setResolvedVehicleId(assignment.vehicleId?._id || assignment.vehicleId || '');
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.warn('Could not resolve the active assignment', err);
        }
      }
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [driverId, vehicleId]);

  const handleSuccess = () => {
    toast.success('Fuel logged');
    navigate(returnTo);
  };

  return (
    <div className="space-y-5 p-1">
      <LedgerPageHeader
        title="Add Fuel"
        icon={Fuel}
        description="Log a diesel refill. Upload the receipt and the reading is filled in for you."
        backTo={returnTo}
      />

      <Card className="card-static">
        <CardContent className="p-5">
          <FuelLogForm
            initialVehicleId={resolvedVehicleId}
            initialDriverId={resolvedDriverId}
            lockVehicle={!!vehicleId}
            lockDriver={!!driverId}
            onSuccess={handleSuccess}
            onCancel={() => navigate(returnTo)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FuelLogFormPage;
