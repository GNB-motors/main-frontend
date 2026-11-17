import { describe, it, expect } from 'vitest';
import digestExplain from './digestExplain';
import sectionCopy from './sectionCopy';
import attentionCopy from './attentionCopy';

// Whole words only ("IST" must not match "distance"). GPS is an owner's word.
const ENGINEER_WORDS =
  /\b(detector|odometer|IST|telemetry|superseded|source|module|window|attributed|query)\b/i;

describe('digestExplain', () => {
  it('every ⓘ on the digest speaks to an owner, not an engineer', () => {
    for (const [name, say] of Object.entries(digestExplain)) {
      for (const isToday of [true, false]) {
        const text = say(isToday);
        expect(text, name).toBeTruthy();
        expect(text, name).not.toMatch(ENGINEER_WORDS);
        expect(text.length, name).toBeLessThan(160);
      }
    }
  });

  it('the report cards speak the same way', () => {
    for (const id of [
      'fleetNow',
      'yesterdaysWork',
      'moneyOut',
      'moneyIn',
      'people',
      'exceptions',
      'trend',
      'dataHealth',
    ]) {
      expect(sectionCopy.about({ id }), id).not.toMatch(ENGINEER_WORDS);
      expect(sectionCopy.empty({ id }), id).not.toMatch(ENGINEER_WORDS);
    }
  });

  it('the Needs attention card speaks the same way', () => {
    expect(attentionCopy.info).not.toMatch(ENGINEER_WORDS);
    const row = { numbers: { thresholdMin: 10, verifiedIdleMinutes: 320 } };
    for (const kind of attentionCopy.kinds) {
      expect(attentionCopy.label(kind), kind).not.toMatch(ENGINEER_WORDS);
      expect(attentionCopy.about({ ...row, kind }), kind).not.toMatch(ENGINEER_WORDS);
      expect(attentionCopy.about({ ...row, kind }).length, kind).toBeLessThan(110);
    }
  });

  it('speaks of today and of a past day', () => {
    expect(digestExplain.trips(true)).toMatch(/today/);
    expect(digestExplain.trips(false)).toMatch(/on this day/);
  });
});
