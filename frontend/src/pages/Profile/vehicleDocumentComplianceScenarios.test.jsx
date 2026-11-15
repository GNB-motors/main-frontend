import { describe, it, expect } from 'vitest';
import {
  normalizeDocType,
  normalizeVehicleDocuments,
  normalizeVehicleDashboardRow,
  isUploadedDoc,
} from './vehicleDocNormalization';
import { bucketFor } from './vehicleDashboardLogic';

const NOW = new Date('2026-11-02T12:00:00.000Z');

describe('Vehicle Compliance Documents — 12 Audit Scenarios', () => {
  // Scenario 1: Vehicle with a document stored in Vehicle.documents
  it('Scenario 1: correctly parses and displays document stored in embedded Vehicle.documents', () => {
    const vehicle = {
      _id: 'veh-embedded-1',
      registrationNumber: 'WB11S1962',
      documents: [
        {
          _id: 'subdoc-rc-1',
          docType: 'RC',
          expiryDate: '2028-05-15T00:00:00.000Z',
          files: [{ side: 'FRONT', fileKey: 'keys/rc.jpg', publicUrl: 'https://s3/rc.jpg' }],
          ocr: { status: 'SUCCESS' },
        },
      ],
    };

    const row = normalizeVehicleDashboardRow(vehicle);
    expect(row.documents.RC.uploaded).toBe(true);
    expect(row.documents.RC.publicUrl).toBe('https://s3/rc.jpg');
    expect(row.documents.RC.isVerified).toBe(true);

    const bucket = bucketFor(row.documents.RC, NOW);
    expect(bucket).toBe('verified');
  });

  // Scenario 2: Vehicle with a document stored in the central Document collection
  it('Scenario 2: correctly parses document stored in central polymorphic Document collection', () => {
    const polymorphicDoc = {
      _id: 'poly-doc-1',
      orgId: 'org-1',
      entityType: 'VEHICLE',
      entityId: 'veh-poly-1',
      docType: 'INSURANCE',
      expiryDate: '2027-04-10T00:00:00.000Z',
      fileKey: 'uploads/ins.pdf',
      publicUrl: 'https://s3/ins.pdf',
      isVerified: true,
    };

    const normalized = normalizeVehicleDocuments([polymorphicDoc]);
    expect(normalized.INSURANCE.uploaded).toBe(true);
    expect(normalized.INSURANCE.publicUrl).toBe('https://s3/ins.pdf');
    expect(normalized.INSURANCE.isVerified).toBe(true);

    const bucket = bucketFor(normalized.INSURANCE, NOW);
    expect(bucket).toBe('verified');
  });

  // Scenario 3: Vehicle with documents in both storage locations (deduplication)
  it('Scenario 3: merges documents from both storage locations without duplicates and prefers richer record', () => {
    const mixedDocs = [
      // Embedded doc without publicUrl
      { _id: 'emb-1', docType: 'FITNESS', expiryDate: '2027-02-01T00:00:00.000Z' },
      // Central Document with publicUrl and verification
      {
        _id: 'poly-1',
        docType: 'FITNESS_CERTIFICATE',
        expiryDate: '2027-02-01T00:00:00.000Z',
        publicUrl: 'https://s3/fitness.pdf',
        isVerified: true,
      },
    ];

    const normalized = normalizeVehicleDocuments(mixedDocs);
    expect(normalized.FITNESS.uploaded).toBe(true);
    expect(normalized.FITNESS.publicUrl).toBe('https://s3/fitness.pdf');
    expect(normalized.FITNESS.isVerified).toBe(true);
  });

  // Scenario 4: Document with alias type FITNESS_CERTIFICATE
  it('Scenario 4: recognizes alias FITNESS_CERTIFICATE as canonical FITNESS', () => {
    expect(normalizeDocType('FITNESS_CERTIFICATE')).toBe('FITNESS');
    const vehicle = {
      _id: 'veh-fc',
      documents: {
        FITNESS_CERTIFICATE: { uploaded: true, expiryDate: '2027-09-01T00:00:00.000Z' },
      },
    };

    const row = normalizeVehicleDashboardRow(vehicle);
    expect(row.documents.FITNESS.uploaded).toBe(true);
    expect(bucketFor(row.documents.FITNESS, NOW)).toBe('healthy');
  });

  // Scenario 5: Document with alias type PUC
  it('Scenario 5: recognizes alias PUC and POLLUTION as canonical PUCC', () => {
    expect(normalizeDocType('PUC')).toBe('PUCC');
    expect(normalizeDocType('POLLUTION')).toBe('PUCC');

    const vehicle = {
      _id: 'veh-puc',
      documents: [{ docType: 'PUC', expiryDate: '2027-01-10T00:00:00.000Z' }],
    };

    const row = normalizeVehicleDashboardRow(vehicle);
    expect(row.documents.PUCC.uploaded).toBe(true);
    expect(bucketFor(row.documents.PUCC, NOW)).toBe('healthy');
  });

  // Scenario 6: Uploaded document with null expiry date
  it('Scenario 6: uploaded document with null expiry date is NOT marked as Missing', () => {
    const docEntry = {
      _id: 'doc-null-exp',
      docType: 'ROAD_TAX',
      uploaded: true,
      expiryDate: null,
      ocrStatus: 'PENDING',
    };

    expect(isUploadedDoc(docEntry)).toBe(true);
    const bucket = bucketFor(docEntry, NOW);
    expect(bucket).not.toBe('missing');
    expect(bucket).toBe('pending');
  });

  // Scenario 7: Document with pending OCR
  it('Scenario 7: document with pending OCR is NOT marked as Missing', () => {
    const docEntry = {
      docType: 'NATIONAL_PERMIT',
      fileKey: 'keys/np.jpg',
      ocrStatus: 'PENDING',
      expiryDate: null,
    };

    expect(isUploadedDoc(docEntry)).toBe(true);
    const bucket = bucketFor(docEntry, NOW);
    expect(bucket).toBe('pending');
  });

  // Scenario 8: Expired document
  it('Scenario 8: correctly identifies expired document when expiryDate is in the past', () => {
    const docEntry = {
      docType: 'INSURANCE',
      uploaded: true,
      expiryDate: '2025-01-01T00:00:00.000Z',
    };

    const bucket = bucketFor(docEntry, NOW);
    expect(bucket).toBe('expired');
  });

  // Scenario 9: Missing document
  it('Scenario 9: genuine unuploaded document slot evaluates to missing', () => {
    const docEntry = {
      id: null,
      uploaded: false,
      expiryDate: null,
    };

    expect(isUploadedDoc(docEntry)).toBe(false);
    expect(bucketFor(docEntry, NOW)).toBe('missing');
  });

  // Scenario 10: Document with inaccessible file URL
  it('Scenario 10: document with missing/inaccessible publicUrl is preserved as uploaded rather than missing', () => {
    const docEntry = {
      _id: 'doc-no-url',
      docType: 'PERMIT',
      fileKey: 'keys/permit.pdf',
      publicUrl: null, // inaccessible or expired URL
      expiryDate: '2027-05-01T00:00:00.000Z',
    };

    expect(isUploadedDoc(docEntry)).toBe(true);
    expect(bucketFor(docEntry, NOW)).not.toBe('missing');
  });

  // Scenario 11: Vehicle with multiple documents of the same type
  it('Scenario 11: merges multiple documents of the same type without throwing or creating duplicate keys', () => {
    const duplicateDocs = [
      {
        docType: 'PUCC',
        expiryDate: '2026-01-01T00:00:00.000Z',
        uploadedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        docType: 'PUC',
        expiryDate: '2027-01-01T00:00:00.000Z',
        uploadedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const normalized = normalizeVehicleDocuments(duplicateDocs);
    expect(Object.keys(normalized)).toHaveLength(7);
    expect(normalized.PUCC.uploaded).toBe(true);
    // Newest upload wins
    expect(normalized.PUCC.expiryDate).toContain('2027-01-01');
  });

  // Scenario 12: Vehicle belonging to another organization
  it('Scenario 12: vehicle with no accessible documents returns clean missing defaults', () => {
    const alienVehicle = {
      _id: 'veh-other-org',
      registrationNumber: 'DL01AA0001',
      documents: [],
    };

    const row = normalizeVehicleDashboardRow(alienVehicle);
    expect(row.documents.RC.uploaded).toBe(false);
    expect(row.documents.RC.status).toBe('MISSING');
    expect(bucketFor(row.documents.RC, NOW)).toBe('missing');
  });
});
