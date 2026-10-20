import {
  storeProfileData,
  storeMeProfile,
  getProfileData,
  getProfileField,
  clearProfileData,
  hasProfileData,
} from '../profileStorage.js';
import { getThemeColor } from '../session.js';

describe('profileStorage.js — profile data in the session store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('storeProfileData / getProfileData round-trip', () => {
    it('stores every provided field under its profile_ key', () => {
      storeProfileData({
        _id: 'p1',
        ownerEmail: 'owner@gnb.in',
        companyName: 'GNB Motors',
        gstin: '22AAAAA0000A1Z5',
        primaryThemeColor: '#ff8800',
      });
      expect(localStorage.getItem('profile_id')).toBe('p1');
      expect(localStorage.getItem('profile_owner_email')).toBe('owner@gnb.in');
      expect(localStorage.getItem('profile_company_name')).toBe('GNB Motors');
      expect(localStorage.getItem('profile_gstin')).toBe('22AAAAA0000A1Z5');
      expect(getThemeColor()).toBe('#ff8800');

      expect(getProfileData()).toEqual({
        _id: 'p1',
        ownerEmail: 'owner@gnb.in',
        companyName: 'GNB Motors',
        gstin: '22AAAAA0000A1Z5',
        primaryThemeColor: '#ff8800',
      });
    });

    it('persists the theme colour and dispatches themeColorChange', () => {
      const listener = vi.fn();
      window.addEventListener('themeColorChange', listener);
      storeProfileData({ primaryThemeColor: '#123456' });
      expect(listener).toHaveBeenCalled();
      window.removeEventListener('themeColorChange', listener);
    });

    it('skips absent fields', () => {
      storeProfileData({ _id: 'p1' });
      expect(getProfileData().ownerEmail).toBeNull();
      expect(getProfileData().gstin).toBeNull();
    });

    it('returns null when no profile id is stored', () => {
      storeProfileData({ companyName: 'Orphan' });
      expect(getProfileData()).toBeNull();
    });
  });

  // /api/auth/me nests the fields; passing it to storeProfileData as-is stored nothing.
  describe('storeMeProfile', () => {
    it('stores the nested /api/auth/me payload', () => {
      storeMeProfile({
        user: { id: 'u1', email: 'user@gnb.in', primaryThemeColor: '#ff8800' },
        organization: {
          companyName: 'GNB Motors',
          gstin: '22AAAAA0000A1Z5',
          ownerEmail: 'owner@gnb.in',
        },
        permissions: {},
      });
      expect(getProfileData()).toEqual({
        _id: 'u1',
        ownerEmail: 'owner@gnb.in',
        companyName: 'GNB Motors',
        gstin: '22AAAAA0000A1Z5',
        primaryThemeColor: '#ff8800',
      });
    });

    it('falls back to the user email and keeps the colour when the user has none', () => {
      storeMeProfile({ user: { _id: 'u2', email: 'user@gnb.in', primaryThemeColor: '#123456' } });
      storeMeProfile({ user: { _id: 'u2', email: 'user@gnb.in' }, organization: null });
      expect(getProfileData().ownerEmail).toBe('user@gnb.in');
      expect(getThemeColor()).toBe('#123456');
    });
  });

  describe('getProfileField', () => {
    it('reads an individual field by name', () => {
      storeProfileData({ _id: 'p1', gstin: 'GST1' });
      expect(getProfileField('gstin')).toBe('GST1');
    });

    it('returns null for a missing field', () => {
      expect(getProfileField('gstin')).toBeNull();
    });

    it('returns null when storage throws (session.js swallows the error)', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      try {
        expect(getProfileField('gstin')).toBeNull();
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('clearProfileData', () => {
    it('removes all profile fields but leaves other session data', () => {
      storeProfileData({
        _id: 'p1',
        ownerEmail: 'o@x.y',
        companyName: 'Co',
        gstin: 'G',
      });
      localStorage.setItem('authToken', 'tok');

      clearProfileData();

      expect(getProfileField('id')).toBeNull();
      expect(getProfileField('owner_email')).toBeNull();
      expect(getProfileField('company_name')).toBeNull();
      expect(getProfileField('gstin')).toBeNull();
      expect(localStorage.getItem('authToken')).toBe('tok');
      // theme colour is stored via setThemeColor and intentionally survives
    });

    it('is safe when storage throws (session.js swallows the error before it propagates)', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('denied');
      });
      try {
        expect(() => clearProfileData()).not.toThrow();
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('hasProfileData', () => {
    it('reflects the presence of profile_id', () => {
      expect(hasProfileData()).toBe(false);
      storeProfileData({ _id: 'p1' });
      expect(hasProfileData()).toBe(true);
    });
  });
});
