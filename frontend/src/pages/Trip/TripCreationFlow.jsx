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
import { TripService, OCRService } from './services';
import ProcessingPhase from './phases/ProcessingPhase';
import VerificationPhase from './phases/VerificationPhase';
import JourneySetupModal from '../../components/JourneySetupModal/JourneySetupModal';

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
      'Step 1: Document Intake & OCR Preview',
      'Step 2: Data Entry & Correction',
      'Step 3: Final Verification & Submit'
    ];
    setStepName(steps[activeStep] || '');

    // Cleanup: Clear step name when component unmounts
    return () => setStepName('');
  }, [activeStep, setStepName]);

  // Document state - now includes OCR preview data
  const [fixedDocs, setFixedDocs] = useState({
    odometer: null, // { file, ocrData: { tempId, extractedData, confidence } }
    fuel: null,
    partialFuel: [] // Array of { file, ocrData: { tempId, extractedData } }
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
  const [isIntakeLoading, setIsIntakeLoading] = useState(false);

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
    console.log('🚀 Starting processing - showing journey modal');
    console.log('📊 Modal state before:', { showJourneyModal, selectedVehicle, selectedDriver });
    console.log('📄 Fixed docs:', fixedDocs);
    setShowJourneyModal(true);
    setCurrentIndex(0);
    toast.success('Starting data entry phase...');
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
      // Debug: Log the journey data structure
      console.log('🎯 Journey data structure:', JSON.stringify(journeyData, null, 2));
      // 1. Prepare mileage data from journey setup modal
      const mileage = {
        startOdometer: journeyData?.mileageData?.startOdometer || 0,
        endOdometer: journeyData?.mileageData?.endOdometer || 0,
        totalDistanceKm: journeyData?.mileageData?.totalDistanceKm || 0,
        vehicleId: selectedVehicle?.id, // Pass vehicleId for validation
        ocrData: {
          ...fixedDocs.odometer?.ocrData,
          reading: journeyData?.mileageData?.endOdometer || 0, // Save the journey end odometer
          correctedReading: journeyData?.mileageData?.endOdometer || 0, // Mark as journey-level data
        },
      };

      // 2. Prepare fuel logs from journey setup modal
      const fuelLogs = [];
      
      if (journeyData?.fuelData?.litres && journeyData?.fuelData?.rate) {
        // Use the fuel data from journey setup modal
        fuelLogs.push({
          tempId: fixedDocs.fuel?.ocrData?.tempId || `temp_fuel_journey_${Date.now()}`,
          fuelType: 'DIESEL',
          fillingType: 'FULL_TANK',
          litres: journeyData.fuelData.litres,
          rate: journeyData.fuelData.rate,
          totalCost: journeyData.fuelData.litres * journeyData.fuelData.rate,
          location: fixedDocs.fuel?.ocrData?.extractedData?.location || '',
          // Include original OCR data for reference
          ocrData: {
            ...fixedDocs.fuel?.ocrData,
            // Mark as journey-level corrected data
            correctedData: {
              litres: journeyData.fuelData.litres,
              rate: journeyData.fuelData.rate,
              totalCost: journeyData.fuelData.litres * journeyData.fuelData.rate,
            }
          },
          // For FULL_TANK, include the end odometer reading for mileage calculation
          odometerReading: journeyData.mileageData.endOdometer,
        });
      }

      // Add partial fuel receipts
      if (fixedDocs.partialFuel && fixedDocs.partialFuel.length > 0) {
        fixedDocs.partialFuel.forEach((partialFuel, index) => {
          const fuelData = partialFuel.ocrData || {};
          const litres = parseFloat(fuelData.volume || fuelData.litres || fuelData.extractedData?.litres) || 0;
          const rate = parseFloat(fuelData.rate || fuelData.extractedData?.rate) || 0;
          
          fuelLogs.push({
            tempId: fuelData.tempId || `temp_fuel_${Date.now()}_${index}`,
            fuelType: 'DIESEL',
            fillingType: 'PARTIAL',
            litres,
            rate,
            location: fuelData.location || fuelData.extractedData?.location || '',
            ocrData: partialFuel.ocrData || null, // Include OCR data
          });
        });
      }

      // 3. Prepare weight slip trips
      const weightSlipTrips = weightSlips.map((slip) => {
        // Parse numeric values from form inputs with proper OCR fallbacks
        const grossWeight = parseFloat(slip.grossWeight) || slip.weights?.grossWeight || slip.ocrData?.extractedData?.grossWeight || slip.ocrData?.grossWeight || 0;
        const tareWeight = parseFloat(slip.tareWeight) || slip.weights?.tareWeight || slip.ocrData?.extractedData?.tareWeight || slip.ocrData?.tareWeight || 0;
        const netWeight = parseFloat(slip.netWeight) || slip.weights?.netWeight || slip.ocrData?.extractedData?.netWeight || slip.ocrData?.netWeight || slip.ocrData?.finalWeight || 0;
        
        return {
          tempId: slip.tempId || slip.ocrData?.tempId || `temp_ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          materialType: slip.materialType || slip.ocrData?.extractedData?.materialType || 'Sand',
          weights: {
            grossWeight,
            tareWeight,
            netWeight,
          },
          routeData: slip.routeData || {}, // Use embedded route data
          tripType: slip.tripType || 'PICKUP_DROP', // Include trip type
          revenue: {
            // TripForm uses amountPerKg, backend expects ratePerKg
            ratePerKg: parseFloat(slip.amountPerKg) || slip.revenue?.ratePerKg || slip.ocrData?.extractedData?.ratePerKg || 0,
            // TripForm uses totalAmountReceived
            actualAmountReceived: parseFloat(slip.totalAmountReceived) || slip.revenue?.actualAmountReceived || slip.ocrData?.extractedData?.totalAmount || 0,
          },
          expenses: {
            // TripForm uses flat property names
            materialCost: parseFloat(slip.materialCost) || slip.expenses?.materialCost || slip.ocrData?.extractedData?.materialCost || 0,
            toll: parseFloat(slip.toll) || slip.expenses?.toll || slip.ocrData?.extractedData?.toll || 0,
            driverCost: parseFloat(slip.driverCost) || slip.expenses?.driverCost || slip.ocrData?.extractedData?.driverCost || 0,
            driverTripExpense: parseFloat(slip.driverTripExpense) || slip.expenses?.driverTripExpense || slip.ocrData?.extractedData?.driverTripExpense || 0,
            royalty: parseFloat(slip.royalty) || slip.expenses?.royalty || slip.ocrData?.extractedData?.royalty || 0,
            otherExpenses: parseFloat(slip.otherExpenses) || slip.expenses?.otherExpenses || slip.ocrData?.extractedData?.otherExpenses || 0,
          },
          notes: slip.notes || '',
          // Update OCR data with corrected values
          ocrData: slip.ocrData ? {
            ...slip.ocrData,
            extractedData: {
              ...slip.ocrData.extractedData,
              // Save corrected values back to OCR data for persistence
              materialType: slip.materialType || slip.ocrData.extractedData?.materialType,
              grossWeight: grossWeight,
              tareWeight: tareWeight,
              netWeight: netWeight,
              ratePerKg: parseFloat(slip.amountPerKg) || slip.ocrData.extractedData?.ratePerKg,
              totalAmount: parseFloat(slip.totalAmountReceived) || slip.ocrData.extractedData?.totalAmount,
              materialCost: parseFloat(slip.materialCost) || slip.ocrData.extractedData?.materialCost,
              toll: parseFloat(slip.toll) || slip.ocrData.extractedData?.toll,
              driverCost: parseFloat(slip.driverCost) || slip.ocrData.extractedData?.driverCost,
              driverTripExpense: parseFloat(slip.driverTripExpense) || slip.ocrData.extractedData?.driverTripExpense,
              royalty: parseFloat(slip.royalty) || slip.ocrData.extractedData?.royalty,
              otherExpenses: parseFloat(slip.otherExpenses) || slip.ocrData.extractedData?.otherExpenses,
              // Track manual corrections
              manuallyCorrected: {
                materialType: slip.materialType !== slip.ocrData.extractedData?.materialType,
                grossWeight: grossWeight !== slip.ocrData.extractedData?.grossWeight,
                tareWeight: tareWeight !== slip.ocrData.extractedData?.tareWeight,
                netWeight: netWeight !== slip.ocrData.extractedData?.netWeight,
                ratePerKg: parseFloat(slip.amountPerKg) !== slip.ocrData.extractedData?.ratePerKg,
                totalAmount: parseFloat(slip.totalAmountReceived) !== slip.ocrData.extractedData?.totalAmount,
                materialCost: parseFloat(slip.materialCost) !== slip.ocrData.extractedData?.materialCost,
                toll: parseFloat(slip.toll) !== slip.ocrData.extractedData?.toll,
                driverCost: parseFloat(slip.driverCost) !== slip.ocrData.extractedData?.driverCost,
                driverTripExpense: parseFloat(slip.driverTripExpense) !== slip.ocrData.extractedData?.driverTripExpense,
                royalty: parseFloat(slip.royalty) !== slip.ocrData.extractedData?.royalty,
                otherExpenses: parseFloat(slip.otherExpenses) !== slip.ocrData.extractedData?.otherExpenses,
              }
            }
          } : null,
        };
      });

      // 4. Prepare submission data
      const submissionData = {
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        mileage,
        fuelLogs,
        weightSlipTrips,
      };

      // Debug: Log the data being submitted
      console.log('📤 Submitting Journey Data:', JSON.stringify(submissionData, null, 2));
      console.log('📁 Weight Slips State:', weightSlips);
      console.log('📁 Fixed Docs State:', fixedDocs);

      // 5. Prepare files object with file references
      // Note: FixedDocs stores files as direct File objects (fixedDocs.odometer.file)
      //       WeightSlips stores files as { originalFile: File, preview: string }
      const files = {};
      
      // Helper to extract actual File object from different structures
      const getFileObject = (fileRef) => {
        if (!fileRef) return null;
        if (fileRef instanceof File) return fileRef;
        if (fileRef.originalFile instanceof File) return fileRef.originalFile;
        if (fileRef.file instanceof File) return fileRef.file;
        if (fileRef.file?.originalFile instanceof File) return fileRef.file.originalFile;
        return null;
      };
      
      // Add odometer image
      const odometerFile = getFileObject(fixedDocs.odometer?.file) || getFileObject(fixedDocs.odometer);
      if (odometerFile) {
        files.odometer_image = odometerFile;
        console.log('📷 Odometer file:', odometerFile.name);
      } else {
        console.log('⚠️ No odometer file found');
      }

      // Add fuel slip files
      const fuelFile = getFileObject(fixedDocs.fuel?.file) || getFileObject(fixedDocs.fuel);
      if (fuelFile) {
        const tempId = fixedDocs.fuel.ocrData?.tempId || `fuel_full_${Date.now()}`;
        files[tempId] = fuelFile;
        // Also update the tempId in fuelLogs array to match
        if (fuelLogs.length > 0) {
          fuelLogs[0].tempId = tempId;
        }
        console.log('⛽ Fuel file:', tempId, fuelFile.name);
      }
      
      fixedDocs.partialFuel?.forEach((partialFuel, index) => {
        const partialFile = getFileObject(partialFuel?.file) || getFileObject(partialFuel);
        if (partialFile) {
          const tempId = partialFuel.ocrData?.tempId || `fuel_partial_${index}_${Date.now()}`;
          files[tempId] = partialFile;
          // Update corresponding fuelLog tempId
          const fuelLogIndex = fixedDocs.fuel ? index + 1 : index;
          if (fuelLogs[fuelLogIndex]) {
            fuelLogs[fuelLogIndex].tempId = tempId;
          }
          console.log('⛽ Partial fuel file:', tempId, partialFile.name);
        }
      });

      // Add weight certificate files
      console.log('🔍 Processing weight slips:', weightSlips.length, 'slips');
      weightSlips.forEach((slip, index) => {
        console.log(`🔍 Weight slip ${index}:`, {
          hasSlip: !!slip,
          hasFile: !!slip?.file,
          fileType: slip?.file ? typeof slip.file : 'N/A',
          isFileObject: slip?.file instanceof File,
          hasOriginalFile: !!slip?.file?.originalFile,
          isOriginalFileObject: slip?.file?.originalFile instanceof File,
          slipKeys: slip ? Object.keys(slip) : 'N/A'
        });
        
        const slipFile = getFileObject(slip?.file) || getFileObject(slip);
        console.log(`🔍 Weight slip ${index} file extracted:`, slipFile ? `File: ${slipFile.name}` : 'null');
        
        if (slipFile) {
          const tempId = slip.tempId || slip.ocrData?.tempId || `ws_${index}_${Date.now()}`;
          files[tempId] = slipFile;
          // Update the tempId in weightSlipTrips array to match
          if (weightSlipTrips[index]) {
            weightSlipTrips[index].tempId = tempId;
          }
          console.log('📄 Weight slip file:', tempId, slipFile.name);
        } else {
          console.log('⚠️ No file for weight slip', index, 'slip.file:', slip.file, 'slip.file?.originalFile:', slip.file?.originalFile);
        }
      });
      
      console.log('📁 Total files to upload:', Object.keys(files).length, Object.keys(files));

      // 6. Submit complete journey
      const response = await TripService.submitCompleteJourney(submissionData, files);

      toast.success('Journey submitted successfully!');
      
      // Navigate to trip details page
      navigate(`/trip/${response.data._id}`, { 
        state: { 
          trip: response.data,
          fromCreation: true 
        }
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
  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure? All unsaved data will be lost.')) {
      // Reset all state before navigating
      setActiveStep(0);
      setFixedDocs({ 
        odometer: null, 
        fuel: null, 
        partialFuel: [],
        weightSlips: [] 
      });
      setWeightSlips([]);
      setSelectedVehicle(null);
      setSelectedDriver(null);
      setShowJourneyModal(false);
      setJourneyData(null);
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
          partialFuelData={fixedDocs.partialFuel?.map(pf => pf.ocrData)}
          onSave={handleJourneySubmit}
          onCancel={handleJourneyCancel}
        />
      )}
    </div>
  );
};

export default TripCreationFlow;
