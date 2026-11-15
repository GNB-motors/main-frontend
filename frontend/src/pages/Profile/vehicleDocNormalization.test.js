import { describe, it, expect } from 'vitest';
import {
  normalizeDocType,
  isUploadedDoc,
  normalizeVehicleDocuments,
  normalizeVehicleDashboardRow,
  CANONICAL_DOC_TYPES,
} from './vehicleDocNormalization';

describe('normalizeDocType', () => {
  it('correctly normalizes RC and its aliases', () => {
    expect(normalizeDocType('RC')).toBe('RC');
    expect(normalizeDocType('rc')).toBe('RC');
    expect(normalizeDocType('REGISTRATION_CERTIFICATE')).toBe('RC');
    expect(normalizeDocType('registration certificate')).toBe('RC');
    expect(normalizeDocType('  REGISTRATION_CERTIFICATE  ')).toBe('RC');
    expect(normalizeDocType('REG_CERT')).toBe('RC');
  });

  it('correctly normalizes INSURANCE and its aliases', () => {
    expect(normalizeDocType('INSURANCE')).toBe('INSURANCE');
    expect(normalizeDocType('insurance')).toBe('INSURANCE');
    expect(normalizeDocType('INSURANCE_CERTIFICATE')).toBe('INSURANCE');
    expect(normalizeDocType('insurance-certificate')).toBe('INSURANCE');
    expect(normalizeDocType('INS')).toBe('INSURANCE');
    expect(normalizeDocType('POLICY')).toBe('INSURANCE');
  });

  it('correctly normalizes FITNESS and its aliases', () => {
    expect(normalizeDocType('FITNESS')).toBe('FITNESS');
    expect(normalizeDocType('fitness')).toBe('FITNESS');
    expect(normalizeDocType('FITNESS_CERTIFICATE')).toBe('FITNESS');
    expect(normalizeDocType('fitness certificate')).toBe('FITNESS');
    expect(normalizeDocType('FC')).toBe('FITNESS');
    expect(normalizeDocType('fc')).toBe('FITNESS');
    expect(normalizeDocType('FIT')).toBe('FITNESS');
  });

  it('correctly normalizes STATE PERMIT and its aliases', () => {
    expect(normalizeDocType('PERMIT')).toBe('PERMIT');
    expect(normalizeDocType('permit')).toBe('PERMIT');
    expect(normalizeDocType('STATE_PERMIT')).toBe('PERMIT');
    expect(normalizeDocType('state permit')).toBe('PERMIT');
    expect(normalizeDocType('SP')).toBe('PERMIT');
  });

  it('correctly normalizes NATIONAL PERMIT and its aliases', () => {
    expect(normalizeDocType('NATIONAL_PERMIT')).toBe('NATIONAL_PERMIT');
    expect(normalizeDocType('national permit')).toBe('NATIONAL_PERMIT');
    expect(normalizeDocType('NATIONAL_PERMIT_AUTH')).toBe('NATIONAL_PERMIT');
    expect(normalizeDocType('national_permit_auth')).toBe('NATIONAL_PERMIT');
    expect(normalizeDocType('NP')).toBe('NATIONAL_PERMIT');
    expect(normalizeDocType('NPA')).toBe('NATIONAL_PERMIT');
  });

  it('correctly normalizes ROAD TAX and its aliases', () => {
    expect(normalizeDocType('ROAD_TAX')).toBe('ROAD_TAX');
    expect(normalizeDocType('road tax')).toBe('ROAD_TAX');
    expect(normalizeDocType('road-tax')).toBe('ROAD_TAX');
    expect(normalizeDocType('ROADTAX')).toBe('ROAD_TAX');
    expect(normalizeDocType('TAX')).toBe('ROAD_TAX');
  });

  it('correctly normalizes PUCC and its aliases', () => {
    expect(normalizeDocType('PUCC')).toBe('PUCC');
    expect(normalizeDocType('pucc')).toBe('PUCC');
    expect(normalizeDocType('PUC')).toBe('PUCC');
    expect(normalizeDocType('puc')).toBe('PUCC');
    expect(normalizeDocType('POLLUTION')).toBe('PUCC');
    expect(normalizeDocType('pollution')).toBe('PUCC');
    expect(normalizeDocType('POLLUTION_UNDER_CONTROL')).toBe('PUCC');
  });

  it('returns null for unknown or empty doc types', () => {
    expect(normalizeDocType(null)).toBeNull();
    expect(normalizeDocType(undefined)).toBeNull();
    expect(normalizeDocType('')).toBeNull();
    expect(normalizeDocType('RANDOM_DOC_TYPE')).toBeNull();
  });
});

