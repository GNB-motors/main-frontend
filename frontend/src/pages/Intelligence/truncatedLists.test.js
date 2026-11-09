import { describe, it, expect } from 'vitest';
import { truncatedEntryText, truncatedNote, truncatedNoteFor } from './truncatedLists';

describe('truncatedNote', () => {
  it('says nothing when the response was not cut', () => {
    expect(truncatedNote(undefined)).toBeNull();
    expect(truncatedNote([])).toBeNull();
  });

  it('names the list and the limit the server cut it at', () => {
    expect(truncatedNote([{ what: 'fuel windows', limit: 5000 }])).toBe(
      'Partial list: fuel windows cut at 5,000',
    );
  });

  it('names every list that was cut', () => {
    expect(
      truncatedNote([
        { what: 'idle events', limit: 5000 },
        { what: 'mileage rollup rows', limit: 100000 },
      ]),
    ).toBe('Partial list: idle events cut at 5,000; mileage rollup rows cut at 1,00,000');
  });
});

describe('truncatedEntryText', () => {
  it('leaves out a limit the server did not send', () => {
    expect(truncatedEntryText({ what: 'CAN rows' })).toBe('CAN rows');
  });

  it('leaves out an entry without a name', () => {
    expect(truncatedEntryText({ limit: 5000 })).toBeNull();
  });
});

describe('truncatedNoteFor', () => {
  it('keeps only the lists of that kind', () => {
    const truncated = [
      { what: 'detour events', limit: 5000 },
      { what: 'fuel windows', limit: 5000 },
    ];
    expect(truncatedNoteFor(truncated, ['detour'])).toBe(
      'Partial list: detour events cut at 5,000',
    );
    expect(truncatedNoteFor(truncated, ['overspeed'])).toBeNull();
  });
});
