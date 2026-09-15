import { describe, it, expect } from 'vitest';
import { mapFetchedDocsToUiState, BACKEND_TO_UI, META_BY_KEY } from './addVehicleDocMapping';
import { emptyDocsState } from './Component/VehicleDocumentUpload.jsx';

describe('BACKEND_TO_UI / META_BY_KEY', () => {
  it('maps every backend docType to its UI key and back to its metadata', () => {
    expect(BACKEND_TO_UI.RC).toBe('rc');
    expect(BACKEND_TO_UI.NATIONAL_PERMIT).toBe('nationalPermit');
    expect(META_BY_KEY.rc.sides).toEqual(['FRONT', 'BACK']);
    expect(META_BY_KEY.insurance.sides).toEqual(['SINGLE']);
  });
});

describe('mapFetchedDocsToUiState', () => {
  it('returns an empty state for no fetched docs', () => {
    expect(mapFetchedDocsToUiState(undefined, emptyDocsState)).toEqual(emptyDocsState());
    expect(mapFetchedDocsToUiState([], emptyDocsState)).toEqual(emptyDocsState());
  });

  it('ignores a docType with no matching UI slot', () => {
    const result = mapFetchedDocsToUiState(
      [{ docType: 'UNKNOWN_TYPE', files: [] }],
      emptyDocsState,
    );
    expect(result).toEqual(emptyDocsState());
  });

  it('fills documentId, expiryDate and ocr fields for a matched single-side doc', () => {
    const result = mapFetchedDocsToUiState(
      [
        {
          _id: 'doc1',
          docType: 'INSURANCE',
          expiryDate: '2027-01-01',
          ocr: { status: 'VERIFIED', fields: { policyNo: 'ABC123' } },
          files: [{ side: 'SINGLE', publicUrl: 'https://x/ins.pdf', mimeType: 'application/pdf' }],
        },
      ],
      emptyDocsState,
    );
    expect(result.insurance.documentId).toBe('doc1');
    expect(result.insurance.expiryDate).toBe('2027-01-01');
    expect(result.insurance.ocrStatus).toBe('VERIFIED');
    expect(result.insurance.ocrFields).toEqual({ policyNo: 'ABC123' });
    expect(result.insurance.SINGLE).toEqual({
      file: null,
      preview: 'https://x/ins.pdf',
      imageUrl: 'https://x/ins.pdf',
      name: 'INSURANCE',
      isPdf: true,
    });
  });

  it('falls back to the first known side when a file reports an unrecognized side', () => {
    const result = mapFetchedDocsToUiState(
      [
        {
          docType: 'RC',
          files: [{ side: 'WEIRD_SIDE', publicUrl: 'https://x/rc.jpg', mimeType: 'image/jpeg' }],
        },
      ],
      emptyDocsState,
    );
    expect(result.rc.FRONT.preview).toBe('https://x/rc.jpg');
    expect(result.rc.FRONT.isPdf).toBe(false);
  });

  it('places a two-sided doc into both FRONT and BACK slots', () => {
    const result = mapFetchedDocsToUiState(
      [
        {
          docType: 'RC',
          files: [
            { side: 'FRONT', publicUrl: 'https://x/front.jpg', mimeType: 'image/jpeg' },
            { side: 'BACK', publicUrl: 'https://x/back.jpg', mimeType: 'image/jpeg' },
          ],
        },
      ],
      emptyDocsState,
    );
    expect(result.rc.FRONT.preview).toBe('https://x/front.jpg');
    expect(result.rc.BACK.preview).toBe('https://x/back.jpg');
  });
});
