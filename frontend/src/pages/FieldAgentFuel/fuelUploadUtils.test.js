import { describe, it, expect } from 'vitest';
import {
  MAX_IMAGE_BYTES,
  validateImageFile,
  ocrDocTypeFor,
  parseOdometerReading,
  extractRefuelTime,
  extractDocId,
  buildDocumentFormData,
  buildFuelLogPayload,
  ocrAutofill,
} from './fuelUploadUtils';

const makeFile = (name, type, size = 1024) => ({ name, type, size });

describe('validateImageFile', () => {
  it('accepts jpg, jpeg, png and webp images', () => {
    expect(validateImageFile(makeFile('bill.jpg', 'image/jpeg'))).toBe(true);
    expect(validateImageFile(makeFile('bill.jpeg', 'image/jpeg'))).toBe(true);
    expect(validateImageFile(makeFile('bill.png', 'image/png'))).toBe(true);
    expect(validateImageFile(makeFile('bill.webp', 'image/webp'))).toBe(true);
  });

  it('rejects a matching extension with a mismatched MIME type', () => {
    expect(validateImageFile(makeFile('bill.png', 'application/pdf'))).toBe(false);
  });

  it('rejects unsupported extensions', () => {
    expect(validateImageFile(makeFile('bill.gif', 'image/gif'))).toBe(false);
    expect(validateImageFile(makeFile('bill.pdf', 'application/pdf'))).toBe(false);
  });

  it('enforces the 10 MB size cap', () => {
    expect(validateImageFile(makeFile('big.jpg', 'image/jpeg', MAX_IMAGE_BYTES + 1))).toBe(false);
    expect(validateImageFile(makeFile('ok.jpg', 'image/jpeg', MAX_IMAGE_BYTES))).toBe(true);
  });
});

describe('ocrDocTypeFor', () => {
  it('maps the odometer slot to ODOMETER', () => {
    expect(ocrDocTypeFor('odometer')).toBe('ODOMETER');
  });

  it('maps everything else to FUEL_RECEIPT', () => {
    expect(ocrDocTypeFor('fuel')).toBe('FUEL_RECEIPT');
  });
});

describe('parseOdometerReading', () => {
  it('strips non-numeric characters and parses the rest', () => {
    expect(parseOdometerReading('105,450 km')).toBe(105450);
    expect(parseOdometerReading('12.5')).toBe(12.5);
    expect(parseOdometerReading(9876)).toBe(9876);
  });

  it('returns null when nothing parseable remains', () => {
    expect(parseOdometerReading('N/A')).toBeNull();
    expect(parseOdometerReading('')).toBeNull();
  });
});

describe('extractRefuelTime', () => {
  it('returns undefined when the OCR result has no datetime', () => {
    expect(extractRefuelTime(undefined)).toBeUndefined();
    expect(extractRefuelTime({})).toBeUndefined();
  });

  it('reads the datetime from extractedData as a fallback', () => {
    const iso = extractRefuelTime({ extractedData: { datetime: '2026-08-15 10:30' } });
    expect(iso).toBe('2026-08-15T05:00:00.000Z');
  });

  it('parses a bare "YYYY-MM-DD HH:mm" string as IST', () => {
    expect(extractRefuelTime({ datetime: '2026-01-01 00:00' })).toBe('2025-12-31T18:30:00.000Z');
  });

  it('returns undefined for an unparseable datetime', () => {
    expect(extractRefuelTime({ datetime: 'not-a-date' })).toBeUndefined();
  });
});

describe('extractDocId', () => {
  it('prefers data.data._id', () => {
    expect(extractDocId({ data: { data: { _id: 'a' } } })).toBe('a');
    expect(extractDocId({ data: { data: { _id: 'a' }, _id: 'b' } })).toBe('a');
  });

  it('falls back to data._id, then empty string', () => {
    expect(extractDocId({ data: { _id: 'b' } })).toBe('b');
    expect(extractDocId({ data: {} })).toBe('');
    expect(extractDocId(null)).toBe('');
  });
});

