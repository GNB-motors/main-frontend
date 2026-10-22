import { describe, it, expect } from 'vitest';
import {
  groupByCondition,
  emptyInboxCopy,
  assertEveryItemSaysWhatItWants,
  sourcesLine,
  sinceLabel,
} from '../AlertInbox/inboxModel.js';
import {
  summarize,
  buildSurfaceRows,
  measurementNote,
  pathLabel,
  recentDays,
} from '../UsageAnalytics/usageModel.js';

/**
 * The two properties the pages promise, tested without rendering:
 *  - an inbox row always says what it wants, and the empty inbox is a real
 *    state with words for it;
 *  - the usage page never turns a self-learned median into an accuracy claim,
 *    and never renders a per-person row (there is none to render).
 */

const item = (over = {}) => ({
  id: over.id || '1',
  condition: 'FUEL_RISK',
  label: 'Fuel loss to look at',
  subjectLabel: 'MH12AB1234',
  wants: 'Investigate the fuel loss on MH12AB1234.',
  severity: 'critical',
  status: 'OPEN',
  sourceCount: 1,
  sources: [{ source: 'ownerAlerts', code: 'FUEL_SIPHON_SUSPECTED' }],
  lastSeenAt: '2026-10-22T10:00:00Z',
  ...over,
});

describe('the inbox row always says what it wants', () => {
  it('withholds a row with no ask instead of rendering a blank one', () => {
    const items = [item({ id: 'ok' }), item({ id: 'broken', wants: '   ' }), item({ id: 'none', wants: undefined })];
    const broken = assertEveryItemSaysWhatItWants(items);
    expect(broken.map((b) => b.id)).toEqual(['broken', 'none']);
  });

  it('makes the three-sources-one-item case legible', () => {
    const merged = item({
      sourceCount: 3,
      sources: [
        { source: 'ownerAlerts' },
        { source: 'hotspotWatch' },
        { source: 'fleetAlerts' },
      ],
    });
    expect(merged.sources).toHaveLength(3);
    expect(sourcesLine(merged)).toContain('3 modules');
    expect(sourcesLine(merged)).toContain('fleetAlerts');
  });

  it('names a single source plainly', () => {
    expect(sourcesLine(item())).toBe('Reported by ownerAlerts.');
    expect(sourcesLine(item({ sources: [] }))).toMatch(/no source detail/i);
  });

  it('groups for reading without hiding any item', () => {
    const groups = groupByCondition([
      item({ id: 'a' }),
      item({ id: 'b', condition: 'TYRE', severity: 'caution' }),
      item({ id: 'c' }),
    ]);
    expect(groups[0].condition).toBe('FUEL_RISK');
    expect(groups.flatMap((g) => g.items.map((i) => i.id)).sort()).toEqual(['a', 'b', 'c']);
  });

  it('has real words for the empty inbox rather than a spinner that never stops', () => {
    const copy = emptyInboxCopy();
    expect(copy.title).toBe('Nothing needs doing');
    expect(copy.hint.length).toBeGreaterThan(40);
  });

  it('renders a time without a date library and without "Invalid Date"', () => {
    expect(sinceLabel(null)).toBe('unknown');
    expect(sinceLabel('nonsense')).toBe('unknown');
    expect(sinceLabel('2026-10-22T10:00:00Z')).toMatch(/ago|^\d{4}-\d{2}-\d{2}$|just now/);
  });
});

describe('the usage page makes the cut arguable', () => {
  const profile = {
    state: 'LEARNED',
    window: { from: '2026-09-01', to: '2026-10-22' },
    learned: { engagementFloor: 40, sessionGapMs: 120000, surfacesMeasured: 3, userDays: 93, totalViews: 664 },
    surfaces: [
      { surfaceKey: '/live-tracking', disposition: 'AT_OR_ABOVE_FLOOR', reason: '400 opens vs median 40.', evidence: { views: 400, userDays: 90, followOn: 120 } },
      { surfaceKey: '/route-hub', disposition: 'BELOW_ORG_FLOOR', reason: '4 opens vs median 40.', evidence: { views: 4, userDays: 3, followOn: 1 } },
      { surfaceKey: '/khata-ledger', disposition: 'NEVER_OPENED', reason: 'Not opened once.', evidence: { views: 0, userDays: 0, followOn: 0 } },
    ],
  };

  it('separates folded from kept', () => {
    const view = summarize(profile);
    expect(view.foldedCount).toBe(2);
    expect(view.usedCount).toBe(1);
    expect(view.folded.map((f) => f.surfaceKey).sort()).toEqual(['/khata-ledger', '/route-hub']);
  });

  it('shows the reason the server wrote, not a rewritten verdict', () => {
    const row = buildSurfaceRows(profile.surfaces).find((r) => r.surfaceKey === '/route-hub');
    expect(row.reason).toBe('4 opens vs median 40.');
    expect(row.isFolded).toBe(true);
  });

  it('names a path in words', () => {
    expect(pathLabel('/live-tracking')).toBe('Live Tracking');
    expect(pathLabel('/khata-ledger')).toBe('Khata Ledger');
    expect(pathLabel('/')).toBe('Dashboard');
    expect(pathLabel('')).toBe('Unknown screen');
  });

  it('never claims a rate from a self-learned median', () => {
    const note = measurementNote(profile);
    expect(note).toMatch(/your own median of 40 opens/);
    expect(note).toMatch(/Nothing is deleted/);
    expect(note).not.toMatch(/%|accuracy|confiden/i);
  });

  it('says plainly that nothing is cut before there is enough history', () => {
    const note = measurementNote({ state: 'INSUFFICIENT' });
    expect(note).toMatch(/Nothing is being hidden/i);
    expect(summarize({ state: 'INSUFFICIENT' }).foldedCount).toBe(0);
  });

  it('has a row per surface and no per-person row', () => {
    const rows = buildSurfaceRows(profile.surfaces);
    expect(rows).toHaveLength(3);
    expect(rows.some((r) => 'userId' in r || 'driver' in r || 'person' in r)).toBe(false);
  });

  it('trims the daily series to the tail, oldest first', () => {
    const daily = Array.from({ length: 30 }, (_, i) => ({ day: `2026-10-${String(i + 1).padStart(2, '0')}`, views: i, followOn: 0, userDays: 0 }));
    const out = recentDays(daily, 14);
    expect(out).toHaveLength(14);
    expect(out[13].day).toBe('2026-10-30');
  });
});