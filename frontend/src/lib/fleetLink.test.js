import { describe, it, expect } from 'vitest';
import {
  indexLinkHealth,
  linkForAccount,
  linkForReg,
  linkStatus,
  linkReason,
  indicatorModel,
  vehiclesNeedingAction,
  recoveredAccounts,
  linkedByText,
} from './fleetLink';

const broken = {
  accountId: 'a1',
  fleetId: '10234',
  friendlyName: 'Sharma Logistics',
  state: 'NEEDS_RELINK',
  reason: 'REJECTED',
  urgent: true,
  vehicles: [{ id: 'v1', registrationNumber: 'MH12AB1234' }],
  linkedBy: [{ userId: 'u1', name: 'Ramesh', isMe: true }],
};
const expiring = {
  accountId: 'a2',
  fleetId: '10877',
  friendlyName: 'Patil Transport',
  state: 'EXPIRING',
  reason: 'SIGN_IN_ENDING',
  daysLeft: 6.4,
  urgent: false,
  vehicles: [{ id: 'v2', registrationNumber: 'MH 14 ZZ 0001' }],
  linkedBy: [],
};
const healthy = { accountId: 'a3', state: 'HEALTHY', vehicles: [] };

const payload = (accounts, summary, severity) => ({ accounts, summary, severity });

describe('indexLinkHealth', () => {
  it('finds an account by id and by plate, ignoring separators', () => {
    const index = indexLinkHealth(payload([broken, expiring]));
    expect(linkForAccount(index, 'a1')).toBe(broken);
    expect(linkForReg(index, 'mh-12-ab-1234')).toBe(broken);
    expect(linkForReg(index, 'MH14ZZ0001')).toBe(expiring);
    expect(linkForReg(index, 'XX00')).toBeNull();
    expect(linkForAccount(index, null)).toBeNull();
  });

  it('tolerates no data yet', () => {
    const index = indexLinkHealth(null);
    expect(linkForReg(index, 'MH12AB1234')).toBeNull();
  });
});

describe('linkStatus / linkReason', () => {
  it('words each state', () => {
    expect(linkStatus(broken)).toEqual({ tone: 'crit', label: 'Disconnected' });
    expect(linkStatus({ ...broken, reason: 'NOT_LINKED' }).label).toBe('Not connected');
    expect(linkStatus(expiring)).toEqual({ tone: 'warn', label: 'Expires in 6 days' });
    expect(linkStatus({ ...expiring, daysLeft: 0.4, urgent: true })).toEqual({
      tone: 'crit',
      label: 'Expires today',
    });
    expect(linkStatus(healthy).tone).toBe('ok');
  });

  it('explains why the customer must act, and stays quiet otherwise', () => {
    expect(linkReason(broken)).toMatch(/stopped accepting/);
    expect(linkReason({ ...expiring, reason: 'CANNOT_RENEW' })).toMatch(/without auto-renew/);
    expect(linkReason(healthy)).toBeNull();
  });
});

describe('indicatorModel', () => {
  it('stays visible as a neutral icon before data arrives', () => {
    expect(indicatorModel(null)).toEqual({ tone: 'idle', count: 0, label: 'FleetEdge connection' });
  });

  it('is green when every account is connected', () => {
    expect(indicatorModel(payload([healthy], { needsRelink: 0, expiring: 0 }, 'none'))).toEqual({
      tone: 'ok',
      count: 0,
      label: 'FleetEdge: all accounts connected',
    });
  });

  it('is neutral when the org has no FleetEdge account yet', () => {
    expect(indicatorModel(payload([], { needsRelink: 0, expiring: 0 }, 'none'))).toMatchObject({
      tone: 'idle',
      label: 'FleetEdge: no account connected yet',
    });
  });

  it('counts disconnected accounts in red', () => {
    const m = indicatorModel(
      payload([broken, expiring], { needsRelink: 1, expiring: 1 }, 'critical'),
    );
    expect(m).toEqual({
      tone: 'crit',
      count: 1,
      label: 'FleetEdge: 1 account needs reconnecting',
    });
  });

  it('shows an amber dot without a count when accounts are only expiring', () => {
    const m = indicatorModel(payload([expiring], { needsRelink: 0, expiring: 2 }, 'warning'));
    expect(m).toEqual({ tone: 'warn', count: 0, label: 'FleetEdge: 2 accounts expire soon' });
  });
});

describe('vehiclesNeedingAction', () => {
  it('counts vehicles on accounts that are disconnected or expiring, fleet-wide', () => {
    expect(
      vehiclesNeedingAction(
        payload([{ ...broken, vehicleCount: 12 }, expiring, { ...healthy, vehicleCount: 40 }]),
      ),
    ).toBe(13);
  });

  it('is zero with no data or when every account is connected', () => {
    expect(vehiclesNeedingAction(null)).toBe(0);
    expect(vehiclesNeedingAction(payload([healthy]))).toBe(0);
  });
});

describe('recoveredAccounts', () => {
  it('reports accounts that no longer need action', () => {
    const before = payload([broken, expiring]);
    const after = payload([{ ...broken, state: 'HEALTHY' }, expiring]);
    expect(recoveredAccounts(before, after).map((a) => a.accountId)).toEqual(['a1']);
  });

  it('ignores accounts that vanished (disabled, other branch)', () => {
    expect(recoveredAccounts(payload([broken]), payload([]))).toEqual([]);
    expect(recoveredAccounts(null, payload([healthy]))).toEqual([]);
  });
});

describe('linkedByText', () => {
  it('marks the current user', () => {
    expect(linkedByText(broken)).toBe('Ramesh (you)');
    expect(
      linkedByText({
        linkedBy: [{ name: 'Priya' }, { name: null }, { name: 'Ravi', isMe: false }],
      }),
    ).toBe('Priya, Ravi');
    expect(linkedByText(expiring)).toBeNull();
  });
});
