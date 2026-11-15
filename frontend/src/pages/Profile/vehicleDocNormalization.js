/**
 * Centralized Vehicle Document Normalization & Mapping Utility
 *
 * Provides bidirectional alias normalization, embedded and polymorphic document merging,
 * deduplication, and status evaluation for the Vehicle Compliance Dashboard.
 */

export const CANONICAL_DOC_TYPES = [
  'RC',
  'INSURANCE',
  'PERMIT',
  'NATIONAL_PERMIT',
  'ROAD_TAX',
  'FITNESS',
  'PUCC',
];

/**
 * Aliases mapped to canonical uppercase keys:
 * RC: RC, REGISTRATION_CERTIFICATE, REGISTRATION, REG_CERT
 * Insurance: INSURANCE, INSURANCE_CERTIFICATE, INS, POLICY
 * Fitness: FITNESS, FITNESS_CERTIFICATE, FC, FIT
 * State Permit: PERMIT, STATE_PERMIT, SP
 * National Permit: NATIONAL_PERMIT, NATIONAL_PERMIT_AUTH, NP, NPA
 * Road Tax: ROAD_TAX, ROADTAX, TAX
 * PUCC: PUCC, PUC, POLLUTION, POLLUTION_UNDER_CONTROL, EMISSION
 */
export const DOC_TYPE_ALIASES = {
  // RC
  RC: 'RC',
  REGISTRATION_CERTIFICATE: 'RC',
  REGISTRATION: 'RC',
  REG_CERT: 'RC',
  REG_CERTIFICATE: 'RC',

  // Insurance
  INSURANCE: 'INSURANCE',
  INSURANCE_CERTIFICATE: 'INSURANCE',
  INS: 'INSURANCE',
  POLICY: 'INSURANCE',

  // Fitness
  FITNESS: 'FITNESS',
  FITNESS_CERTIFICATE: 'FITNESS',
  FC: 'FITNESS',
  FIT: 'FITNESS',

  // State Permit
  PERMIT: 'PERMIT',
  STATE_PERMIT: 'PERMIT',
  SP: 'PERMIT',

  // National Permit
  NATIONAL_PERMIT: 'NATIONAL_PERMIT',
  NATIONAL_PERMIT_AUTH: 'NATIONAL_PERMIT',
  NP: 'NATIONAL_PERMIT',
  NPA: 'NATIONAL_PERMIT',

  // Road Tax
  ROAD_TAX: 'ROAD_TAX',
  ROADTAX: 'ROAD_TAX',
  TAX: 'ROAD_TAX',

  // PUCC
  PUCC: 'PUCC',
  PUC: 'PUCC',
  POLLUTION: 'PUCC',
  POLLUTION_UNDER_CONTROL: 'PUCC',
  EMISSION: 'PUCC',
};

/**
 * Normalizes any raw document type string by trimming whitespace,
 * converting to uppercase, replacing spaces/hyphens/slashes with underscores,
 * and matching against known canonical aliases.
 *
 * @param {string} rawType
 * @returns {string|null} Canonical docType ('RC'|'INSURANCE'|'PERMIT'|'NATIONAL_PERMIT'|'ROAD_TAX'|'FITNESS'|'PUCC') or null
 */
export function normalizeDocType(rawType) {
  if (!rawType || typeof rawType !== 'string') return null;
  const clean = rawType
    .trim()
    .toUpperCase()
    .replace(/[\s/-]+/g, '_');

  return DOC_TYPE_ALIASES[clean] || (CANONICAL_DOC_TYPES.includes(clean) ? clean : null);
}

/**
 * Determines whether a document entry represents an existing/uploaded document.
 * Crucial rule: A null expiry date, pending OCR, or failed OCR does NOT mean Missing.
 *
 * @param {Object} docEntry
 * @returns {boolean}
 */
