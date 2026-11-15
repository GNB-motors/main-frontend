import { describe, expect, it } from 'vitest';
import { placeLabelText } from './placeLabelText.js';

describe('measured place-name layout', () => {
  // Chrome renders PANCHGHARA at ~85.78px in the label font. The previous
  // character estimate allocated 75px and clipped its second line.
  const wideLetters = (text) => Array.from(text).length * 8.578;

  it('allocates enough space for the screenshot name instead of clipping its ending', () => {
    const label = placeLabelText('PANCHGHARA', 160, wideLetters);
    expect(label.lines).toEqual(['PANCHGHARA']);
    expect(label.width).toBe(90);
    expect(label.height).toBe(21);
  });

  it('preserves the full word when a narrow area needs multiple lines', () => {
    const label = placeLabelText('PANCHGHARA', 72, wideLetters);
    expect(label.lines.join('')).toBe('PANCHGHARA');
    expect(label.lines).toHaveLength(2);
    expect(label.height).toBe(38);
    expect(label.width).toBeLessThanOrEqual(72);
  });

  it('wraps at word boundaries and rejects names that cannot fit fully in three lines', () => {
    expect(placeLabelText('A wide yard', 72, wideLetters).lines).toEqual(['A wide', 'yard']);
    expect(placeLabelText('W'.repeat(100), 72, wideLetters)).toBeNull();
    expect(placeLabelText('', 72, wideLetters)).toBeNull();
  });
});
