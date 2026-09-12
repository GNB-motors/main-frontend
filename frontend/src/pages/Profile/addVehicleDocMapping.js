import { VEHICLE_DOC_TYPES } from './Component/VehicleDocumentUpload.jsx';

// Backend docType → UI slot key, and UI slot key → its full metadata entry.
export const BACKEND_TO_UI = VEHICLE_DOC_TYPES.reduce((acc, d) => {
  acc[d.backendType] = d.key;
  return acc;
}, {});

export const META_BY_KEY = VEHICLE_DOC_TYPES.reduce((acc, d) => {
  acc[d.key] = d;
  return acc;
}, {});

/**
 * Maps the server's document subdocs (one per docType, each with files[]) onto
 * the form's per-slot UI state (one entry per VEHICLE_DOC_TYPES key, one entry
 * per side within it). `emptyDocsState` is the same factory the form uses, so
 * every UI key starts from a shape the form already knows how to render.
 */
export function mapFetchedDocsToUiState(fetchedDocs, emptyDocsState) {
  const updatedDocs = emptyDocsState();
  if (!Array.isArray(fetchedDocs)) return updatedDocs;

  fetchedDocs.forEach((doc) => {
    const uiKey = BACKEND_TO_UI[doc.docType];
    if (!uiKey) return;
    const meta = META_BY_KEY[uiKey];

    updatedDocs[uiKey].documentId = doc._id || doc.id || null;
    updatedDocs[uiKey].expiryDate = doc.expiryDate || null;
    updatedDocs[uiKey].ocrStatus = doc.ocr?.status || null;
    updatedDocs[uiKey].ocrFields = doc.ocr?.fields || null;

    (doc.files || []).forEach((f) => {
      const side = meta.sides.includes(f.side) ? f.side : meta.sides[0] || 'SINGLE';
      updatedDocs[uiKey][side] = {
        file: null,
        preview: f.publicUrl,
        imageUrl: f.publicUrl,
        name: doc.docType,
        isPdf: (f.mimeType || '').includes('pdf'),
      };
    });
  });

  return updatedDocs;
}
