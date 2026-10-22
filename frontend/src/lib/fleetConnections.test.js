import { describe, it, expect } from 'vitest';
import {
  fleetEdgeAccountTitle,
  ialertAccountTitle,
  overviewTiles,
  ialertVehiclesByAccount,
  ialertFreshness,
  ialertRenewalNote,
} from './fleetConnections';

describe('fleetEdgeAccountTitle', () => {
  it('drops the extension default name that only repeats the Fleet ID', () => {
    const fleetId = 'U16451868559667502300';
    expect(fleetEdgeAccountTitle({ fleetId, friendlyName: `FleetEdge — ${fleetId}` })).toBe(
      'Tata FleetEdge account',
    );
    expect(fleetEdgeAccountTitle({ fleetId, friendlyName: `FleetEdge - ${fleetId}` })).toBe(
      'Tata FleetEdge account',
    );
    expect(fleetEdgeAccountTitle({ fleetId, friendlyName: '' })).toBe('Tata FleetEdge account');
  });

  it('keeps a name somebody chose', () => {
    expect(fleetEdgeAccountTitle({ fleetId: 'U1', friendlyName: 'BD Roadlines — Bihar' })).toBe(
      'BD Roadlines — Bihar',
    );
    expect(fleetEdgeAccountTitle({ fleetId: 'U1', friendlyName: 'FleetEdge — Kolkata depot' })).toBe(
      'FleetEdge — Kolkata depot',
    );
  });
});

describe('ialertAccountTitle', () => {
  it('prefers the friendly name, then the iALERT owner id', () => {
    expect(ialertAccountTitle({ friendlyName: 'Kolkata', externalAccountId: '410001' })).toBe('Kolkata');
    expect(ialertAccountTitle({ externalAccountId: '410001' })).toBe('iALERT owner 410001');
    expect(ialertAccountTitle({})).toBe('iALERT account');
  });
});

describe('overviewTiles', () => {
  const fe = {
    accounts: [
      { state: 'HEALTHY', vehicleCount: 116 },
      { state: 'NEEDS_RELINK', vehicles: [{}, {}] },
    ],
  };
  const ia = [
    { accountStatus: 'ACTIVE', status: 'ACTIVE', vehicleCount: 5 },
    { accountStatus: 'ACTIVE', status: 'NEEDS_REAUTH', canSelfRenew: false, vehicleCount: 3 },
  ];

  it('adds both providers and counts what needs the customer', () => {
    expect(overviewTiles(fe, ia)).toEqual([
      { key: 'accounts', label: 'Accounts', value: 4, tone: 'neutral' },
      { key: 'vehicles', label: 'Vehicles', value: 126, tone: 'neutral' },
      { key: 'attention', label: 'Need attention', value: 2, display: null, tone: 'crit' },
    ]);
  });

  it('reads "None" when nothing needs action, and survives missing data', () => {
    expect(overviewTiles({ accounts: [{ state: 'HEALTHY', vehicleCount: 1 }] }, null)[2]).toEqual({
      key: 'attention',
      label: 'Need attention',
      value: 0,
      display: 'None',
      tone: 'ok',
    });
    expect(overviewTiles(null, null).map((t) => t.value)).toEqual([0, 0, 0]);
  });
});

describe('ialertFreshness', () => {
  const now = Date.parse('2026-10-21T20:00:00Z');
  it('grades how old the newest iALERT data is', () => {
    expect(ialertFreshness({ lastDataAt: '2026-10-21T19:58:00Z' }, now)).toEqual({ tone: 'ok', minutes: 2 });
    expect(ialertFreshness({ lastDataAt: '2026-10-21T17:00:00Z' }, now)).toEqual({ tone: 'warn', minutes: 180 });
    expect(ialertFreshness({ lastDataAt: '2026-10-20T20:00:00Z' }, now)).toEqual({ tone: 'crit', minutes: 1440 });
    expect(ialertFreshness({ lastDataAt: null }, now)).toEqual({ tone: 'muted', minutes: null });
  });
});

describe('ialertRenewalNote', () => {
  it('tells the customer what keeps the link alive', () => {
    expect(ialertRenewalNote({ accountStatus: 'ACTIVE', status: 'ACTIVE', canSelfRenew: true })).toBe(
      'Renews on its own.',
    );
    expect(ialertRenewalNote({ accountStatus: 'ACTIVE', status: 'ACTIVE', canSelfRenew: false })).toMatch(
      /Doesn't renew on its own yet/,
    );
    expect(
      ialertRenewalNote({ accountStatus: 'ACTIVE', status: 'NEEDS_REAUTH', canSelfRenew: false }),
    ).toMatch(/Sign in to iALERT again/);
  });
});

describe('ialertVehiclesByAccount', () => {
  it('groups registrations under their iALERT link', () => {
    const rows = [{ accountId: 'a' }, { accountId: 'b' }];
    const map = ialertVehiclesByAccount(rows, [
      { registrationNumber: 'WB1', ialertAccountId: 'a' },
      { registration: 'WB2', ialertAccountId: 'b' },
      { registrationNumber: 'WB3' },
    ]);
    expect(Object.fromEntries(map)).toEqual({ a: ['WB1'], b: ['WB2'] });
  });

  it('gives unattributed vehicles to the only link', () => {
    const map = ialertVehiclesByAccount([{ accountId: 'a' }], [{ registrationNumber: 'WB1' }]);
    expect(map.get('a')).toEqual(['WB1']);
  });
});
