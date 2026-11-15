import { describe, expect, it } from 'vitest';
import { filterInbox, reviewTarget } from './inboxModel';

describe('inbox source destinations', () => {
  it('does not navigate to generic feeds for reports already visible in the modal', () => {
    for (const source of ['ownerAlerts', 'fleetAlerts', 'documents', 'incidents']) {
      expect(reviewTarget({ subjectKey: 'MH 12/A', sources: [{ source }] })).toBeNull();
    }
    expect(reviewTarget({ subjectKey: 'ORG', sources: [] })).toBeNull();
  });
  it('keeps a specific support ticket action', () => {
    expect(reviewTarget({ sources: [{ source: 'supportTicket', refId: 't1' }] })).toEqual({
      ticketId: 't1',
      label: 'Open ticket',
    });
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

it('does not send retired or mixed owner report types to an empty filtered feed', () => {
  expect(
    reviewTarget({
      subjectKey: 'WB11G1262',
      sources: [
        { source: 'ownerAlerts', code: 'REFUEL_ESTIMATED', at: '2026-09-24T10:00:00.000Z' },
        { source: 'ownerAlerts', code: 'FUEL_SIPHON_SUSPECTED', at: '2026-11-13T10:00:00.000Z' },
      ],
    }),
  ).toBeNull();
});
