/**
 * How an InfoTip's text is laid out: an optional heading and either one
 * paragraph or a short list.
 *
 * - A leading "How we know:" / "About X:" style prefix in the label becomes the
 *   heading, and the same prefix is not repeated in the body.
 * - Explanations written as clauses ("a; b; c" or "a · b · c") read as a wall
 *   of text in a small box: with three or more clauses they become a list.
 *   One or two clauses stay a sentence ("estimated; review before acting").
 * - Anything that is not a string (a React node) is passed through untouched.
 */
const SEPARATOR = /\s*;\s+|\s+·\s+/;
const GENERIC_LABEL = 'What is this?';

export default function infoTipParts(text, label) {
  const heading = label && label !== GENERIC_LABEL ? label.replace(/:\s*$/, '') : null;
  if (typeof text !== 'string') return { heading, items: null, body: text };

  let body = text.trim();
  // "How we know: AutoTrip …" under a "How we know: …" heading says it twice.
  const prefix = body.match(/^(How we know|About|Why)[^:]{0,40}:\s*/i);
  if (prefix && heading && heading.toLowerCase().startsWith(prefix[1].toLowerCase())) {
    body = body.slice(prefix[0].length);
  }
  const parts = body
    .split(SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    return { heading, items: parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)), body: null };
  }
  return { heading, items: null, body };
}