describe('isUploadedDoc', () => {
  it('returns true when uploaded flag is explicitly true', () => {
    expect(isUploadedDoc({ uploaded: true })).toBe(true);
  });

  it('returns false for null, undefined, or empty objects with uploaded: false', () => {
    expect(isUploadedDoc(null)).toBe(false);
    expect(isUploadedDoc(undefined)).toBe(false);
    expect(isUploadedDoc({ uploaded: false })).toBe(false);
  });

  it('returns true when document contains an ID, fileKey, or files array', () => {
    expect(isUploadedDoc({ _id: 'doc-123' })).toBe(true);
    expect(isUploadedDoc({ id: 'doc-123' })).toBe(true);
    expect(isUploadedDoc({ fileKey: 'uploads/vehicles/rc.pdf' })).toBe(true);
    expect(isUploadedDoc({ files: [{ publicUrl: 'https://s3/rc.pdf' }] })).toBe(true);
  });

  it('returns true when document contains expiryDate or OCR status even if uploaded flag is omitted', () => {
    expect(isUploadedDoc({ expiryDate: '2026-12-31' })).toBe(true);
    expect(isUploadedDoc({ ocrStatus: 'PENDING' })).toBe(true);
    expect(isUploadedDoc({ ocrStatus: 'FAILED' })).toBe(true);
  });
});

