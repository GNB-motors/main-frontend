import { describe, expect, it } from 'vitest';
import { filterInbox, reviewTarget } from './inboxModel';

describe('inbox source destinations', () => {
  it('encodes vehicle filters and picks the source page', () => {
    expect(reviewTarget({ subjectKey: 'MH 12/A', sources: [{ source: 'fleetAlerts' }] }).to).toBe(
      '/fleet-alerts?vehicle=MH%2012%2FA',
    );
    expect(reviewTarget({ subjectKey: 'ORG', sources: [{ source: 'ownerAlerts' }] }).to).toBe(
      '/owner-alerts',
    );
  });
  it('opens a hotspot by its source reference', () => {
    expect(
      reviewTarget({
        condition: 'HOTSPOT_REVIEW',
        sources: [{ source: 'hotspotWatch', refId: 'h1' }],
      }).to,
    ).toBe('/place-hub?tab=fuel&hotspot=h1');
  });
  it('uses exact status, severity, source and case-insensitive search together', () => {
    const row = {
      status: 'OPEN',
      severity: 'critical',
      subjectLabel: 'MH12',
      sources: [{ source: 'ownerAlerts' }],
    };
    expect(
      filterInbox([row], { query: 'mh12', severity: 'critical', source: 'ownerAlerts' }),
    ).toEqual([row]);
    expect(filterInbox([row], { status: 'ACKNOWLEDGED' })).toEqual([]);
  });
});
