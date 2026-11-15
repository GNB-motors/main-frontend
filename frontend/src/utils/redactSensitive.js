/**
 * Text that comes back from a photo reader is a CLAIM, not a record, and some of
 * it is an identity number that has no business being on a screen other people
 * walk past. Every run of six or more digits is masked before it is rendered.
 *
 * Short digit groups survive on purpose: dates, times, plate numbers and phone
 * numbers are exactly what the operator needs to see, and they are short.
 */
const LONG_DIGIT_RUN = /\d(?:[\d\s]{5,})/g;

/**
 * @param {unknown} value
 * @returns {string} the text with long digit runs masked
 */
export default function safeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(LONG_DIGIT_RUN, '••••').replace(/\s+/g, ' ').trim();
}
