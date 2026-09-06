/**
 * TripCreationFlow Component
 *
 * Main orchestrator for the 3-phase trip creation flow:
 * Phase 1: Intake (Document sorting and OCR preview)
 * Phase 2: Processing (Data entry and correction)
 * Phase 3: Verification (Final audit and submission)
 *
 * NEW FLOW - Single Submission Pattern:
 * - Phase 1: Upload files, run OCR preview (no DB writes)
 * - Phase 2: User enters/corrects data for each weight slip
 * - Phase 3: Submit everything at once with atomic transaction
 *
 * State Management:
 * - fixedDocs: { odometer: { file, ocrData }, fuel: { file, ocrData }, partialFuel: [] }
 * - weightSlips: Array of { file, tempId, ocrData, routeId, revenue, expenses, weights, materialType }
 * - activeStep: 0 (Intake), 1 (Process), 2 (Verify)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { useTripCreationContext } from '../../contexts/TripCreationContext';
import './TripCreationFlow.css';
import IntakePhase from './phases/IntakePhase';
import { TripService } from './services';
import ProcessingPhase from './phases/ProcessingPhase';
import VerificationPhase from './phases/VerificationPhase';
import JourneySetupModal from '../../components/JourneySetupModal/JourneySetupModal';
import PageShell from '../../components/ui/PageShell';
import NewButton from '../../components/ui/NewButton';
import { useConfirm } from '../../components/ui/confirmContext';
import { getPref, setPref, removePref } from '../../utils/session.js';
import { TRIP_DRAFT_PREF_KEY, serializeTripDraft, parseTripDraft } from './tripDraft';
import {
  buildMileagePayload,
  buildFuelLogs,
  buildWeightSlipTrips,
  buildSubmissionFiles,
} from './tripCreationSubmit';

const STEP_NAMES = [
  'Step 1: Document Intake & OCR Preview',
  'Step 2: Data Entry & Correction',
  'Step 3: Final Verification & Submit',
];

const TripCreationFlow = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { setStepName } = useTripCreationContext();
  useFullPageLayout(); // Apply full-page layout

  // Phase state
  const [activeStep, setActiveStep] = useState(0); // 0: Intake, 1: Processing, 2: Verification
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update navbar with step name whenever activeStep changes
  useEffect(() => {
    setStepName(STEP_NAMES[activeStep] || '');

    // Cleanup: Clear step name when component unmounts
    return () => setStepName('');
  }, [activeStep, setStepName]);

  // Document state - now includes OCR preview data
  const [fixedDocs, setFixedDocs] = useState({
    odometer: null, // { file, ocrData: { tempId, extractedData, confidence } }
    fuel: null,
    partialFuel: [], // Array of { file, ocrData: { tempId, extractedData } }
  });

  // Weight slips now include OCR preview data and user-entered data
  const [weightSlips, setWeightSlips] = useState([]);
  // Structure: [{
  //   file,
  //   tempId,
  //   ocrData: { extractedData, confidence },
  //   materialType, weights, routeId, revenue, expenses, notes
  // }]

  // Vehicle and Driver selection state
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Journey setup modal state
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [journeyData, setJourneyData] = useState(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIntakeLoading] = useState(false);

  // Draft restore (audit §7.16): selections and journey data survive a
  // dropped connection / accidental reload. Photos cannot — the user
  // re-attaches documents after the restore, so the flow restarts at intake.
  useEffect(() => {
    const draft = parseTripDraft(getPref(TRIP_DRAFT_PREF_KEY));
    if (!draft) return;
    if (draft.selectedVehicle) setSelectedVehicle(draft.selectedVehicle);
    if (draft.selectedDriver) setSelectedDriver(draft.selectedDriver);
    if (draft.journeyData) setJourneyData(draft.journeyData);
    if (draft.selectedVehicle || draft.selectedDriver || draft.journeyData) {
      const when = draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString() : 'earlier';
      toast.info(`Draft restored from ${when}. Document photos must be re-attached.`);
    }
  }, []);

  // Persist the draft whenever the restorable slice changes.
  useEffect(() => {
    const raw = serializeTripDraft({ selectedVehicle, selectedDriver, journeyData });
    if (raw) setPref(TRIP_DRAFT_PREF_KEY, raw);
  }, [selectedVehicle, selectedDriver, journeyData]);

  /**
   * Move to processing phase after intake and OCR preview
   * New flow: No DB writes, just validate and move to next phase
   */
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

    // Show journey setup modal instead of directly moving to processing
    setShowJourneyModal(true);
    setCurrentIndex(0);
    toast.success('Starting data entry phase...');
  }, [fixedDocs, weightSlips, selectedVehicle, selectedDriver]);

  /**
   * Update weight slip data
   */
  const updateWeightSlip = useCallback((index, data) => {
    setWeightSlips((prev) => {
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
      setCurrentIndex((prev) => prev + 1);
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
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  /**
   * Jump to specific weight slip by index
   */
  const handleSelectSlip = useCallback(
    (index) => {
      if (index >= 0 && index < weightSlips.length) {
        setCurrentIndex(index);
      }
    },
    [weightSlips.length],
  );

  /**
   * Go back to processing from verification
   */
  const handleBackToProcessing = useCallback(() => {
    setActiveStep(1);
  }, []);

  /**
   * Go back to intake from processing
   */
  const handleBackToIntake = useCallback(() => {
    setActiveStep(0);
  }, []);

  /**
   * Submit complete journey with all data at once (New single submission pattern)
   */
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const now = Date.now();

      // 1-3. Prepare mileage, fuel logs and weight slip trips
      const mileage = buildMileagePayload(
        journeyData,
        fixedDocs.odometer?.ocrData,
        selectedVehicle,
      );
      const fuelLogs = buildFuelLogs(fixedDocs, journeyData, now);
      const weightSlipTrips = buildWeightSlipTrips(weightSlips, now);

      // 4-5. Prepare files and align payload tempIds with the file keys
      const {
        files,
        fuelLogs: finalFuelLogs,
        weightSlipTrips: finalTrips,
      } = buildSubmissionFiles(fixedDocs, weightSlips, fuelLogs, weightSlipTrips, now);

      const submissionData = {
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        mileage,
        fuelLogs: finalFuelLogs,
        weightSlipTrips: finalTrips,
      };

      // 6. Submit complete journey
      const response = await TripService.submitCompleteJourney(submissionData, files);

      toast.success('Journey submitted successfully!');
      removePref(TRIP_DRAFT_PREF_KEY);

      // Navigate to trip details page
      navigate(`/trip/${response.data._id}`, {
        state: {
          trip: response.data,
          fromCreation: true,
        },
      });
    } catch (error) {
      console.error('Failed to submit journey:', error);
      toast.error(error?.message || 'Failed to submit journey');
    } finally {
      setIsSubmitting(false);
    }
  }, [fixedDocs, weightSlips, selectedVehicle, selectedDriver, journeyData, navigate]);

  /**
   * Handle journey data from modal
   */
  const handleJourneySubmit = useCallback((data) => {
    setJourneyData(data);
    setShowJourneyModal(false);
    // Move to processing phase
    setActiveStep(1);
  }, []);

  /**
   * Handle journey modal cancel
   */
  const handleJourneyCancel = useCallback(() => {
    setShowJourneyModal(false);
  }, []);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(async () => {
    const ok = await confirm({
      title: 'Leave without saving?',
      body: 'All unsaved trip data will be lost.',
      confirmLabel: 'Discard trip',
      danger: true,
    });
    if (!ok) return;
    // Reset all state before navigating
    removePref(TRIP_DRAFT_PREF_KEY);
    setActiveStep(0);
    setFixedDocs({
      odometer: null,
      fuel: null,
      partialFuel: [],
      weightSlips: [],
    });
    setWeightSlips([]);
    setSelectedVehicle(null);
    setSelectedDriver(null);
    setShowJourneyModal(false);
    setJourneyData(null);
    navigate('/trip/management');
  }, [confirm, navigate]);

  return (
    <PageShell
      className="trip-creation-flow"
      title="New Trip"
      subtitle={STEP_NAMES[activeStep]}
      actions={<NewButton variant="ghost" size="sm" text="Cancel" onClick={handleCancel} />}
    >
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
          onBackToIntake={handleBackToIntake}
          onCancel={handleCancel}
          selectedVehicle={selectedVehicle}
          journeyData={journeyData}
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
          journeyData={journeyData}
        />
      )}

      {showJourneyModal && (
        <JourneySetupModal
          isOpen={showJourneyModal}
          selectedVehicle={selectedVehicle}
          selectedDriver={selectedDriver}
          odometerOcrData={fixedDocs.odometer?.ocrData}
          fuelSlipData={fixedDocs.fuel?.ocrData}
          partialFuelData={fixedDocs.partialFuel?.map((pf) => pf.ocrData)}
          onSave={handleJourneySubmit}
          onCancel={handleJourneyCancel}
        />
      )}
    </PageShell>
  );
};

export default TripCreationFlow;
