/**
 * Turn the documents fetched for an employee into the Add/Edit page's document
 * state ({ driverLicense, panCard, aadharCard }), each with its preview URL and id.
 */

/**
 * Extract licence number from document or its OCR data payload.
 */
export function extractLicenseNumber(doc) {
  if (!doc) return null;
  if (doc.licenseNumber && typeof doc.licenseNumber === 'string' && doc.licenseNumber.trim()) {
    return doc.licenseNumber.trim();
  }
  const ocr = doc.ocrData || doc.ocr;
  if (!ocr || typeof ocr !== 'object') return null;
  const sources = [ocr.processedData, ocr.rawOcrResponse, ocr.fields, ocr];
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    const val =
      src.licenceNo ||
      src.licenseNo ||
      src.licenseNumber ||
      src.licenceNumber ||
      src.dl_no ||
      src.dlNumber ||
      src.driving_license_number ||
      src.drivingLicenseNumber;
    if (val && typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }
  return null;
}

export function mapFetchedEmployeeDocs(fetchedDocs) {
  const updatedDocs = {
    driverLicense: {
      file: null,
      preview: null,
      imageUrl: null,
      name: '',
      documentId: null,
      isUploaded: false,
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null,
      ocrStatus: null,
      licenseNumber: null,
    },
    panCard: {
      file: null,
      preview: null,
      imageUrl: null,
      name: '',
      documentId: null,
      isUploaded: false,
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null,
    },
    aadharCard: {
      file: null,
      preview: null,
      imageUrl: null,
      name: '',
      documentId: null,
      isUploaded: false,
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null,
    },
  };

  if (Array.isArray(fetchedDocs)) {
    fetchedDocs.forEach((doc) => {
      if (!doc) return;
      const rawType = String(doc.docType || '').toUpperCase();
      // Map API doc types to our state keys (DRIVER_LICENSE, DL, LICENSE)
      const mappedType = {
        DRIVER_LICENSE: 'driverLicense',
        DL: 'driverLicense',
        LICENSE: 'driverLicense',
        PAN: 'panCard',
        AADHAAR: 'aadharCard',
        AADHAR: 'aadharCard',
      }[rawType];

      if (mappedType) {
        const url =
          doc.publicUrl || doc.file_url || doc.fileUrl || doc.url || doc.documentUrl || null;
        const filename =
          doc.originalName ||
          (doc.fileKey ? doc.fileKey.split('/').pop() : '') ||
          doc.name ||
          doc.docType;
        const docId = doc._id || doc.id || null;
        const licenseNum = extractLicenseNumber(doc);

        updatedDocs[mappedType] = {
          file: null,
          preview: url,
          imageUrl: url,
          name: filename,
          originalName: filename,
          documentId: docId,
          isUploaded: Boolean(docId || url || filename),
          isVerified: Boolean(doc.isVerified),
          verifiedAt: doc.verifiedAt || null,
          verifiedBy: doc.verifiedBy || null,
          ocrStatus: doc.ocrData?.processingStatus || doc.ocrStatus || null,
          ocrData: doc.ocrData || null,
          licenseNumber: licenseNum,
        };
      }
    });
  }
  return updatedDocs;
}
