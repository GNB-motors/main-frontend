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

  it('keeps the tag the server gave, so a later read can be conditional', () => {
    apiMemo.setWithEtag('k', { a: 1 }, '"v1"');
    expect(apiMemo.getEntry('k', 60000).etag).toBe('"v1"');
    // An answer written without a tag keeps the one it was read with.
    apiMemo.set('k', { a: 2 });
    expect(apiMemo.getEntry('k', 60000).etag).toBe('"v1"');
    expect(apiMemo.get('k', 60000)).toEqual({ a: 2 });
  });

  it('reuses the copy it holds when the server says it is still the one', async () => {
    apiMemo.setWithEtag('k', { a: 1 }, '"v1"', 1000);
    const request = vi.fn(async (etag) =>
      etag ? { notModified: true } : { data: { a: 2 }, etag: '"v2"' },
    );
    const data = await apiMemo.revalidate('k', request);
    expect(data).toEqual({ a: 1 });
    expect(request).toHaveBeenCalledWith('"v1"');
    // The copy is still there, and its timestamp moved.
    expect(apiMemo.get('k', 60000, 5000)).toEqual({ a: 1 });
  });

  it('takes the new answer when the server has one', async () => {
    apiMemo.setWithEtag('k', { a: 1 }, '"v1"', 1000);
    const request = vi.fn(async () => ({ data: { a: 2 }, etag: '"v2"' }));
    const data = await apiMemo.revalidate('k', request);
    expect(data).toEqual({ a: 2 });
    expect(apiMemo.getEntry('k', 60000).etag).toBe('"v2"');
  });

  it('asks for the body when it has no copy to reuse', async () => {
    const request = vi.fn(async (etag) =>
      etag ? { notModified: true } : { data: { a: 2 }, etag: '"v2"' },
    );
    const data = await apiMemo.revalidate('k', request);
    expect(data).toEqual({ a: 2 });
    expect(request).toHaveBeenCalledWith(null);
  });
});
