/**
 * Pure payload builders for the trip-creation flow's single-submission
 * pattern. Extracted verbatim from TripCreationFlow.handleSubmit (WS0.7
 * chassis conversion, rule 14/21) — the API contract is unchanged.
 *
 * `now` is an injected millisecond timestamp so tempId generation is
 * deterministic under test; production passes Date.now().
 */

/**
 * Extract the actual File object from the different file-reference shapes
 * used across the flow (direct File, { originalFile }, { file }, or
 * { file: { originalFile } }).
 */
export const getFileObject = (fileRef) => {
  if (!fileRef) return null;
  if (fileRef instanceof File) return fileRef;
  if (fileRef.originalFile instanceof File) return fileRef.originalFile;
  if (fileRef.file instanceof File) return fileRef.file;
  if (fileRef.file?.originalFile instanceof File) return fileRef.file.originalFile;
  return null;
};

export const buildMileagePayload = (journeyData, odometerOcrData, selectedVehicle) => ({
  startOdometer: journeyData?.mileageData?.startOdometer || 0,
  endOdometer: journeyData?.mileageData?.endOdometer || 0,
  totalDistanceKm: journeyData?.mileageData?.totalDistanceKm || 0,
  vehicleId: selectedVehicle?.id, // Pass vehicleId for validation
  ocrData: {
    ...odometerOcrData,
    reading: journeyData?.mileageData?.endOdometer || 0, // Save the journey end odometer
    correctedReading: journeyData?.mileageData?.endOdometer || 0, // Mark as journey-level data
  },
});

export const buildFuelLogs = (fixedDocs, journeyData, now) => {
  const fuelLogs = [];

  if (journeyData?.fuelData?.litres && journeyData?.fuelData?.rate) {
    // Use the fuel data from journey setup modal
    fuelLogs.push({
      tempId: fixedDocs.fuel?.ocrData?.tempId || `temp_fuel_journey_${now}`,
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
        },
      },
      // For FULL_TANK, include the end odometer reading for mileage calculation
      odometerReading: journeyData.mileageData.endOdometer,
    });
  }

  // Add partial fuel receipts
  if (fixedDocs.partialFuel && fixedDocs.partialFuel.length > 0) {
    fixedDocs.partialFuel.forEach((partialFuel, index) => {
      const fuelData = partialFuel.ocrData || {};
      const litres =
        parseFloat(fuelData.volume || fuelData.litres || fuelData.extractedData?.litres) || 0;
      const rate = parseFloat(fuelData.rate || fuelData.extractedData?.rate) || 0;

      fuelLogs.push({
        tempId: fuelData.tempId || `temp_fuel_${now}_${index}`,
        fuelType: 'DIESEL',
        fillingType: 'PARTIAL',
        litres,
        rate,
        location: fuelData.location || fuelData.extractedData?.location || '',
        ocrData: partialFuel.ocrData || null, // Include OCR data
      });
    });
  }

  return fuelLogs;
};

