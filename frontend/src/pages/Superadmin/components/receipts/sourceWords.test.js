import { describe, it, expect } from 'vitest';
import { SOURCE_WORDS, sourceWord, sourceText } from './sourceWords';

describe('the words for where a value came from', () => {
  it('names the place each source means', () => {
    expect(sourceWord('PHOTO')).toBe('photo');
    expect(sourceWord('PRINTED_BILL')).toBe('printed bill');
    expect(sourceWord('DETECTED_FILL')).toBe("truck's detected fill");
    expect(sourceWord('TRACKER_GPS')).toBe('tracker GPS');
    expect(sourceWord('TRACKER')).toBe('tracker');
    expect(sourceWord('MANUAL')).toBe('set by a person');
    expect(sourceWord('ORG')).toBe('matched by location');
    expect(sourceWord('ORG_SITE')).toBe('matched by location');
  });

  it('reads a source whatever way it is written', () => {
    expect(sourceWord('detected_fill')).toBe("truck's detected fill");
    expect(sourceWord('Printed Bill')).toBe('printed bill');
    expect(sourceWord('TRACKER GPS')).toBe('tracker GPS');
  });

  it('keeps one map of the sources', () => {
    expect(SOURCE_WORDS.DETECTED_FILL).toBe("truck's detected fill");
    expect(SOURCE_WORDS.TRACKER_GPS).toBe('tracker GPS');
  });

  it('knows nothing about a source it does not know', () => {
    expect(sourceWord('SOMETHING_ELSE')).toBeNull();
    expect(sourceWord(null)).toBeNull();
    expect(sourceWord('')).toBeNull();
  });

  it('says the source in words, and a dash when it is unknown', () => {
    expect(sourceText('PHOTO')).toBe('Source: photo');
    expect(sourceText('DETECTED_FILL')).toBe("Source: truck's detected fill");
    expect(sourceText('SOMETHING_ELSE')).toBe('Source: —');
    expect(sourceText(null)).toBe('Source: —');
  });
});
