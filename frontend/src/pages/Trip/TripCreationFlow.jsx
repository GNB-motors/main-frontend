/**
 * TripCreationFlow Component
 * 
 * Main orchestrator for the 3-phase trip creation flow:
 * Phase 1: Intake (Document sorting and upload)
 * Phase 2: Processing (Side-by-side workspace for data entry)
 * Phase 3: Verification (Final audit and submission)
 * 
 * State Management:
 * - fixedDocs: { odometer: File, fuel: File }
 * - weightSlips: Array of { file, origin, dest, weight, isDone }
 * - activeStep: 0 (Upload), 1 (Process), 2 (Verify)
 * - currentIndex: Active weight slip index
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { useTripCreationContext } from '../../contexts/TripCreationContext';
import './TripCreationFlow.css';
import IntakePhase from './phases/IntakePhase';
import TripService from './services/TripService';
import DocumentService from './services/DocumentService';
import ProcessingPhase from './phases/ProcessingPhase';
import VerificationPhase from './phases/VerificationPhase';

const TripCreationFlow = () => {
  const navigate = useNavigate();
  const { setStepName } = useTripCreationContext();
  useFullPageLayout(); // Apply full-page layout

  // Phase state
  const [activeStep, setActiveStep] = useState(0); // 0: Intake, 1: Processing, 2: Verification
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update navbar with step name whenever activeStep changes
  useEffect(() => {
    const steps = [
      'Step 1: Document Intake',
      'Step 2: Processing Workspace',
      'Step 3: Verification & Submit'
    ];
    setStepName(steps[activeStep] || '');

    // Cleanup: Clear step name when component unmounts
    return () => setStepName('');
  }, [activeStep, setStepName]);

  // Document state
  const [fixedDocs, setFixedDocs] = useState({
    odometer: null,
    fuel: null,
    partialFuel: [] // Array of partial fuel receipts
  });

  const [weightSlips, setWeightSlips] = useState([]);

  // Vehicle and Driver selection state (lifted from IntakePhase)
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Move to processing phase after intake
   */
  const [tripId, setTripId] = useState(null);
  const [isIntakeLoading, setIsIntakeLoading] = useState(false);

  const handleStartProcessing = useCallback(async () => {
    if (!fixedDocs.odometer) {
      toast.error('Please upload an odometer image');
      return;
    }
    // Validate fuel receipt: either full tank OR partial fill receipts required
    if (!fixedDocs.fuel && (!fixedDocs.partialFuel || fixedDocs.partialFuel.length === 0)) {
      toast.error('Please upload a fuel receipt (full tank or partial fill)');
      return;
    }
    if (weightSlips.length === 0) {
      toast.error('Please upload at least one weight slip');
      return;
    }

    if (!selectedVehicle || !selectedDriver) {
      toast.error('Please select a vehicle and driver');
      return;
    }

    setIsIntakeLoading(true);
    try {
      // 1. Initiate trip
      const tripResp = await TripService.initiateTrip({
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id
      });
      const newTripId = tripResp?.tripId || tripResp?.data?.tripId || tripResp?.data?._id || tripResp?._id;
      if (!newTripId) throw new Error('Failed to get tripId from backend');
      setTripId(newTripId);


      // 2. Upload odometer document (to /documents), then associate with trip
      // Sanitize odometer reading for backend (strip units, convert to number)
      let sanitizedOdoOcr = { ...fixedDocs.odometer.ocrData };
      if (sanitizedOdoOcr && sanitizedOdoOcr.reading) {
        const match = sanitizedOdoOcr.reading.toString().replace(/,/g, '').match(/[\d.]+/);
        sanitizedOdoOcr.reading = match ? parseFloat(match[0]) : null;
      }
      const odoDoc = await DocumentService.uploadWithOcrData({
        file: fixedDocs.odometer.file,
        entityType: 'TRIP',
        entityId: newTripId,
        docType: 'ODOMETER',
        ocrData: sanitizedOdoOcr
      });
      await TripService.uploadDocument(newTripId, 'ODOMETER', odoDoc._id, sanitizedOdoOcr);

      // 3. Upload fuel documents (full tank and/or partial)
      if (fixedDocs.fuel) {
        const fuelDoc = await DocumentService.uploadWithOcrData({
          file: fixedDocs.fuel.file,
          entityType: 'TRIP',
          entityId: newTripId,
          docType: 'FUEL_SLIP',
          ocrData: fixedDocs.fuel.ocrData
        });
        await TripService.uploadDocument(newTripId, 'FUEL_SLIP', fuelDoc._id, fixedDocs.fuel.ocrData);
      }
      if (fixedDocs.partialFuel && fixedDocs.partialFuel.length > 0) {
        for (const fuel of fixedDocs.partialFuel) {
          const partialDoc = await DocumentService.uploadWithOcrData({
            file: fuel.file.originalFile,
            entityType: 'TRIP',
            entityId: newTripId,
            docType: 'FUEL_SLIP',
            ocrData: fuel.file.ocrData
          });
          await TripService.uploadDocument(newTripId, 'FUEL_SLIP', partialDoc._id, fuel.file.ocrData);
        }
      }

      // 4. Upload weight slips (ensure docType and ocrData are correct)
      for (const slip of weightSlips) {
        const slipDoc = await DocumentService.uploadWithOcrData({
          file: slip.file.originalFile,
          entityType: 'TRIP',
          entityId: newTripId,
          docType: 'WEIGHT_CERTIFICATE',
          ocrData: slip.ocrData || (slip.file && slip.file.ocrData) || undefined
        });
        await TripService.uploadDocument(newTripId, 'WEIGHT_CERTIFICATE', slipDoc._id, slip.ocrData || (slip.file && slip.file.ocrData) || undefined);
      }

      setActiveStep(1);
      setCurrentIndex(0);
      toast.success('Trip initialized and documents uploaded!');
    } catch (error) {
      console.error('Trip initialization/upload failed:', error);
      toast.error(error?.message || 'Failed to initialize trip or upload documents');
    } finally {
      setIsIntakeLoading(false);
    }
  }, [fixedDocs, weightSlips, selectedVehicle, selectedDriver]);

  /**
   * Update weight slip data
   */
  const updateWeightSlip = useCallback((index, data) => {
    setWeightSlips(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
  }, []);

  /**
   * Move to next weight slip in processing
   */
  const handleNextSlip = useCallback(() => {
    if (currentIndex < weightSlips.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // All slips processed, move to verification
      setActiveStep(2);
    }
  }, [currentIndex, weightSlips.length]);

  /**
   * Move to previous weight slip
   */
  const handlePreviousSlip = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  /**
   * Jump to specific weight slip by index
   */
  const handleSelectSlip = useCallback((index) => {
    if (index >= 0 && index < weightSlips.length) {
      setCurrentIndex(index);
    }
  }, [weightSlips.length]);

  /**
   * Go back to processing from verification
   */
  const handleBackToProcessing = useCallback(() => {
    setActiveStep(1);
  }, []);

  /**
   * Submit the complete trip data
   */
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Prepare trip data
      const tripData = {
        fixedDocs: {
          odometerS3: fixedDocs.odometer?.s3Url || fixedDocs.odometer?.preview,
          fuelS3: fixedDocs.fuel?.s3Url || fixedDocs.fuel?.preview,
          partialFuelS3: (fixedDocs.partialFuel || []).map(fuel => ({
            s3Url: fuel.file?.s3Url || fuel.file?.preview,
            fuelType: fuel.fuelType,
            index: fuel.index
          }))
        },
        weightSlips: weightSlips.map(slip => ({
          thumbnailS3: slip.file?.s3Url || slip.file?.preview,
          origin: slip.origin,
          destination: slip.destination,
          weight: slip.weight,
          isDone: slip.isDone
        }))
      };

      // TODO: Submit to backend API
      console.log('Submitting trip data:', tripData);
      toast.success('Trip created successfully!');
      
      // Redirect to trip management
      navigate('/trip/management');
    } catch (error) {
      console.error('Failed to submit trip:', error);
      toast.error(error?.message || 'Failed to submit trip');
    } finally {
      setIsSubmitting(false);
    }
  }, [fixedDocs, weightSlips, navigate]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure? All unsaved data will be lost.')) {
      navigate('/trip/management');
    }
  }, [navigate]);

  return (
    <div className="trip-creation-flow">
      {activeStep === 0 && (
        <IntakePhase
          fixedDocs={fixedDocs}
          setFixedDocs={setFixedDocs}
          weightSlips={weightSlips}
          setWeightSlips={setWeightSlips}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          selectedDriver={selectedDriver}
          setSelectedDriver={setSelectedDriver}
          onStartProcessing={handleStartProcessing}
          onCancel={handleCancel}
          tripId={tripId}
          isIntakeLoading={isIntakeLoading}
        />
      )}

      {activeStep === 1 && (
        <ProcessingPhase
          fixedDocs={fixedDocs}
          weightSlips={weightSlips}
          currentIndex={currentIndex}
          updateWeightSlip={updateWeightSlip}
          onNextSlip={handleNextSlip}
          onPreviousSlip={handlePreviousSlip}
          onSelectSlip={handleSelectSlip}
          onCancel={handleCancel}
        />
      )}

      {activeStep === 2 && (
        <VerificationPhase
          fixedDocs={fixedDocs}
          weightSlips={weightSlips}
          onBack={handleBackToProcessing}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default TripCreationFlow;
