import { setNavigator, navigateTo, isOnAuthPage } from './navigation.js';

describe('navigation.js — router bridge', () => {
  afterEach(() => setNavigator(null));

  it('routes through the registered navigate function', () => {
    const navigate = vi.fn();
    setNavigator(navigate);
    expect(navigateTo('/login')).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true, state: undefined });
  });

  it('passes replace and state through', () => {
    const navigate = vi.fn();
    setNavigator(navigate);
    navigateTo('/login', { replace: false, state: { reason: 'x' } });
    expect(navigate).toHaveBeenCalledWith('/login', { replace: false, state: { reason: 'x' } });
  });

  it('falls back to a hard navigation when no navigator is registered', () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...original, assign, pathname: '/vehicles' },
      writable: true,
      configurable: true,
    });
    try {
      expect(navigateTo('/login')).toBe(false);
      expect(assign).toHaveBeenCalledWith('/login');
    } finally {
      Object.defineProperty(window, 'location', {
        value: original,
        writable: true,
        configurable: true,
      });
    }
  });

  it('ignores a non-function navigator', () => {
    setNavigator('nope');
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...original, assign },
      writable: true,
      configurable: true,
    });
    try {
      expect(navigateTo('/login')).toBe(false);
    } finally {
      Object.defineProperty(window, 'location', {
        value: original,
        writable: true,
        configurable: true,
      });
    }
  });

  describe('isOnAuthPage', () => {
    it('recognises the auth routes and their children', () => {
      expect(isOnAuthPage('/login')).toBe(true);
      expect(isOnAuthPage('/signup')).toBe(true);
      expect(isOnAuthPage('/reset-password/abc123')).toBe(true);
    });

    it('does not match app routes', () => {
      expect(isOnAuthPage('/')).toBe(false);
      expect(isOnAuthPage('/vehicles')).toBe(false);
      expect(isOnAuthPage('/loginhistory')).toBe(false);
    });
  });
});
