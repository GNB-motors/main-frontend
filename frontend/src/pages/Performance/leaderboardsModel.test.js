import { describe, it, expect } from 'vitest';
import { unknownKmNote } from './leaderboardsModel';

describe('unknownKmNote', () => {
  it('counts the trips the server could not measure', () => {
    expect(unknownKmNote({ tripsWithUnknownKm: 7 })).toBe('7 trips not measured.');
  });

  it('says one trip not measured', () => {
    expect(unknownKmNote({ tripsWithUnknownKm: 1 })).toBe('1 trip not measured.');
  });

  it('says nothing when the server counted none, or did not count at all', () => {
    expect(unknownKmNote({ tripsWithUnknownKm: 0 })).toBeNull();
    expect(unknownKmNote({})).toBeNull();
    expect(unknownKmNote(null)).toBeNull();
  });
});
