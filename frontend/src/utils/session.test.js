import {
  getToken,
  getTokenType,
  getUserId,
  getUserEmail,
  getUserRole,
  getUserFirstName,
  getUserLastName,
  getUserStatus,
  getUserMobileNumber,
  getOrgId,
  getBranchId,
  getUserName,
  isAuthenticated,
  isOnboarded,
  setSession,
  setBranchId,
  setOrgId,
  getThemeColor,
  setThemeColor,
  getUiTheme,
  setUiTheme,
  getPref,
  setPref,
  getProfileField,
  setProfileField,
  removeProfileField,
  hasProfileData,
  clearSession,
} from './session.js';

describe('session.js — the sole localStorage gateway', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('all getters return null when nothing is stored', () => {
    expect(getToken()).toBeNull();
    expect(getTokenType()).toBeNull();
    expect(getUserId()).toBeNull();
    expect(getUserEmail()).toBeNull();
    expect(getUserRole()).toBeNull();
    expect(getOrgId()).toBeNull();
    expect(getBranchId()).toBeNull();
    expect(getThemeColor()).toBeNull();
    expect(getUiTheme()).toBeNull();
  });

  it('setSession persists token and tokenType (Bearer by default)', () => {
    setSession({ token: 'abc' });
    expect(getToken()).toBe('abc');
    expect(getTokenType()).toBe('Bearer');
    expect(isAuthenticated()).toBe(true);
  });

  it('setSession honours an explicit tokenType', () => {
    setSession({ token: 'abc', tokenType: 'JWT' });
    expect(getTokenType()).toBe('JWT');
  });

  it('setSession writes user fields under their canonical keys', () => {
    setSession({
      token: 't',
      user: {
        _id: 'u1',
        email: 'a@b.c',
        role: 'admin',
        firstName: 'Asha',
        lastName: 'Rao',
        status: 'active',
        mobileNumber: '999',
        orgId: 'o1',
      },
    });
    expect(getUserId()).toBe('u1');
    expect(getUserEmail()).toBe('a@b.c');
    expect(getUserRole()).toBe('admin');
    expect(getUserFirstName()).toBe('Asha');
    expect(getUserLastName()).toBe('Rao');
    expect(getUserStatus()).toBe('active');
    expect(getUserMobileNumber()).toBe('999');
    expect(getOrgId()).toBe('o1');
    // never writes branchId from user data
    expect(getBranchId()).toBeNull();
  });

  it('setSession falls back to user.id when _id is absent', () => {
    setSession({ token: 't', user: { id: 'u2', email: 'x@y.z' } });
    expect(getUserId()).toBe('u2');
  });

  it('setSession skips falsy user fields', () => {
    setSession({ token: 't', user: { _id: 'u1', email: '', role: null } });
    expect(getUserId()).toBe('u1');
    expect(getUserEmail()).toBeNull();
    expect(getUserRole()).toBeNull();
  });

  it('setSession persists organization onboarding state as a string', () => {
    setSession({ token: 't', organization: { isOnboarded: true } });
    expect(isOnboarded()).toBe(true);
    setSession({ organization: { isOnboarded: false } });
    expect(isOnboarded()).toBe(false);
  });

  it('setSession with no arguments writes nothing', () => {
    setSession();
    expect(getToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('setSession with user.primaryThemeColor stores the theme color', () => {
    const listener = vi.fn();
    window.addEventListener('themeColorChange', listener);
    setSession({ token: 't', user: { _id: 'u1', primaryThemeColor: '#ff0000' } });
    expect(getThemeColor()).toBe('#ff0000');
    expect(listener).toHaveBeenCalled();
    window.removeEventListener('themeColorChange', listener);
  });

  it('getUserName joins first and last name, falls back to email', () => {
    setSession({
      token: 't',
      user: { _id: 'u1', firstName: 'Asha', lastName: 'Rao', email: 'a@b.c' },
    });
    expect(getUserName()).toBe('Asha Rao');
    localStorage.clear();
    setSession({ token: 't', user: { _id: 'u1', email: 'a@b.c' } });
    expect(getUserName()).toBe('a@b.c');
    localStorage.clear();
    setSession({ token: 't', user: { _id: 'u1' } });
    expect(getUserName()).toBe('');
  });

  it('setBranchId/setOrgId set when truthy, remove when falsy', () => {
    setBranchId('b1');
    expect(getBranchId()).toBe('b1');
    setBranchId(null);
    expect(getBranchId()).toBeNull();
    setBranchId('');
    expect(getBranchId()).toBeNull();

    setOrgId('o9');
    expect(getOrgId()).toBe('o9');
    setOrgId(undefined);
    expect(getOrgId()).toBeNull();
  });

  it('setThemeColor stores the colour and dispatches themeColorChange', () => {
    const listener = vi.fn();
    window.addEventListener('themeColorChange', listener);
    setThemeColor('#22cc88');
    expect(getThemeColor()).toBe('#22cc88');
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('themeColorChange', listener);
  });

  it('setThemeColor ignores empty values', () => {
    setThemeColor('');
    setThemeColor(undefined);
    expect(getThemeColor()).toBeNull();
  });

  it('UI theme round-trips through the gnb-theme key', () => {
    setUiTheme('dark');
    expect(getUiTheme()).toBe('dark');
    expect(localStorage.getItem('gnb-theme')).toBe('dark');
  });

  it('getPref/setPref store arbitrary UI state by key', () => {
    setPref('graph.theme', 'light');
    expect(getPref('graph.theme')).toBe('light');
    expect(localStorage.getItem('graph.theme')).toBe('light');
  });

  describe('profile field namespacing (profile_ prefix)', () => {
    it('set/get/remove a profile field under the profile_ namespace', () => {
      setProfileField('company_name', 'GNB Motors');
      expect(localStorage.getItem('profile_company_name')).toBe('GNB Motors');
      expect(getProfileField('company_name')).toBe('GNB Motors');
      removeProfileField('company_name');
      expect(getProfileField('company_name')).toBeNull();
    });

    it('hasProfileData reflects presence of profile_id only', () => {
      expect(hasProfileData()).toBe(false);
      localStorage.setItem('profile_id', 'p1');
      expect(hasProfileData()).toBe(true);
    });
  });

  describe('storage failure resilience', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('get returns null when localStorage.getItem throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      expect(getToken()).toBeNull();
      expect(getUserName()).toBe('');
      spy.mockRestore();
    });

    it('set swallows quota errors without throwing', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      expect(() => setPref('k', 'v')).not.toThrow();
      expect(() => setThemeColor('#123456')).not.toThrow();
      expect(() => setSession({ token: 't' })).not.toThrow();
      spy.mockRestore();
    });

    it('remove swallows errors without throwing', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('denied');
      });
      expect(() => setBranchId(null)).not.toThrow();
      expect(() => clearSession()).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('clearSession', () => {
    it('clears auth, user, profile and theme-color keys', () => {
      setSession({
        token: 't',
        user: { _id: 'u1', email: 'a@b.c', primaryThemeColor: '#00ff00' },
      });
      setBranchId('b1');
      setProfileField('gstin', 'GST123');
      localStorage.setItem('profile_id', 'p1');

      clearSession();

      expect(getToken()).toBeNull();
      expect(getUserId()).toBeNull();
      expect(getUserEmail()).toBeNull();
      expect(getBranchId()).toBeNull();
      expect(getProfileField('gstin')).toBeNull();
      expect(hasProfileData()).toBe(false);
      // primaryThemeColor is part of KEYS, so clearSession removes it too
      // (the "leaves theme color untouched" docstring is stale).
      expect(getThemeColor()).toBeNull();
    });
  });
});
