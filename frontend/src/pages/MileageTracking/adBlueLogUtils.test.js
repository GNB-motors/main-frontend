import { describe, it, expect } from 'vitest';
import { validateImageFile } from './adBlueLogUtils';

const makeFile = (overrides = {}) => ({
  type: 'image/jpeg',
  name: 'receipt.jpg',
  size: 1024,
  ...overrides,
});

describe('validateImageFile', () => {
  it('accepts a small JPEG/PNG/WEBP with a matching extension', () => {
    expect(validateImageFile(makeFile())).toBe(true);
    expect(validateImageFile(makeFile({ type: 'image/png', name: 'r.png' }))).toBe(true);
    expect(validateImageFile(makeFile({ type: 'image/webp', name: 'r.webp' }))).toBe(true);
  });

  it('rejects an unsupported mime type', () => {
    expect(validateImageFile(makeFile({ type: 'application/pdf', name: 'r.pdf' }))).toBe(false);
  });

  it('rejects a mismatched extension even with a valid mime type', () => {
    expect(validateImageFile(makeFile({ name: 'receipt.gif' }))).toBe(false);
  });

  it('rejects a file over 10MB', () => {
    expect(validateImageFile(makeFile({ size: 10 * 1024 * 1024 + 1 }))).toBe(false);
  });

  it('accepts a file at exactly the 10MB boundary', () => {
    expect(validateImageFile(makeFile({ size: 10 * 1024 * 1024 }))).toBe(true);
  });
});