describe('buildDocumentFormData', () => {
  it('appends file, doc type, entity and OCR data', () => {
    const file = new File(['x'], 'slip.jpg', { type: 'image/jpeg' });
    const fd = buildDocumentFormData({ file, ocrData: { volume: 20 } }, 'FUEL_SLIP', 'veh-1');
    expect(fd.get('file')).toBe(file);
    expect(fd.get('docType')).toBe('FUEL_SLIP');
    expect(fd.get('entityType')).toBe('VEHICLE');
    expect(fd.get('entityId')).toBe('veh-1');
    expect(fd.get('ocrData')).toBe(JSON.stringify({ volume: 20 }));
  });

  it('omits ocrData when the document has none', () => {
    const fd = buildDocumentFormData(
      { file: new File(['x'], 'odo.jpg', { type: 'image/jpeg' }) },
      'ODOMETER',
      'veh-1',
    );
    expect(fd.get('ocrData')).toBeNull();
  });
});

describe('buildFuelLogPayload', () => {
  const base = {
    formData: {
      fuelType: 'DIESEL',
      fillingType: 'PARTIAL',
      litres: '25.5',
      rate: '95.2',
      odometerReading: '',
      location: 'Reliance Pump',
    },
    vehicleId: 'veh-1',
    driverId: 'drv-1',
    documentId: 'doc-1',
  };

  it('parses numeric fields and keeps the rest of the form', () => {
    const payload = buildFuelLogPayload(base);
    expect(payload.litres).toBe(25.5);
    expect(payload.rate).toBe(95.2);
    expect(payload.odometerReading).toBeUndefined();
    expect(payload.fuelType).toBe('DIESEL');
    expect(payload.location).toBe('Reliance Pump');
    expect(payload.documentId).toBe('doc-1');
    expect(payload).not.toHaveProperty('odometerDocId');
    expect(payload).not.toHaveProperty('refuelTime');
  });

  it('includes odometerDocId and refuelTime only when present', () => {
    const payload = buildFuelLogPayload({
      ...base,
      formData: { ...base.formData, odometerReading: '105450' },
      odometerDocId: 'doc-2',
      refuelTime: '2026-08-15T05:00:00.000Z',
    });
    expect(payload.odometerReading).toBe(105450);
    expect(payload.odometerDocId).toBe('doc-2');
    expect(payload.refuelTime).toBe('2026-08-15T05:00:00.000Z');
  });
});

describe('ocrAutofill', () => {
  it('autofills litres plus rate and location when the fuel OCR has them', () => {
    const { patch, toast } = ocrAutofill('fuel', { volume: 20, rate: 95, location: 'HP Pump' });
    expect(patch).toEqual({ litres: 20, rate: 95, location: 'HP Pump' });
    expect(toast).toEqual({ type: 'success', message: 'Autofilled Volume: 20L' });
  });

  it('omits rate and location from the patch when absent so previous values survive', () => {
    const { patch } = ocrAutofill('fuel', { volume: 20 });
    expect(patch).toEqual({ litres: 20 });
  });

  it('autofills a parseable odometer reading', () => {
    const { patch, toast } = ocrAutofill('odometer', { reading: '105,450' });
    expect(patch).toEqual({ odometerReading: 105450 });
    expect(toast.type).toBe('success');
  });

  it('warns when the odometer reading cannot be parsed', () => {
    const { patch, toast } = ocrAutofill('odometer', { reading: 'N/A' });
    expect(patch).toEqual({});
    expect(toast.type).toBe('warning');
  });

  it('returns no patch and no toast when there is nothing to autofill', () => {
    expect(ocrAutofill('fuel', {})).toEqual({ patch: {}, toast: null });
    expect(ocrAutofill('odometer', {})).toEqual({ patch: {}, toast: null });
  });
});
