/**
 * The words we use for where a value came from.
 *
 * A value can be read from a photo, read from a printed bill, measured from
 * the truck itself, measured by the tracker, or written down by a person.
 * These are the plain words for those places.
 *
 * A source we do not know stays unknown: it is never turned into a guess, and
 * it never gets a photo badge it did not earn.
 */

/**
 * The one map of a source to its words.
 *
 * The keys are the sources the server sends, written in one style: upper case,
 * with words joined by an underscore.
 */
export const SOURCE_WORDS = {
  // Read from the photo of the bill or of the dash.
  PHOTO: 'photo',
  IMAGE: 'photo',
  OCR: 'photo',
  DASH_PHOTO: 'photo',
  DASH_OCR: 'photo',
  STAMP: 'photo',
  // Read from the printed bill.
  PRINTED: 'printed bill',
  PRINTED_BILL: 'printed bill',
  BILL: 'printed bill',
  // Our own reading of the tank of the truck.
  DETECTED_FILL: "truck's detected fill",
  PREDICTED: "truck's detected fill",
  // The tracker of the truck.
  TRACKER: 'tracker',
  TRACKER_GPS: 'tracker GPS',
  FLEETEDGE: 'tracker',
  // A person wrote it down.
  MANUAL: 'set by a person',
  PERSON: 'set by a person',
  ASSIGNMENT: 'driver linked in the app',
  // Matched to one of the org's places by where the photo or the truck was:
  // nobody typed it.
  ORG: 'matched by location',
  ORG_SITE: 'matched by location',
};

const keyOf = (source) =>
  String(source ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

// The sources that really mean the value was read from a photo.
const PHOTO_SOURCES = new Set(['PHOTO', 'IMAGE', 'OCR', 'DASH_PHOTO', 'DASH_OCR', 'STAMP']);

/**
 * The words for a source, or null when the source is not one we know.
 *
 * A source we do not know is not the same as no source at all: it stays
 * unknown either way, and the caller says so in plain words.
 */
export const sourceWord = (source) => {
  const key = keyOf(source);
  if (!key) return null;
  return Object.prototype.hasOwnProperty.call(SOURCE_WORDS, key) ? SOURCE_WORDS[key] : null;
};

/** True when the source says the value was read from a photo. */
export const isPhotoSource = (source) => PHOTO_SOURCES.has(keyOf(source));

/**
 * The source of a value, in the words a person reads: "Source: photo".
 * When the source is not known: "Source: —".
 */
export const sourceText = (source) => {
  const word = sourceWord(source);
  return word ? `Source: ${word}` : 'Source: —';
};
