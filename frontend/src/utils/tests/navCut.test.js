import { describe, it, expect } from 'vitest';
import { applyUsageCut, cutIsApplicable, surfaceKeysFromNav, verdictFor } from '../navCut.js';
import { jobForPath, JOB } from '../navJobs.js';
import { SIDE_NAV_ITEMS } from '../sideNavItems.js';

/**
 * The navigation cut is the deliverable, so these tests are about the ONE thing
 * that matters: nothing leaves the menu without a recorded number from this
 * organization's own behaviour behind it.
 */

const LEARNED = {
  state: 'LEARNED',
  window: { from: '2026-09-01', to: '2026-10-22' },
  learned: { engagementFloor: 40, sessionGapMs: 120000, surfacesMeasured: 5, userDays: 0, totalViews: 664 },
  surfaces: [
    {
      surfaceKey: '/live-tracking',
      disposition: 'AT_OR_ABOVE_FLOOR',
      reason: '400 opens, at or above this org\'s own median of 40.',
      evidence: { views: 400, activeDays: 60, userDays: 90, followOn: 120, lastViewedAt: null, shareOfFloor: 10 },
    },
    {
      surfaceKey: '/route-hub',
      disposition: 'BELOW_ORG_FLOOR',
      reason: '4 opens vs this org\'s own median of 40.',
      evidence: { views: 4, activeDays: 2, userDays: 3, followOn: 1, lastViewedAt: null, shareOfFloor: 0.1 },
    },
    {
      surfaceKey: '/khata-ledger',
      disposition: 'NEVER_OPENED',
      reason: 'Not opened once since usage recording started.',
      evidence: { views: 0, activeDays: 0, userDays: 0, followOn: 0, lastViewedAt: null, shareOfFloor: null },
    },
  ],
};

const nav = [
  { type: 'link', to: '/live-tracking', label: 'Live', job: JOB.LIVE },
  { type: 'link', to: '/route-hub', label: 'Route Hub', job: JOB.REPORTS },
  { type: 'section', label: 'Insights' },
  { type: 'link', to: '/khata-ledger', label: 'Khata Ledger', job: JOB.MONEY },
  { type: 'link', to: '/profile', label: 'Profile' },
];

const paths = (items) =>
  items.flatMap((i) => (i.type === 'group' ? (i.children || []).map((c) => c.to) : i.to ? [i.to] : []));

describe('the cut refuses to act without the org\'s own measurement', () => {
  it('cuts nothing when there is no profile', () => {
    const out = applyUsageCut(nav, null);
    expect(out.applied).toBe(false);
    expect(paths(out.items)).toEqual(paths(nav));
    expect(out.why).toMatch(/nothing is cut/i);
  });

  it('cuts nothing while the profile says INSUFFICIENT', () => {
    const out = applyUsageCut(nav, { ...LEARNED, state: 'INSUFFICIENT' });
    expect(out.applied).toBe(false);
    expect(paths(out.items)).toEqual(paths(nav));
  });

  it('cuts nothing while the engagement floor has not been learned', () => {
    const out = applyUsageCut(nav, { ...LEARNED, learned: { ...LEARNED.learned, engagementFloor: null } });
    expect(cutIsApplicable(out ? { ...LEARNED, learned: { ...LEARNED.learned, engagementFloor: null } } : null).ok).toBe(false);
    expect(paths(out.items)).toEqual(paths(nav));
  });

  it('keeps a screen the server has not judged — absence of a verdict is not evidence', () => {
    const out = applyUsageCut(nav, LEARNED);
    // /profile was never mentioned by the server, and it has no job besides.
    expect(paths(out.items)).toContain('/profile');
  });

  it('never touches Profile or Settings, the recovery path', () => {
    const withRecovery = [...nav, { type: 'link', to: '/settings', label: 'Settings' }];
    const out = applyUsageCut(withRecovery, {
      ...LEARNED,
      surfaces: [
        ...LEARNED.surfaces,
        { surfaceKey: '/profile', disposition: 'NEVER_OPENED', reason: '', evidence: {} },
        { surfaceKey: '/settings', disposition: 'NEVER_OPENED', reason: '', evidence: {} },
      ],
    });
    expect(paths(out.items)).toContain('/profile');
    expect(paths(out.items)).toContain('/settings');
  });
});