export const buildWeightSlipTrips = (weightSlips, now) =>
  weightSlips.map((slip) => {
    // Parse numeric values from form inputs with proper OCR fallbacks
    const grossWeight =
      parseFloat(slip.grossWeight) ||
      slip.weights?.grossWeight ||
      slip.ocrData?.extractedData?.grossWeight ||
      slip.ocrData?.grossWeight ||
      0;
    const tareWeight =
      parseFloat(slip.tareWeight) ||
      slip.weights?.tareWeight ||
      slip.ocrData?.extractedData?.tareWeight ||
      slip.ocrData?.tareWeight ||
      0;
    const netWeight =
      parseFloat(slip.netWeight) ||
      slip.weights?.netWeight ||
      slip.ocrData?.extractedData?.netWeight ||
      slip.ocrData?.netWeight ||
      slip.ocrData?.finalWeight ||
      0;

    return {
      tempId:
        slip.tempId ||
        slip.ocrData?.tempId ||
        `temp_ws_${now}_${Math.random().toString(36).substr(2, 9)}`,
      materialType: slip.materialType || slip.ocrData?.extractedData?.materialType || 'Sand',
      weights: {
        grossWeight,
        tareWeight,
        netWeight,
      },
      routeData: slip.routeData || {}, // Use embedded route data
      tripType: slip.tripType || 'PICKUP_DROP', // Include trip type
      revenue: {
        // TripForm uses ratePerTon, backend expects ratePerTon
        ratePerTon:
          parseFloat(slip.ratePerTon) ||
          slip.revenue?.ratePerTon ||
          slip.ocrData?.extractedData?.ratePerTon ||
          0,
        // TripForm uses totalAmountReceived
        actualAmountReceived:
          parseFloat(slip.totalAmountReceived) ||
          slip.revenue?.actualAmountReceived ||
          slip.ocrData?.extractedData?.totalAmount ||
          0,
      },
      expenses: {
        // TripForm uses flat property names
        materialCost:
          parseFloat(slip.materialCost) ||
          slip.expenses?.materialCost ||
          slip.ocrData?.extractedData?.materialCost ||
          0,
        toll:
          parseFloat(slip.toll) || slip.expenses?.toll || slip.ocrData?.extractedData?.toll || 0,
        driverCost:
          parseFloat(slip.driverCost) ||
          slip.expenses?.driverCost ||
          slip.ocrData?.extractedData?.driverCost ||
          0,
        driverTripExpense:
          parseFloat(slip.driverTripExpense) ||
          slip.expenses?.driverTripExpense ||
          slip.ocrData?.extractedData?.driverTripExpense ||
          0,
        royalty:
          parseFloat(slip.royalty) ||
          slip.expenses?.royalty ||
          slip.ocrData?.extractedData?.royalty ||
          0,
        otherExpenses:
          parseFloat(slip.otherExpenses) ||
          slip.expenses?.otherExpenses ||
          slip.ocrData?.extractedData?.otherExpenses ||
          0,
      },
      notes: slip.notes || '',
      // Update OCR data with corrected values
      ocrData: slip.ocrData
        ? {
            ...slip.ocrData,
            extractedData: {
              ...slip.ocrData.extractedData,
              // Save corrected values back to OCR data for persistence
              materialType: slip.materialType || slip.ocrData.extractedData?.materialType,
              grossWeight: grossWeight,
              tareWeight: tareWeight,
              netWeight: netWeight,
              ratePerTon: parseFloat(slip.ratePerTon) || slip.ocrData.extractedData?.ratePerTon,
              totalAmount:
                parseFloat(slip.totalAmountReceived) || slip.ocrData.extractedData?.totalAmount,
              materialCost:
                parseFloat(slip.materialCost) || slip.ocrData.extractedData?.materialCost,
              toll: parseFloat(slip.toll) || slip.ocrData.extractedData?.toll,
              driverCost: parseFloat(slip.driverCost) || slip.ocrData.extractedData?.driverCost,
              driverTripExpense:
                parseFloat(slip.driverTripExpense) || slip.ocrData.extractedData?.driverTripExpense,
              royalty: parseFloat(slip.royalty) || slip.ocrData.extractedData?.royalty,
              otherExpenses:
                parseFloat(slip.otherExpenses) || slip.ocrData.extractedData?.otherExpenses,
              // Track manual corrections
              manuallyCorrected: {
                materialType: slip.materialType !== slip.ocrData.extractedData?.materialType,
                grossWeight: grossWeight !== slip.ocrData.extractedData?.grossWeight,
                tareWeight: tareWeight !== slip.ocrData.extractedData?.tareWeight,
                netWeight: netWeight !== slip.ocrData.extractedData?.netWeight,
                ratePerTon: parseFloat(slip.ratePerTon) !== slip.ocrData.extractedData?.ratePerTon,
                totalAmount:
                  parseFloat(slip.totalAmountReceived) !== slip.ocrData.extractedData?.totalAmount,
                materialCost:
                  parseFloat(slip.materialCost) !== slip.ocrData.extractedData?.materialCost,
                toll: parseFloat(slip.toll) !== slip.ocrData.extractedData?.toll,
                driverCost: parseFloat(slip.driverCost) !== slip.ocrData.extractedData?.driverCost,
                driverTripExpense:
                  parseFloat(slip.driverTripExpense) !==
                  slip.ocrData.extractedData?.driverTripExpense,
                royalty: parseFloat(slip.royalty) !== slip.ocrData.extractedData?.royalty,
                otherExpenses:
                  parseFloat(slip.otherExpenses) !== slip.ocrData.extractedData?.otherExpenses,
              },
            },
          }
        : null,
    };
  });

/**
 * Build the files map keyed by tempId and align tempIds in the payload
 * arrays with the file keys. Pure: returns fresh fuelLogs/weightSlipTrips
 * arrays instead of mutating the inputs, matching the original in-place
 * tempId rewrites.
 */
export const buildSubmissionFiles = (fixedDocs, weightSlips, fuelLogs, weightSlipTrips, now) => {
  const files = {};
  let nextFuelLogs = fuelLogs;
  let nextTrips = weightSlipTrips;

  // Add odometer image
  const odometerFile = getFileObject(fixedDocs.odometer?.file) || getFileObject(fixedDocs.odometer);
  if (odometerFile) {
    files.odometer_image = odometerFile;
  }

  // Add fuel slip files
  const fuelFile = getFileObject(fixedDocs.fuel?.file) || getFileObject(fixedDocs.fuel);
  if (fuelFile) {
    const tempId = fixedDocs.fuel.ocrData?.tempId || `fuel_full_${now}`;
    files[tempId] = fuelFile;
    // Also update the tempId in fuelLogs array to match
    if (fuelLogs.length > 0) {
      nextFuelLogs = fuelLogs.map((log, i) => (i === 0 ? { ...log, tempId } : log));
    }
  }

  fixedDocs.partialFuel?.forEach((partialFuel, index) => {
    const partialFile = getFileObject(partialFuel?.file) || getFileObject(partialFuel);
    if (partialFile) {
      const tempId = partialFuel.ocrData?.tempId || `fuel_partial_${index}_${now}`;
      files[tempId] = partialFile;
      // Update corresponding fuelLog tempId
      const fuelLogIndex = fixedDocs.fuel ? index + 1 : index;
      if (nextFuelLogs[fuelLogIndex]) {
        const resolved = nextFuelLogs;
        nextFuelLogs = resolved.map((log, i) => (i === fuelLogIndex ? { ...log, tempId } : log));
      }
    }
  });

  // Add weight certificate files
  weightSlips.forEach((slip, index) => {
    const slipFile = getFileObject(slip?.file) || getFileObject(slip);

    if (slipFile) {
      const tempId = slip.tempId || slip.ocrData?.tempId || `ws_${index}_${now}`;
      files[tempId] = slipFile;
      // Update the tempId in weightSlipTrips array to match
      if (nextTrips[index]) {
        nextTrips = nextTrips.map((trip, i) => (i === index ? { ...trip, tempId } : trip));
      }
    }
  });

  return { files, fuelLogs: nextFuelLogs, weightSlipTrips: nextTrips };
};
