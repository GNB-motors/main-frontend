import {
  isTokenExpired,
  getTokenExpiration,
  clearAuthData,
  handleAuthError,
  validateTokenBeforeRequest,
  getTokenTimeRemaining,
} from './authUtils.js';
import { setSession, getToken } from './session.js';

const makeToken = (payload) => {
  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.fakesig`;
};

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600;
const PAST_EXP = Math.floor(Date.now() / 1000) - 3600;

describe('authUtils.js — JWT helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isTokenExpired', () => {
    it('treats a missing token as expired', () => {
      expect(isTokenExpired('')).toBe(true);
      expect(isTokenExpired(null)).toBe(true);
      expect(isTokenExpired(undefined)).toBe(true);
    });

    it('returns false for a token with a future exp', () => {
      expect(isTokenExpired(makeToken({ exp: FUTURE_EXP }))).toBe(false);
    });

    it('returns true for a token with a past exp', () => {
      expect(isTokenExpired(makeToken({ exp: PAST_EXP }))).toBe(true);
    });

    it('returns true and logs when the token cannot be parsed', () => {
      expect(isTokenExpired('not-a-jwt')).toBe(true);
      expect(isTokenExpired('a.b')).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getTokenExpiration', () => {
    it('returns null for a missing token', () => {
      expect(getTokenExpiration('')).toBeNull();
    });

    it('returns the exp as a Date', () => {
      const d = getTokenExpiration(makeToken({ exp: FUTURE_EXP }));
      expect(d).toBeInstanceOf(Date);
      expect(d.getTime()).toBe(FUTURE_EXP * 1000);
    });

    it('returns null for an unparseable token', () => {
      expect(getTokenExpiration('garbage')).toBeNull();
    });
  });

  describe('getTokenTimeRemaining', () => {
    it('returns null for a missing token', () => {
      expect(getTokenTimeRemaining(null)).toBeNull();
    });

    it('breaks the remaining time into days/hours/minutes/seconds', () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date('2024-01-15T00:00:00.000Z'));
        const exp = Math.floor(Date.now() / 1000) + 90061; // exactly 1d 1h 1m 1s
        const r = getTokenTimeRemaining(makeToken({ exp }));
        expect(r.days).toBe(1);
        expect(r.hours).toBe(1);
        expect(r.minutes).toBe(1);
        expect(r.seconds).toBe(1);
        expect(r.totalSeconds).toBe(90061);
      } finally {
        vi.useRealTimers();
      }
    });

    it('returns null for an already-expired token', () => {
      expect(getTokenTimeRemaining(makeToken({ exp: PAST_EXP }))).toBeNull();
    });

    it('returns null for an unparseable token', () => {
      expect(getTokenTimeRemaining('zzz')).toBeNull();
    });
  });

  describe('clearAuthData', () => {
    it('clears the stored session', () => {
      setSession({ token: 'tok', user: { _id: 'u1', email: 'a@b.c' } });
      expect(getToken()).toBe('tok');
      clearAuthData();
      expect(getToken()).toBeNull();
    });
  });

  describe('handleAuthError', () => {
    it('ignores non-401 errors', () => {
      const onLogout = vi.fn();
      expect(handleAuthError({ status: 500 }, onLogout)).toBe(false);
      expect(handleAuthError(new Error('boom'), onLogout)).toBe(false);
      expect(handleAuthError(null, onLogout)).toBe(false);
      expect(onLogout).not.toHaveBeenCalled();
    });

    it('handles error.status 401, clears auth and calls onLogout', () => {
      setSession({ token: 'tok' });
      const onLogout = vi.fn();
      expect(handleAuthError({ status: 401 }, onLogout)).toBe(true);
      expect(getToken()).toBeNull();
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('handles error.response.status 401 (axios shape)', () => {
      const onLogout = vi.fn();
      expect(handleAuthError({ response: { status: 401 } }, onLogout)).toBe(true);
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateTokenBeforeRequest', () => {
    it('returns false and calls onLogout when there is no token', () => {
      const onLogout = vi.fn();
      expect(validateTokenBeforeRequest(onLogout)).toBe(false);
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('returns true when the stored token is valid', () => {
      setSession({ token: makeToken({ exp: FUTURE_EXP }) });
      const onLogout = vi.fn();
      expect(validateTokenBeforeRequest(onLogout)).toBe(true);
      expect(onLogout).not.toHaveBeenCalled();
    });

    it('clears session and calls onLogout when the stored token is expired', () => {
      setSession({ token: makeToken({ exp: PAST_EXP }) });
      const onLogout = vi.fn();
      expect(validateTokenBeforeRequest(onLogout)).toBe(false);
      expect(getToken()).toBeNull();
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });
});
