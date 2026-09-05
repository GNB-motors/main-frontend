/* Space+drag panning (design-tool convention): while Space is held, any
   pointer drag pans the camera and node-drag is suspended.

   The keydown guard is a pure function so the interactive-vs-chrome rule is
   unit-testable: Space must keep working inside inputs, selects, buttons and
   links, and only be captured when the event target is 'raw' chrome (the
   canvas wrapper, the page body, or any non-interactive element). */

export const SPACE_KEYS = new Set([' ', 'Spacebar']);

/* Selectors for elements that own their own Space behaviour — typing a space,
   or activating a focused button/link. contentEditable matches any value
   other than the explicit false via the attribute selector. */
const INTERACTIVE = 'input, textarea, select, button, a[href], [contenteditable]:not([contenteditable="false"])';

export const isSpaceKey = (key) => SPACE_KEYS.has(key);

/**
 * @param {EventTarget|null} target  e.target of the keydown/keyup
 * @returns {boolean} true when the graph may capture Space (target is the
 *          page/canvas chrome, not an interactive element)
 */
export const shouldCaptureSpace = (target) => {
  if (!target || typeof target.closest !== 'function') return false;
  return !target.closest(INTERACTIVE);
};

/* Cursors for the two space-pan phases. */
export const SPACE_PAN_CURSORS = { ready: 'grab', dragging: 'grabbing' };
