import { describe, it, expect } from 'vitest';
import {
  getFileObject,
  buildMileagePayload,
  buildFuelLogs,
  buildWeightSlipTrips,
  buildSubmissionFiles,
} from './tripCreationSubmit';

const NOW = 1725000000000;

describe('getFileObject', () => {
  it('unwraps every file-reference shape used by the flow', () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    expect(getFileObject(file)).toBe(file);
    expect(getFileObject({ originalFile: file })).toBe(file);
    expect(getFileObject({ file })).toBe(file);
    expect(getFileObject({ file: { originalFile: file } })).toBe(file);
  });

  it('returns null for empty or non-file refs', () => {
    expect(getFileObject(null)).toBeNull();
    expect(getFileObject(undefined)).toBeNull();
    expect(getFileObject({})).toBeNull();
    expect(getFileObject({ file: { name: 'a.jpg' } })).toBeNull();
  });
});

describe('buildMileagePayload', () => {
  it('defaults to zero and stamps the journey end odometer onto OCR data', () => {
    const mileage = buildMileagePayload(null, undefined, { id: 'v1' });
    expect(mileage).toEqual({
      startOdometer: 0,
      endOdometer: 0,
      totalDistanceKm: 0,
      vehicleId: 'v1',
      ocrData: { reading: 0, correctedReading: 0 },
    });
  });

  it('uses journey mileage data and spreads the odometer OCR payload', () => {
    const odometerOcrData = { tempId: 'odo1', extractedData: { reading: 11900 } };
    const mileage = buildMileagePayload(
      { mileageData: { startOdometer: 12000, endOdometer: 12050, totalDistanceKm: 50 } },
      odometerOcrData,
      null,
    );
    expect(mileage.vehicleId).toBeUndefined();
    expect(mileage.startOdometer).toBe(12000);
    expect(mileage.endOdometer).toBe(12050);
    expect(mileage.totalDistanceKm).toBe(50);
    expect(mileage.ocrData.tempId).toBe('odo1');
    expect(mileage.ocrData.reading).toBe(12050);
    expect(mileage.ocrData.correctedReading).toBe(12050);
  });
});

describe('buildFuelLogs', () => {
  it('is empty without journey fuel data', () => {
    expect(buildFuelLogs({ fuel: null, partialFuel: [] }, null, NOW)).toEqual([]);
  });

  it('emits a FULL_TANK log from journey data with computed cost and OCR fallback location', () => {
    const fixedDocs = {
      fuel: { ocrData: { tempId: 'fuel_ocr_1', extractedData: { location: 'NH-6 Pump' } } },
      partialFuel: [],
    };
    const journeyData = {
      fuelData: { litres: 120, rate: 95.5 },
      mileageData: { endOdometer: 12100 },
    };
    const [log] = buildFuelLogs(fixedDocs, journeyData, NOW);
    expect(log).toMatchObject({
      tempId: 'fuel_ocr_1',
      fuelType: 'DIESEL',
      fillingType: 'FULL_TANK',
      litres: 120,
      rate: 95.5,
      totalCost: 120 * 95.5,
      location: 'NH-6 Pump',
      odometerReading: 12100,
    });
    expect(log.ocrData.correctedData).toEqual({
      litres: 120,
      rate: 95.5,
      totalCost: 120 * 95.5,
    });
  });

  it('generates a tempId when the fuel OCR has none', () => {
    const journeyData = {
      fuelData: { litres: 10, rate: 90 },
      mileageData: { endOdometer: 0 },
    };
    const [log] = buildFuelLogs({ fuel: null, partialFuel: [] }, journeyData, NOW);
    expect(log.tempId).toBe(`temp_fuel_journey_${NOW}`);
    expect(log.location).toBe('');
  });

  it('appends PARTIAL logs with OCR volume/rate fallbacks', () => {
    const fixedDocs = {
      fuel: null,
      partialFuel: [
        {
          ocrData: {
            tempId: 'pf1',
            volume: '25.5',
            extractedData: { rate: '92.25', location: 'City Pump' },
          },
        },
        { ocrData: { litres: '10', rate: '91' } },
      ],
    };
    const logs = buildFuelLogs(fixedDocs, null, NOW);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      tempId: 'pf1',
      fillingType: 'PARTIAL',
      litres: 25.5,
      rate: 92.25,
      location: 'City Pump',
    });
    expect(logs[1]).toMatchObject({
      tempId: `temp_fuel_${NOW}_1`,
      litres: 10,
      rate: 91,
      location: '',
    });
  });
});