describe('a cut is always accompanied by the number that made it', () => {
  it('folds a never-opened screen and keeps the route reachable in the job bucket', () => {
    const out = applyUsageCut(nav, LEARNED);
    expect(paths(out.items)).not.toContain('/khata-ledger');
    expect(out.foldedByJob[JOB.MONEY][0]).toMatchObject({
      label: 'Khata Ledger',
      to: '/khata-ledger',
      disposition: 'NEVER_OPENED',
    });
    expect(out.foldedByJob[JOB.MONEY][0].reason).toMatch(/not opened once/i);
  });

  it('folds a below-the-org-median screen and carries its own numbers', () => {
    const out = applyUsageCut(nav, LEARNED);
    const folded = out.foldedByJob[JOB.REPORTS][0];
    expect(folded.to).toBe('/route-hub');
    expect(folded.evidence.views).toBe(4);
    expect(folded.reason).toContain('median of 40');
  });

  it('keeps a screen at or above the org median', () => {
    const out = applyUsageCut(nav, LEARNED);
    expect(paths(out.items)).toContain('/live-tracking');
  });

  it('says the route and its data stay, so a reader knows nothing was deleted', () => {
    const out = applyUsageCut(nav, LEARNED);
    for (const f of out.folded) expect(f.to).toMatch(/^\//); // still a working route
  });
});

describe('folding never empties a section or the menu', () => {
  const onlyFolded = [
    { type: 'section', label: 'Insights' },
    { type: 'link', to: '/khata-ledger', label: 'Khata Ledger', job: JOB.MONEY },
  ];
  it('drops a section heading whose only child was folded', () => {
    const out = applyUsageCut(onlyFolded, LEARNED);
    expect(out.items).toEqual([]);
  });

  it('keeps a group that still has one surviving child and drops the rest', () => {
    const grouped = [
      {
        type: 'group',
        to: '/fuel',
        label: 'Fuel Management',
        children: [
          { to: '/mileage', label: 'Mileage', job: JOB.FUEL },
          { to: '/def-ledger', label: 'DEF Ledger', job: JOB.FUEL },
        ],
      },
    ];
    const profile = {
      ...LEARNED,
      surfaces: [
        { surfaceKey: '/mileage', disposition: 'AT_OR_ABOVE_FLOOR', reason: '', evidence: { views: 99 } },
        { surfaceKey: '/def-ledger', disposition: 'BELOW_ORG_FLOOR', reason: '2 opens', evidence: { views: 2 } },
      ],
    };
    const out = applyUsageCut(grouped, profile);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].children.map((c) => c.to)).toEqual(['/mileage']);
    expect(out.folded).toHaveLength(1);
  });
});

describe('surfaceKeysFromNav', () => {
  it('collects link paths and group children so the server can judge unopened screens', () => {
    const keys = surfaceKeysFromNav(SIDE_NAV_ITEMS);
    expect(keys).toContain('/alert-inbox');
    expect(keys).toContain('/usage');
    expect(keys).toContain('/live-tracking');
    // A screen this org has never opened leaves no row behind, so the menu has
    // to name it for the "never opened" verdict to exist at all.
    expect(keys).toContain('/reports');
  });
});

describe('verdictFor and the job taxonomy', () => {
  it('returns only a real verdict', () => {
    expect(verdictFor(LEARNED, '/live-tracking').disposition).toBe('AT_OR_ABOVE_FLOOR');
    expect(verdictFor(LEARNED, '/nowhere')).toBeNull();
    expect(verdictFor(null, '/live-tracking')).toBeNull();
  });

  it('maps destinations to jobs, and refuses paths that are not destinations', () => {
    expect(jobForPath('/live-tracking')).toBe(JOB.LIVE);
    expect(jobForPath('/place-hub')).toBe(JOB.TRIPS);
    expect(jobForPath('/khata-ledger')).toBe(JOB.MONEY);
    expect(jobForPath('/profile')).toBeNull();
    expect(jobForPath('/settings')).toBeNull();
    expect(jobForPath('/erp/billing')).toBe(JOB.MONEY);
    expect(jobForPath('not-a-path')).toBeNull();
  });
});