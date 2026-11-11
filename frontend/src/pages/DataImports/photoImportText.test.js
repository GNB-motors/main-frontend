import { describe, it, expect } from 'vitest';
import { filedElsewhereNote, retakeReason } from './photoImportText';
import safeText from '@/utils/redactSensitive';

describe('the words the photo importer uses', () => {
  it('says where a photo was filed, and what it looks like instead', () => {
    expect(
      filedElsewhereNote({
        code: 'filed_elsewhere',
        uploadedAs: 'fuel_slip',
        filedAs: 'odometer',
      }),
    ).toBe(
      "This looks like an odometer photo, not a fuel slip. We've saved it as an odometer reading.",
    );
  });

  it('copes with a notice that names only one of the two', () => {
    expect(filedElsewhereNote({ filedAs: 'bill' })).toContain('a bill');
    expect(filedElsewhereNote({ uploadedAs: 'bill' })).toContain("We've saved this one as");
    expect(filedElsewhereNote(null)).toBe('');
  });

  it('always gives the operator a plain reason to retake a photo', () => {
    expect(retakeReason('The photo is too dark to read.')).toBe('The photo is too dark to read.');
    expect(retakeReason('')).toContain('good light');
  });
});

describe('numbers that must never reach the screen', () => {
  it('masks a long digit run', () => {
    expect(safeText('Aadhaar 1234 5678 9012')).not.toMatch(/\d{4}\s?\d{4}\s?\d{4}/);
    expect(safeText('Aadhaar 1234 5678 9012')).toContain('••••');
  });

  it('keeps the short numbers an operator needs', () => {
    expect(safeText('WB11T0662 on 2026-10-01')).toBe('WB11T0662 on 2026-10-01');
  });

  it('never turns an empty value into the word null', () => {
    expect(safeText(null)).toBe('');
    expect(safeText(undefined)).toBe('');
  });
});
