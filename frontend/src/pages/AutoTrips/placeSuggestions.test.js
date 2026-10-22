import { describe, it, expect } from 'vitest';
import {
  confidenceBadge,
  duplicateWarning,
  rankReason,
  toPickOption,
  toPickOptions,
  shouldIncludeLowConfidence,
} from './placeSuggestions';

describe('toPickOption', () => {
  it('labels a place with its visit count', () => {
    expect(toPickOption({ id: 'a', name: 'Reliance Plant', visitCount: 12 }).label).toBe(
      'Reliance Plant · 12 visits',
    );
  });
  it('says "visit" in the singular and omits the suffix at zero', () => {
    expect(toPickOption({ id: 'a', name: 'Pump 1', visitCount: 1 }).label).toBe('Pump 1 · 1 visit');
    expect(toPickOption({ id: 'a', name: 'Pump 1', visitCount: 0 }).label).toBe('Pump 1');
  });
  it('keeps the confidence fields so the trigger can badge them', () => {
    const opt = toPickOption({
      id: 'a',
      name: 'Yard',
      confidence: 0.42,
      lowConfidence: true,
      stoppageCount: 5,
    });
    expect(opt.confidence).toBe(0.42);
    expect(opt.lowConfidence).toBe(true);
    expect(opt.stoppageCount).toBe(5);
  });
  it('drops rows with no id, which is what a malformed record looks like', () => {
    expect(toPickOptions([{ name: 'No id' }, { id: 'b', name: 'Real' }]).map((o) => o.id)).toEqual([
      'b',
    ]);
  });
});

describe('confidenceBadge', () => {
  it('calls out a low-confidence place and says how the score was reached', () => {
    const b = confidenceBadge({
      lowConfidence: true,
      confidence: 0.2,
      stoppageCount: 5,
      confidentStoppageCount: 1,
    });
    expect(b.tone).toBe('low');
    expect(b.label).toBe('Low confidence');
    expect(b.detail).toContain('1 of 5 stoppages');
  });

  it('renders a percentage once the score exists', () => {
    expect(confidenceBadge({ confidence: 0.83, lowConfidence: false }).label).toBe(
      '83% of stoppages inside',
    );
    expect(confidenceBadge({ confidence: 0.83 }).tone).toBe('good');
    expect(confidenceBadge({ confidence: 0.4, lowConfidence: false }).tone).toBe('fair');
  });

  it('admits it has not scored the place instead of saying 0%', () => {
    const b = confidenceBadge({ confidence: null });
    expect(b.tone).toBe('unknown');
    expect(b.label).toBe('Not scored yet');
  });
});

describe('rankReason', () => {
  it('credits the prefix tier first, matching the server order', () => {
    expect(rankReason({ name: 'Reliance Plant', visitCount: 900 }, { typed: 'Rel' })).toBe(
      'Starts with “Rel”',
    );
  });
  it('falls back to frequency, then to saying there is no data', () => {
    expect(rankReason({ name: 'Adani', visitCount: 4 }, { typed: 'zzz' })).toContain('4 stoppages');
    expect(rankReason({ name: 'Adani', visitCount: 0 }, { typed: 'zzz' })).toContain(
      'No recorded stoppages',
    );
  });
});

describe('duplicateWarning', () => {
  const nearby = {
    items: [
      { id: 'a', name: 'Balaji Plant', distanceM: 42.4, status: 'CONFIRMED', lowConfidence: false },
      { id: 'b', name: 'Balaji gate', distanceM: 88, status: 'CONFIRMED', lowConfidence: true },
      { id: 'c', name: 'Old yard', distanceM: 95, status: 'REJECTED' },
    ],
  };

  it('says nothing when there is no nearby place', () => {
    expect(duplicateWarning({ items: [] })).toBeNull();
    expect(duplicateWarning(null)).toBeNull();
  });

  it('warns with the nearest place and how many others are close', () => {
    const w = duplicateWarning(nearby);
    expect(w.headline).toBe('Possible duplicate');
    expect(w.detail).toContain('Balaji Plant');
    expect(w.detail).toContain('42 m');
    expect(w.detail).toContain('plus 1 more');
  });

  it('ignores a rejected site and the place being edited', () => {
    const w = duplicateWarning(nearby, { excludeId: 'a' });
    expect(w.candidates.map((c) => c.id)).toEqual(['b']);
    expect(w.detail).toContain('Balaji gate');
  });

  it('softens the tone when the nearest place is itself low-confidence', () => {
    expect(duplicateWarning(nearby).tone).toBe('warn');
    expect(duplicateWarning({ items: [nearby.items[1]] }).tone).toBe('fair');
  });
});

describe('shouldIncludeLowConfidence', () => {
  it('is opt-in only', () => {
    expect(shouldIncludeLowConfidence(true)).toBe(true);
    expect(shouldIncludeLowConfidence(false)).toBe(false);
    expect(shouldIncludeLowConfidence(undefined)).toBe(false);
    expect(shouldIncludeLowConfidence('true')).toBe(false);
  });
});