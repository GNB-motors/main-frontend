import {
  isTokenExpired,
  getTokenExpiration,
  clearAuthData,
  handleAuthError,
  isSessionInvalid401,
  validateTokenBeforeRequest,
  getTokenTimeRemaining,
} from './authUtils.js';
import { setSession, getToken } from './session.js';
import { setNavigator } from './navigation.js';

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

  // A 401 is not automatically a dead session. Before this scoping, ANY 401
  // from ANY request hard-navigated the browser to /login — one background
  // poller, or one endpoint relaying an upstream provider's 401, ejected the
  // user mid-page and discarded all app state.
  describe('handleAuthError — scoping', () => {
    const validToken = () => makeToken({ exp: FUTURE_EXP });

    it('logs out when we hold a valid token but the server says the session is gone', () => {
      setSession({ token: validToken() });
      const onLogout = vi.fn();
      const err = { response: { status: 401, data: { message: 'Token expired' } } };
      expect(handleAuthError(err, onLogout)).toBe(true);
      expect(getToken()).toBeNull();
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it.each([
      'Invalid token',
      'No token provided',
      'Authentication failed',
      'Authentication required',
      'User not found',
    ])('treats %s as a session-level 401', (message) => {
      setSession({ token: validToken() });
      expect(isSessionInvalid401({ response: { status: 401, data: { message } } })).toBe(true);
    });

    // These are the 401s that used to eject the user: the FleetEdge/GSP proxy
    // relaying an upstream credential failure, and an expired live-stream
    // ticket. Neither says anything about the browser's own session.
    it.each([
      'GSP authentication failed / token expired',
      'Invalid or expired stream ticket',
      'Incorrect email/mobile or password',
    ])('does NOT log out on an endpoint-specific 401: %s', (message) => {
      setSession({ token: validToken() });
      const onLogout = vi.fn();
      expect(handleAuthError({ response: { status: 401, data: { message } } }, onLogout)).toBe(
        false,
      );
      expect(onLogout).not.toHaveBeenCalled();
      expect(getToken()).not.toBeNull();
    });

    it('does NOT log out on an unrecognised 401 reason', () => {
      setSession({ token: validToken() });
      const onLogout = vi.fn();
      expect(
        handleAuthError({ response: { status: 401, data: { message: 'Nope' } } }, onLogout),
      ).toBe(false);
      expect(onLogout).not.toHaveBeenCalled();
      expect(getToken()).not.toBeNull();
    });

    it('honours skipAuthRedirect on the request config', () => {
      const onLogout = vi.fn();
      const err = { response: { status: 401 }, config: { skipAuthRedirect: true } };
      expect(handleAuthError(err, onLogout)).toBe(false);
      expect(onLogout).not.toHaveBeenCalled();
    });

    it('leaves auth pages to handle their own 401', () => {
      const original = window.location;
      Object.defineProperty(window, 'location', {
        value: { ...original, pathname: '/login' },
        writable: true,
        configurable: true,
      });
      try {
        const onLogout = vi.fn();
        expect(handleAuthError({ response: { status: 401 } }, onLogout)).toBe(false);
        expect(onLogout).not.toHaveBeenCalled();
      } finally {
        Object.defineProperty(window, 'location', {
          value: original,
          writable: true,
          configurable: true,
        });
      }
    });

    it('redirects through the router rather than reloading the page', () => {
      const navigate = vi.fn();
      setNavigator(navigate);
      try {
        setSession({ token: 'not-a-jwt' });
        expect(handleAuthError({ response: { status: 401 } })).toBe(true);
        expect(navigate).toHaveBeenCalledWith('/login', {
          replace: true,
          state: { reason: 'session-expired' },
        });
      } finally {
        setNavigator(null);
      }
    });

    it('isSessionInvalid401 ignores non-401 statuses', () => {
      setSession({ token: makeToken({ exp: FUTURE_EXP }) });
      expect(isSessionInvalid401({ response: { status: 403 } })).toBe(false);
      expect(isSessionInvalid401({ status: 500 })).toBe(false);
      expect(isSessionInvalid401(null)).toBe(false);
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
