export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const validateImageFile = (file) =>
  VALID_IMAGE_TYPES.includes(file.type) &&
  VALID_IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)) &&
  file.size <= MAX_IMAGE_BYTES;

// OCR endpoint expects its own doc-type vocabulary, keyed off the slot id.
export const ocrDocTypeFor = (docType) => (docType === 'odometer' ? 'ODOMETER' : 'FUEL_RECEIPT');

export const parseOdometerReading = (reading) => {
  const numeric = parseFloat(String(reading).replace(/[^\d.]/g, ''));
  return Number.isNaN(numeric) ? null : numeric;
};

// OCR returns bill datetimes as bare "YYYY-MM-DD HH:mm" strings in IST (+05:30).
export const extractRefuelTime = (ocrData) => {
  const raw = ocrData?.datetime || ocrData?.extractedData?.datetime;
  if (!raw) return undefined;
  const parsed = new Date(String(raw).trim().replace(' ', 'T') + '+05:30');
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

// Document upload responses nest the created doc under data.data or data.
export const extractDocId = (response) => response?.data?.data?._id || response?.data?._id || '';

export const buildDocumentFormData = (doc, docType, entityId) => {
  const formData = new FormData();
  formData.append('file', doc.file);
  formData.append('docType', docType);
  formData.append('entityType', 'VEHICLE');
  formData.append('entityId', entityId);
  if (doc.ocrData) formData.append('ocrData', JSON.stringify(doc.ocrData));
  return formData;
};

export const buildFuelLogPayload = ({
  formData,
  vehicleId,
  driverId,
  documentId,
  odometerDocId,
  refuelTime,
}) => ({
  ...formData,
  vehicleId,
  driverId,
  documentId,
  ...(odometerDocId && { odometerDocId }),
  litres: parseFloat(formData.litres),
  rate: parseFloat(formData.rate),
  odometerReading: formData.odometerReading ? parseFloat(formData.odometerReading) : undefined,
  ...(refuelTime && { refuelTime }),
});

// Maps a successful OCR result onto form fields. Returns a patch (merged into
// existing form state, so absent keys keep their previous values) plus a toast
// descriptor; toast is null when nothing was autofilled.
export const ocrAutofill = (docType, data) => {
  if (docType === 'fuel' && data?.volume) {
    return {
      patch: {
        litres: data.volume,
        ...(data.rate && { rate: data.rate }),
        ...(data.location && { location: data.location }),
      },
      toast: { type: 'success', message: `Autofilled Volume: ${data.volume}L` },
    };
  }
  if (docType === 'odometer' && data?.reading) {
    const numeric = parseOdometerReading(data.reading);
    if (numeric !== null) {
      return {
        patch: { odometerReading: numeric },
        toast: { type: 'success', message: `Autofilled Odometer: ${numeric}` },
      };
    }
    return {
      patch: {},
      toast: { type: 'warning', message: 'Could not parse odometer value. Please enter manually.' },
    };
  }
  return { patch: {}, toast: null };
};
