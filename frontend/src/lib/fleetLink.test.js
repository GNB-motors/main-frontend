import { describe, it, expect } from 'vitest';
import {
  canRelink,
  indexLinkHealth,
  linkForAccount,
  linkForReg,
  linkStatus,
  linkReason,
  indicatorModel,
  bannerModel,
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

describe('canRelink', () => {
  it('lets only the roles that can sign in to the extension re-link', () => {
    expect(canRelink('OWNER')).toBe(true);
    expect(canRelink('manager')).toBe(true);
    expect(canRelink('SUPER_ADMIN')).toBe(true);
    expect(canRelink('OPS_EXECUTIVE')).toBe(false);
    expect(canRelink(null)).toBe(false);
  });
});

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
  it('is hidden when nothing needs the customer', () => {
    expect(indicatorModel(payload([healthy], { needsRelink: 0, expiring: 0 }, 'none'))).toEqual({
      visible: false,
    });
    expect(indicatorModel(null)).toEqual({ visible: false });
  });

  it('counts disconnected accounts in red', () => {
    const m = indicatorModel(
      payload([broken, expiring], { needsRelink: 1, expiring: 1 }, 'critical'),
    );
    expect(m).toMatchObject({ visible: true, tone: 'crit', count: 1 });
    expect(m.label).toBe('FleetEdge: 1 account needs reconnecting');
  });

  it('shows an amber dot without a count when accounts are only expiring', () => {
    const m = indicatorModel(payload([expiring], { needsRelink: 0, expiring: 2 }, 'warning'));
    expect(m).toMatchObject({ visible: true, tone: 'warn', count: 0 });
    expect(m.label).toBe('FleetEdge: 2 accounts expire soon');
  });
});

describe('bannerModel', () => {
  it('names a single disconnected account and the vehicles it paused', () => {
    const b = bannerModel(payload([broken], { affectedVehicles: 18 }, 'critical'));
    expect(b).toEqual({
      tone: 'crit',
      text: 'FleetEdge account Sharma Logistics is disconnected — live data for 18 vehicles is paused.',
      signature: 'crit:a1',
    });
  });

  it('counts several disconnected accounts', () => {
    const b = bannerModel(
      payload([broken, { ...broken, accountId: 'a0' }], { affectedVehicles: 1 }, 'critical'),
    );
    expect(b.text).toBe(
      '2 FleetEdge accounts are disconnected — live data for 1 vehicle is paused.',
    );
    expect(b.signature).toBe('crit:a0,a1');
  });

  it('warns only once an expiring account is within two days', () => {
    expect(bannerModel(payload([expiring], {}, 'warning'))).toBeNull();
    const b = bannerModel(payload([{ ...expiring, daysLeft: 1.2, urgent: true }], {}, 'warning'));
    expect(b).toMatchObject({ tone: 'warn', signature: 'warn:a2' });
    expect(b.text).toBe('FleetEdge account Patil Transport stops syncing in 1 day.');
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
