export const PLACE_LABEL_FONT = '600 12px Arial, sans-serif';
export const PLACE_LABEL_LINE_HEIGHT = 17;
export const PLACE_LABEL_PADDING = 2;

let context;
function measureText(text) {
  // Canvas is available in the browser; the conservative fallback also lets
  // non-browser callers compute a layout without inventing zero-width text.
  if (typeof CanvasRenderingContext2D !== 'undefined' && !context) {
    context = document.createElement('canvas').getContext('2d');
  }
  if (!context) return Array.from(text).length * 12;
  context.font = PLACE_LABEL_FONT;
  return context.measureText(text).width;
}

/** Explicit lines keep browser wrapping and inherited map styles from
 * changing the height after the polygon-fit decision has been made. */
export function placeLabelText(name, maxWidth, measure = measureText) {
  const available = maxWidth - 2 * PLACE_LABEL_PADDING;
  const lines = [];
  let line = '';
  for (const word of name.trim().split(/\s+/u)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= available) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    // A long word may span lines, but its complete text is preserved.
    for (const character of word) {
      if (measure(line + character) > available) {
        if (!line) return null;
        lines.push(line);
        line = '';
      }
      line += character;
    }
    if (lines.length > 3) return null;
  }
  if (line) lines.push(line);
  if (!lines.length || lines.length > 3) return null;
  return {
    lines,
    width: Math.ceil(Math.max(...lines.map(measure))) + 2 * PLACE_LABEL_PADDING,
    height: lines.length * PLACE_LABEL_LINE_HEIGHT + 2 * PLACE_LABEL_PADDING,
  };
}
