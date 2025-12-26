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

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Move to processing phase after intake
   */
  const handleStartProcessing = useCallback(() => {
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
    setActiveStep(1);
    setCurrentIndex(0);
    toast.success('Starting processing workflow');
  }, [fixedDocs, weightSlips]);

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
          onStartProcessing={handleStartProcessing}
          onCancel={handleCancel}
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