describe('normalizeVehicleDocuments', () => {
  it('returns all 7 canonical slots initialized for empty input', () => {
    const docs = normalizeVehicleDocuments(null);
    expect(Object.keys(docs)).toEqual(CANONICAL_DOC_TYPES);
    for (const key of CANONICAL_DOC_TYPES) {
      expect(docs[key].uploaded).toBe(false);
      expect(docs[key].status).toBe('MISSING');
    }
  });

  it('normalizes an array of embedded documents from Vehicle.documents', () => {
    const rawArray = [
      { docType: 'RC', expiryDate: '2027-01-01', files: [{ publicUrl: 'https://s3/rc.pdf' }] },
      { docType: 'FITNESS_CERTIFICATE', expiryDate: '2026-08-15', ocrStatus: 'SUCCESS' },
      { docType: 'PUC', expiryDate: '2026-05-10' },
    ];

    const normalized = normalizeVehicleDocuments(rawArray);
    expect(normalized.RC.uploaded).toBe(true);
    expect(normalized.RC.publicUrl).toBe('https://s3/rc.pdf');

    expect(normalized.FITNESS.uploaded).toBe(true);
    expect(normalized.FITNESS.expiryDate).toContain('2026-08-15');

    expect(normalized.PUCC.uploaded).toBe(true);
    expect(normalized.PUCC.expiryDate).toContain('2026-05-10');

    expect(normalized.INSURANCE.uploaded).toBe(false);
    expect(normalized.PERMIT.uploaded).toBe(false);
    expect(normalized.NATIONAL_PERMIT.uploaded).toBe(false);
    expect(normalized.ROAD_TAX.uploaded).toBe(false);
  });

  it('normalizes an object keyed by alias docTypes', () => {
    const rawObj = {
      REGISTRATION_CERTIFICATE: { uploaded: true, expiryDate: '2028-02-01' },
      STATE_PERMIT: { uploaded: true, expiryDate: '2026-11-20' },
      FC: { uploaded: true, expiryDate: '2026-10-15' },
      POLLUTION: { uploaded: true, expiryDate: '2026-04-01' },
    };

    const normalized = normalizeVehicleDocuments(rawObj);
    expect(normalized.RC.uploaded).toBe(true);
    expect(normalized.RC.expiryDate).toContain('2028-02-01');

    expect(normalized.PERMIT.uploaded).toBe(true);
    expect(normalized.PERMIT.expiryDate).toContain('2026-11-20');

    expect(normalized.FITNESS.uploaded).toBe(true);
    expect(normalized.FITNESS.expiryDate).toContain('2026-10-15');

    expect(normalized.PUCC.uploaded).toBe(true);
    expect(normalized.PUCC.expiryDate).toContain('2026-04-01');
  });

  it('deduplicates when both embedded and polymorphic documents exist for same docType', () => {
    const rawList = [
      // Embedded doc without publicUrl
      { docType: 'RC', uploaded: true, expiryDate: '2027-01-01' },
      // Polymorphic doc with publicUrl and verified status
      {
        docType: 'REGISTRATION_CERTIFICATE',
        uploaded: true,
        expiryDate: '2027-01-01',
        publicUrl: 'https://s3/rc_verified.pdf',
        isVerified: true,
      },
    ];

    const normalized = normalizeVehicleDocuments(rawList);
    expect(normalized.RC.uploaded).toBe(true);
    expect(normalized.RC.isVerified).toBe(true);
    expect(normalized.RC.publicUrl).toBe('https://s3/rc_verified.pdf');
  });

  it('handles uploaded document with null expiry date without marking as Missing', () => {
    const rawArray = [{ docType: 'RC', uploaded: true, expiryDate: null, ocrStatus: 'PENDING' }];

    const normalized = normalizeVehicleDocuments(rawArray);
    expect(normalized.RC.uploaded).toBe(true);
    expect(normalized.RC.expiryDate).toBeNull();
    expect(normalized.RC.ocrStatus).toBe('PENDING');
  });

  it('handles document with pending or failed OCR without marking as Missing', () => {
    const rawArray = [{ docType: 'INSURANCE', fileKey: 'uploads/ins.pdf', ocrStatus: 'FAILED' }];

    const normalized = normalizeVehicleDocuments(rawArray);
    expect(normalized.INSURANCE.uploaded).toBe(true);
    expect(normalized.INSURANCE.ocrStatus).toBe('FAILED');
    expect(normalized.INSURANCE.isRejected).toBe(true);
  });
});

describe('normalizeVehicleDashboardRow', () => {
  it('normalizes documents within a vehicle row object', () => {
    const vehicle = {
      _id: 'veh-99',
      registrationNumber: 'WB11S1962',
      model: 'Ashok Leyland 2820',
      documents: [
        { docType: 'REGISTRATION_CERTIFICATE', expiryDate: '2028-06-01' },
        { docType: 'INSURANCE_CERTIFICATE', expiryDate: '2026-09-01' },
        { docType: 'FITNESS_CERTIFICATE', expiryDate: '2026-11-01' },
        { docType: 'STATE_PERMIT', expiryDate: '2027-03-01' },
        { docType: 'NATIONAL_PERMIT_AUTH', expiryDate: '2026-12-01' },
        { docType: 'ROAD_TAX', expiryDate: '2026-10-01' },
        { docType: 'PUC', expiryDate: '2026-07-01' },
      ],
    };

    const row = normalizeVehicleDashboardRow(vehicle);
    expect(row.registrationNumber).toBe('WB11S1962');
    for (const key of CANONICAL_DOC_TYPES) {
      expect(row.documents[key].uploaded).toBe(true);
      expect(row.documents[key].expiryDate).toBeTruthy();
    }
  });
});
