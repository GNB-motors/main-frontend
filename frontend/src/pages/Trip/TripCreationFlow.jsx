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

    // No API call here - just move to next phase
    // OCR preview data is already stored in state
    setActiveStep(1);
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
      // 1. Prepare mileage data
      // Start odometer: from OCR data (reading property) or extractedData
      const startOdometerRaw = fixedDocs.odometer?.ocrData?.reading || 
                               fixedDocs.odometer?.ocrData?.extractedData?.startOdometer || 
                               fixedDocs.odometer?.ocrData?.extractedData?.reading || 0;
      // Parse numeric value (remove "km" suffix if present)
      const startOdometer = parseFloat(String(startOdometerRaw).replace(/[^\d.]/g, '')) || 0;
      
      // End odometer: from the last weight slip's form entry
      const lastSlip = weightSlips[weightSlips.length - 1];
      const endOdometer = parseFloat(lastSlip?.endOdometer) || startOdometer;
      
      const mileage = {
        startOdometer,
        endOdometer,
        ocrData: fixedDocs.odometer?.ocrData || null, // Include OCR data for backend
      };

      // 2. Prepare fuel logs
      const fuelLogs = [];
      
      // Add full tank fuel if exists
      if (fixedDocs.fuel) {
        // Get fuel data from OCR or form (can be in different properties)
        const fuelData = fixedDocs.fuel.ocrData || {};
        const litres = parseFloat(fuelData.volume || fuelData.litres || fuelData.extractedData?.litres) || 0;
        const rate = parseFloat(fuelData.rate || fuelData.extractedData?.rate) || 0;
        
        fuelLogs.push({
          tempId: fuelData.tempId || `temp_fuel_${Date.now()}`,
          fuelType: 'DIESEL',
          fillingType: 'FULL_TANK',
          litres,
          rate,
          location: fuelData.location || fuelData.extractedData?.location || '',
          ocrData: fixedDocs.fuel.ocrData || null, // Include OCR data
          // For FULL_TANK, include the odometer reading for mileage calculation
          odometerReading: startOdometer,
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
        // Parse numeric values from form inputs (TripForm stores as flat properties)
        const grossWeight = parseFloat(slip.grossWeight) || slip.weights?.grossWeight || slip.ocrData?.extractedData?.grossWeight || 0;
        const tareWeight = parseFloat(slip.tareWeight) || slip.weights?.tareWeight || slip.ocrData?.extractedData?.tareWeight || 0;
        const netWeight = parseFloat(slip.netWeight) || slip.weights?.netWeight || slip.ocrData?.extractedData?.netWeight || 0;
        
        return {
          tempId: slip.tempId || slip.ocrData?.tempId || `temp_ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          materialType: slip.materialType || 'Sand',
          weights: {
            grossWeight,
            tareWeight,
            netWeight,
          },
          routeId: slip.routeId || '',
          revenue: {
            // TripForm uses amountPerKg, backend expects ratePerKg
            ratePerKg: parseFloat(slip.amountPerKg) || slip.revenue?.ratePerKg || 0,
            // TripForm uses totalAmountReceived
            actualAmountReceived: parseFloat(slip.totalAmountReceived) || slip.revenue?.actualAmountReceived || 0,
          },
          expenses: {
            // TripForm uses flat property names
            materialCost: parseFloat(slip.materialCost) || slip.expenses?.materialCost || 0,
            toll: parseFloat(slip.toll) || slip.expenses?.toll || 0,
            driverCost: parseFloat(slip.driverCost) || slip.expenses?.driverCost || 0,
            driverTripExpense: parseFloat(slip.driverTripExpense) || slip.expenses?.driverTripExpense || 0,
            royalty: parseFloat(slip.royalty) || slip.expenses?.royalty || 0,
            otherExpenses: parseFloat(slip.otherExpenses) || slip.expenses?.otherExpenses || 0,
          },
          notes: slip.notes || '',
          ocrData: slip.ocrData || null, // Include OCR data for backend
        };
      });

      // 4. Prepare journey data
      const journeyData = {
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        mileage,
        fuelLogs,
        weightSlipTrips,
      };

      // Debug: Log the data being submitted
      console.log('📤 Submitting Journey Data:', JSON.stringify(journeyData, null, 2));
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
      const response = await TripService.submitCompleteJourney(journeyData, files);

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
  }, [fixedDocs, weightSlips, selectedVehicle, selectedDriver, navigate]);

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
