import { describe, expect, it } from 'vitest';
import { connectionBadge, planFleetTotal, planPhrases, statusRows } from './ialertAccountsModel.js';

describe('ialertAccountsModel', () => {
  it('unwraps the API envelope', () => {
    const rows = [{ accountId: 'a' }];
    expect(statusRows({ status: 'success', data: rows })).toBe(rows);
    expect(statusRows(rows)).toBe(rows);
    expect(statusRows({ status: 'success', data: null })).toEqual([]);
    expect(statusRows(undefined)).toEqual([]);
  });

  it('maps session and account state to one badge', () => {
    expect(connectionBadge({ status: 'ACTIVE', accountStatus: 'ACTIVE' })).toEqual({
      label: 'Connected',
      tone: 'ok',
    });
    expect(connectionBadge({ status: 'NEEDS_REAUTH', canSelfRenew: true })).toEqual({
      label: 'Renewing',
      tone: 'warn',
    });
    expect(connectionBadge({ status: 'NEEDS_REAUTH', canSelfRenew: false }).label).toBe(
      'Reconnect needed',
    );
    expect(connectionBadge({ status: 'ACTIVE', accountStatus: 'AUTH_FAILED' }).label).toBe(
      'Reconnect needed',
    );
    expect(connectionBadge({ status: 'ACTIVE', accountStatus: 'DISABLED' }).label).toBe(
      'Disabled by admin',
    );
  });

  it('reads plan buckets as vehicle counts, never as flags', () => {
    expect(planPhrases({ expired: 0, next15: 2, next30: 5 }).map((p) => p.text)).toEqual([
      '2 vehicles expire within 15 days',
      '5 vehicles expire within 30 days',
    ]);
    expect(planPhrases({ expired: 1, next15: 0, next30: 0 })).toEqual([
      { text: '1 vehicle expired', tone: 'crit' },
    ]);
    expect(planPhrases({ expired: null, next15: null, next30: null })).toEqual([]);
    expect(planPhrases(null)).toEqual([]);
  });

  it('takes the fleet total from the fleetCount object', () => {
    expect(planFleetTotal({ fleetCount: { ialert: 5, nonialert: 0, total: 5 } })).toBe(5);
    expect(planFleetTotal({ fleetCount: { total: null } })).toBeNull();
    expect(planFleetTotal(null)).toBeNull();
  });
});