describe('buildWeightSlipTrips', () => {
  it('prefers form values over weights over OCR fallbacks', () => {
    const [trip] = buildWeightSlipTrips(
      [
        {
          tempId: 'ws1',
          grossWeight: '28.5',
          weights: { grossWeight: 27, tareWeight: 12, netWeight: 15 },
          ocrData: {
            extractedData: { materialType: 'Stone', ratePerTon: 400, totalAmount: 6000 },
          },
          materialType: 'Sand',
          ratePerTon: '450',
          totalAmountReceived: '6750',
        },
      ],
      NOW,
    );
    expect(trip.tempId).toBe('ws1');
    expect(trip.weights).toEqual({ grossWeight: 28.5, tareWeight: 12, netWeight: 15 });
    expect(trip.materialType).toBe('Sand');
    expect(trip.tripType).toBe('PICKUP_DROP');
    expect(trip.revenue).toEqual({ ratePerTon: 450, actualAmountReceived: 6750 });
    // manuallyCorrected compares against ocrData.extractedData — fields the
    // OCR never produced count as corrections when they end up non-zero.
    expect(trip.ocrData.extractedData.manuallyCorrected).toEqual({
      materialType: true,
      grossWeight: true,
      tareWeight: true,
      netWeight: true,
      ratePerTon: true,
      totalAmount: true,
      materialCost: true,
      toll: true,
      driverCost: true,
      driverTripExpense: true,
      royalty: true,
      otherExpenses: true,
    });
  });

  it('falls back to OCR data and defaults when the slip is untouched', () => {
    const [trip] = buildWeightSlipTrips(
      [
        {
          ocrData: {
            tempId: 'ws_ocr',
            extractedData: {
              materialType: 'Stone',
              grossWeight: 30,
              tareWeight: 12,
              netWeight: 18,
            },
          },
        },
      ],
      NOW,
    );
    expect(trip.tempId).toBe('ws_ocr');
    expect(trip.materialType).toBe('Stone');
    expect(trip.weights).toEqual({ grossWeight: 30, tareWeight: 12, netWeight: 18 });
    expect(trip.notes).toBe('');
    expect(trip.ocrData.extractedData.manuallyCorrected.grossWeight).toBe(false);
  });

  it('generates a tempId when neither slip nor OCR carries one', () => {
    const [trip] = buildWeightSlipTrips([{}], NOW);
    expect(trip.tempId).toMatch(new RegExp(`^temp_ws_${NOW}_[a-z0-9]+$`));
    expect(trip.materialType).toBe('Sand');
    expect(trip.ocrData).toBeNull();
  });
});

describe('buildSubmissionFiles', () => {
  const odoFile = new File(['o'], 'odo.jpg', { type: 'image/jpeg' });
  const fuelFile = new File(['f'], 'fuel.jpg', { type: 'image/jpeg' });
  const partialFile = new File(['p'], 'partial.jpg', { type: 'image/jpeg' });
  const slipFile = new File(['w'], 'slip.jpg', { type: 'image/jpeg' });

  it('maps every attached file to its tempId and aligns payload tempIds', () => {
    const fixedDocs = {
      odometer: { file: odoFile, ocrData: {} },
      fuel: { file: fuelFile, ocrData: {} },
      partialFuel: [{ file: partialFile, ocrData: { tempId: 'pf_ocr' } }],
    };
    const fuelLogs = [{ tempId: 'temp_fuel_journey_1' }, { tempId: 'temp_fuel_2_0' }];
    const weightSlipTrips = [{ tempId: 'temp_ws_1' }];
    const weightSlips = [{ file: { originalFile: slipFile }, ocrData: {} }];

    const {
      files,
      fuelLogs: finalLogs,
      weightSlipTrips: finalTrips,
    } = buildSubmissionFiles(fixedDocs, weightSlips, fuelLogs, weightSlipTrips, NOW);

    expect(files.odometer_image).toBe(odoFile);
    const fullFuelKey = Object.keys(files).find((k) => k.startsWith('fuel_full_'));
    expect(files[fullFuelKey]).toBe(fuelFile);
    expect(files.pf_ocr).toBe(partialFile);
    const slipKey = Object.keys(files).find((k) => k.startsWith('ws_0_'));
    expect(files[slipKey]).toBe(slipFile);

    expect(finalLogs[0].tempId).toBe(fullFuelKey);
    expect(finalLogs[1].tempId).toBe('pf_ocr');
    expect(finalTrips[0].tempId).toBe(slipKey);
    // Inputs are not mutated — purity keeps the draft/summary views stable.
    expect(fuelLogs[0].tempId).toBe('temp_fuel_journey_1');
    expect(weightSlipTrips[0].tempId).toBe('temp_ws_1');
  });

  it('shifts partial fuelLog indexing when there is no full-tank fuel', () => {
    const fixedDocs = {
      odometer: null,
      fuel: null,
      partialFuel: [{ file: partialFile, ocrData: {} }],
    };
    const fuelLogs = [{ tempId: 'temp_fuel_x_0' }];
    const { files, fuelLogs: finalLogs } = buildSubmissionFiles(fixedDocs, [], fuelLogs, [], NOW);
    const key = `fuel_partial_0_${NOW}`;
    expect(files[key]).toBe(partialFile);
    expect(finalLogs[0].tempId).toBe(key);
  });

  it('skips files that fail to resolve and keeps payload tempIds untouched', () => {
    const fixedDocs = { odometer: null, fuel: null, partialFuel: [] };
    const fuelLogs = [{ tempId: 'a' }];
    const trips = [{ tempId: 'b' }];
    const {
      files,
      fuelLogs: finalLogs,
      weightSlipTrips: finalTrips,
    } = buildSubmissionFiles(fixedDocs, [{ file: { preview: 'blob:x' } }], fuelLogs, trips, NOW);
    expect(files).toEqual({});
    expect(finalLogs[0].tempId).toBe('a');
    expect(finalTrips[0].tempId).toBe('b');
  });
});
