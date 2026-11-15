/**
 * The words the photo importer uses with the operator.
 *
 * The reader never shows its working: no confidence, no checksum, no raw line
 * it managed to scrape off the page. It says, in a sentence a driver would
 * understand, what it did with the photo — and if the photo turned out to be
 * something else, it says so without making anybody feel blamed for it.
 */

export const PHOTO_KINDS = [
  { value: '', label: 'Not sure' },
  { value: 'register', label: 'Register page' },
  { value: 'fuel_slip', label: 'Fuel slip' },
  { value: 'pump_display', label: 'Pump display' },
  { value: 'bill', label: 'Bill' },
  { value: 'odometer', label: 'Odometer' },
  { value: 'driving_licence', label: 'Driving licence' },
  { value: 'aadhaar', label: 'Identity document' },
];

/** How the photo LOOKS when it was filed under another heading. */
const AS_PHOTO = {
  register: 'a register page',
  fuel_slip: 'a fuel slip',
  pump_display: 'a pump display',
  bill: 'a bill',
  odometer: 'an odometer photo',
  driving_licence: 'a driving licence',
  aadhaar: 'an identity document',
};

/** What the photo WAS saved as. */
const AS_RECORD = {
  register: 'a register entry',
  fuel_slip: 'a fuel slip',
  pump_display: 'a pump reading',
  bill: 'a bill',
  odometer: 'an odometer reading',
  driving_licence: 'a driving licence',
  aadhaar: 'an identity record',
};

/**
 * The friendly note for a photo that was filed somewhere else. The operator
 * chose one heading and the reader filed it under another; the note says both
 * without repeating the numbers it read.
 *
 * @param {{ code?: string, uploadedAs?: string, filedAs?: string } | null} notice
 * @returns {string}
 */
export function filedElsewhereNote(notice) {
  if (!notice) return '';
  const filedAs = AS_PHOTO[notice.filedAs];
  const savedAs = AS_RECORD[notice.filedAs] || 'that record';
  const uploadedAs = AS_PHOTO[notice.uploadedAs];
  if (!filedAs) return `We've saved this one as ${savedAs}.`;
  if (!uploadedAs) return `This looks like ${filedAs}. We've saved it as ${savedAs}.`;
  return `This looks like ${filedAs}, not ${uploadedAs}. We've saved it as ${savedAs}.`;
}

/**
 * The plain reason a photo has to be retaken. Anything the reader sent that is
 * not a sentence a driver would understand is replaced by a plain one.
 *
 * @param {string | null | undefined} reason
 * @returns {string}
 */
export function retakeReason(reason) {
  const text = String(reason || '').trim();
  if (!text) return 'We could not read this photo. Please take it again in good light.';
  return text;
}