export function isUploadedDoc(docEntry) {
  if (!docEntry || typeof docEntry !== 'object') return false;
  if (docEntry.uploaded === true) return true;
  if (
    docEntry.uploaded === false &&
    !docEntry.id &&
    !docEntry._id &&
    !docEntry.fileKey &&
    !docEntry.files?.length
  ) {
    return false;
  }

  return Boolean(
    docEntry._id ||
    docEntry.id ||
    docEntry.fileKey ||
    (Array.isArray(docEntry.files) && docEntry.files.length > 0) ||
    docEntry.publicUrl ||
    docEntry.url ||
    docEntry.expiryDate ||
    docEntry.ocrStatus ||
    docEntry.ocr ||
    docEntry.uploadedAt ||
    docEntry.createdAt ||
    docEntry.isVerified !== undefined,
  );
}

/**
 * Resolves best available expiry date from various schema shapes:
 * - doc.expiryDate
 * - doc.ocrData?.processedData?.expiryDate / validUpto / policyEndDate / fitnessValidUpto
 * - doc.ocr?.fields?.validUpto / policyEndDate / fitnessValidUpto
 *
 * @param {Object} doc
 * @returns {string|null} ISO date string or null
 */
export function extractExpiryDate(doc) {
  if (!doc) return null;
  const raw =
    doc.expiryDate ||
    doc.ocrData?.processedData?.expiryDate ||
    doc.ocrData?.processedData?.validUpto ||
    doc.ocrData?.processedData?.policyEndDate ||
    doc.ocrData?.processedData?.fitnessValidUpto ||
    doc.ocr?.fields?.expiryDate ||
    doc.ocr?.fields?.validUpto ||
    doc.ocr?.fields?.policyEndDate ||
    doc.ocr?.fields?.fitnessValidUpto ||
    null;

  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Standardizes a single document entry into a consistent shape.
 *
 * @param {Object} rawDoc
 * @param {string} canonicalKey
 * @returns {Object}
 */
export function normalizeSingleDocEntry(rawDoc, canonicalKey) {
  if (!rawDoc || typeof rawDoc !== 'object') {
    return {
      id: null,
      uploaded: false,
      docType: canonicalKey,
      expiryDate: null,
      ocrStatus: null,
      isVerified: false,
      acknowledged: false,
      status: 'MISSING',
      files: [],
    };
  }

  const uploaded = isUploadedDoc(rawDoc);
  const expiryDate = extractExpiryDate(rawDoc);

  const ocrStatus =
    rawDoc.ocrStatus ||
    rawDoc.ocr?.status ||
    rawDoc.processingStatus ||
    rawDoc.ocrData?.processingStatus ||
    null;

  const isVerified = Boolean(
    rawDoc.isVerified ||
    rawDoc.verificationStatus === 'VERIFIED' ||
    rawDoc.status === 'VERIFIED' ||
    ocrStatus === 'SUCCESS',
  );

  const isRejected = Boolean(
    rawDoc.verificationStatus === 'REJECTED' ||
    rawDoc.status === 'REJECTED' ||
    ocrStatus === 'FAILED',
  );

  // File list resolution
  let files = [];
  if (Array.isArray(rawDoc.files) && rawDoc.files.length > 0) {
    files = rawDoc.files;
  } else if (rawDoc.fileKey || rawDoc.publicUrl || rawDoc.url) {
    files = [
      {
        side: rawDoc.side || 'SINGLE',
        fileKey: rawDoc.fileKey || '',
        publicUrl: rawDoc.publicUrl || rawDoc.url || '',
        mimeType: rawDoc.mimeType || '',
        uploadedAt: rawDoc.uploadedAt || rawDoc.createdAt || null,
        name: rawDoc.fileName || rawDoc.name || canonicalKey,
      },
    ];
  }

  const primaryFile = files[0] || {};
  const publicUrl =
    primaryFile.publicUrl || primaryFile.url || rawDoc.publicUrl || rawDoc.url || null;
  const fileName =
    primaryFile.name ||
    rawDoc.fileName ||
    rawDoc.name ||
    (primaryFile.fileKey ? primaryFile.fileKey.split('/').pop() : null);

  return {
    id: rawDoc._id || rawDoc.id || null,
    docType: canonicalKey,
    uploaded,
    expiryDate,
    ocrStatus,
    isVerified,
    isRejected,
    acknowledged: Boolean(rawDoc.acknowledged),
    acknowledgedAt: rawDoc.acknowledgedAt || null,
    uploadedAt: rawDoc.uploadedAt || rawDoc.createdAt || null,
    uploadedBy: rawDoc.uploadedBy || null,
    fileName,
    publicUrl,
    files,
    ocr:
      rawDoc.ocr ||
      (rawDoc.ocrData ? { status: ocrStatus, fields: rawDoc.ocrData.processedData } : null),
  };
}

/**
 * Normalizes vehicle documents from any backend representation:
 * - Embedded Array of subdocuments: `[ { docType: 'RC', ... }, { docType: 'PUC', ... } ]`
 * - Object with canonical or aliased keys: `{ RC: {...}, PUC: {...}, FITNESS_CERTIFICATE: {...} }`
 * - Mixed embedded + polymorphic sources
 *
 * Guarantees a clean object keyed by all 7 canonical document types:
 * `{ RC: {...}, INSURANCE: {...}, PERMIT: {...}, NATIONAL_PERMIT: {...}, ROAD_TAX: {...}, FITNESS: {...}, PUCC: {...} }`
 *
 * @param {Array|Object|null} documentsInput
 * @returns {Record<string, Object>}
 */
export function normalizeVehicleDocuments(documentsInput) {
  const result = {};

  // Initialize all 7 canonical slots as missing default
  for (const key of CANONICAL_DOC_TYPES) {
    result[key] = {
      id: null,
      uploaded: false,
      docType: key,
      expiryDate: null,
      ocrStatus: null,
      isVerified: false,
      acknowledged: false,
      status: 'MISSING',
      files: [],
    };
  }

  if (!documentsInput) return result;

  // Collect candidate doc items
  const candidates = [];

  if (Array.isArray(documentsInput)) {
    // Array format from MongoDB Vehicle.documents or Document collection
    for (const item of documentsInput) {
      if (item && typeof item === 'object') candidates.push(item);
    }
  } else if (typeof documentsInput === 'object') {
    // Object format (e.g. keyed by docType or wrapper)
    for (const [key, value] of Object.entries(documentsInput)) {
      if (value && typeof value === 'object') {
        // If the object value lacks docType, inject the key
        const itemWithKey = value.docType ? value : { ...value, docType: key };
        candidates.push(itemWithKey);
      }
    }
  }

  // Group candidates by canonical docType and merge cleanly without duplicates
  for (const item of candidates) {
    const rawType = item.docType || item.type || item.name;
    const canonicalKey = normalizeDocType(rawType);
    if (!canonicalKey || !CANONICAL_DOC_TYPES.includes(canonicalKey)) continue;

    const existing = result[canonicalKey];
    const normalizedItem = normalizeSingleDocEntry(item, canonicalKey);

    // If no document exists yet for this slot, adopt it
    if (!existing.uploaded) {
      result[canonicalKey] = normalizedItem;
    } else if (normalizedItem.uploaded) {
      // Both existing and new candidate are uploaded: merge, preferring the one with
      // a valid file URL, verified status, or newer upload date
      const preferNew =
        (!existing.publicUrl && Boolean(normalizedItem.publicUrl)) ||
        (!existing.isVerified && normalizedItem.isVerified) ||
        (Boolean(normalizedItem.uploadedAt) &&
          Boolean(existing.uploadedAt) &&
          new Date(normalizedItem.uploadedAt) > new Date(existing.uploadedAt));

      if (preferNew) {
        result[canonicalKey] = {
          ...existing,
          ...normalizedItem,
          // Preserve any existing file keys if new one has none
          files: normalizedItem.files.length > 0 ? normalizedItem.files : existing.files,
        };
      }
    }
  }

  return result;
}

/**
 * Normalizes an entire vehicle row for the fleet dashboard.
 *
 * @param {Object} vehicle
 * @returns {Object} Vehicle row with normalized documents object
 */
export function normalizeVehicleDashboardRow(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') return vehicle;

  const rawDocs = vehicle.documents ?? vehicle.papers ?? vehicle.docs ?? [];
  const normalizedDocs = normalizeVehicleDocuments(rawDocs);

  return {
    ...vehicle,
    documents: normalizedDocs,
  };
}
