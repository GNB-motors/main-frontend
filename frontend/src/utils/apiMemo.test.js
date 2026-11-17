import { describe, it, expect, beforeEach, vi } from 'vitest';

const session = { token: 'T', userId: 'U1', orgId: 'O1', branchId: null };
vi.mock('./session', () => ({
  getToken: () => session.token,
  getUserId: () => session.userId,
  getOrgId: () => session.orgId,
  getBranchId: () => session.branchId,
}));

const { default: apiMemo } = await import('./apiMemo');

describe('apiMemo', () => {
  beforeEach(() => {
    Object.assign(session, { token: 'T', userId: 'U1', orgId: 'O1', branchId: null });
    apiMemo.clear();
  });

  it('answers inside the window and not after it', () => {
    apiMemo.set('k', { a: 1 }, 1000);
    expect(apiMemo.get('k', 5000, 5999)).toEqual({ a: 1 });
    expect(apiMemo.get('k', 5000, 6001)).toBeUndefined();
  });

  it('never hands one account, org or branch the answer another one read', () => {
    apiMemo.set('k', 'org one', 1000);
    session.orgId = 'O2';
    expect(apiMemo.get('k', 60000, 1001)).toBeUndefined();
    session.orgId = 'O1';
    apiMemo.set('k', 'org one', 1000);
    session.branchId = 'B1';
    expect(apiMemo.get('k', 60000, 1001)).toBeUndefined();
    session.branchId = null;
    apiMemo.set('k', 'user one', 1000);
    session.userId = 'U2';
    expect(apiMemo.get('k', 60000, 1001)).toBeUndefined();
  });

  it('drops everything once nobody is signed in, and keeps nothing while signed out', () => {
    apiMemo.set('a', 1);
    apiMemo.set('b', 2);
    session.token = null;
    expect(apiMemo.get('a', 60000)).toBeUndefined();
    expect(apiMemo.size).toBe(0);
    apiMemo.set('c', 3);
    expect(apiMemo.size).toBe(0);
  });

  it('is bounded: the least recently used entry goes first', () => {
    for (let i = 0; i < 205; i += 1) apiMemo.set(`k${i}`, i);
    expect(apiMemo.size).toBe(200);
    expect(apiMemo.get('k0', 60000)).toBeUndefined();
    expect(apiMemo.get('k204', 60000)).toBe(204);
  });

  it('uses the server windows: 5 min for today, 30 min for a past day', () => {
    expect(apiMemo.ttlFor('2026-11-18', '2026-11-18')).toBe(5 * 60 * 1000);
    expect(apiMemo.ttlFor('2026-11-17', '2026-11-18')).toBe(30 * 60 * 1000);
  });
});
