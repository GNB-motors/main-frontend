import {
  getPrimaryColor,
  getLightColor,
  getDarkColor,
  applyThemeToRoot,
  getThemeCSS,
  applyThemeToElement,
} from './colorTheme.js';
import { setThemeColor } from './session.js';

describe('colorTheme.js — central colour theming', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
  });

  describe('getPrimaryColor', () => {
    it('falls back to indigo when nothing is stored', () => {
      expect(getPrimaryColor()).toBe('#4f46e5');
    });

    it('returns the stored theme colour', () => {
      setThemeColor('#22cc88');
      expect(getPrimaryColor()).toBe('#22cc88');
    });
  });

  describe('getLightColor', () => {
    it('builds a 12% opacity rgba from a hex colour', () => {
      expect(getLightColor('#ff0000')).toBe('rgba(255, 0, 0, 0.12)');
      expect(getLightColor('#4f46e5')).toBe('rgba(79, 70, 229, 0.12)');
    });
  });

  describe('getDarkColor', () => {
    it('subtracts 40 from each channel', () => {
      expect(getDarkColor('#4f46e5')).toBe('#271ebd');
    });

    it('clamps channels at zero', () => {
      expect(getDarkColor('#100000')).toBe('#000000');
    });
  });

  describe('applyThemeToRoot', () => {
    it('writes every token set onto :root', () => {
      setThemeColor('#22cc88');
      applyThemeToRoot();
      const style = document.documentElement.style;
      expect(style.getPropertyValue('--primary-color')).toBe('#22cc88');
      expect(style.getPropertyValue('--primary-light')).toBe('rgba(34, 204, 136, 0.12)');
      expect(style.getPropertyValue('--primary-dark')).toBe('#00a460');
      expect(style.getPropertyValue('--color-primary-500')).toBe('#22cc88');
      expect(style.getPropertyValue('--color-primary-600')).toBe('#00a460');
      expect(style.getPropertyValue('--color-primary-100')).toBe('rgba(34, 204, 136, 0.12)');
      expect(style.getPropertyValue('--primary')).toMatch(/^oklch\(/);
    });

    it('uses the indigo fallback when no colour is stored', () => {
      applyThemeToRoot();
      expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#4f46e5');
    });
  });

  describe('getThemeCSS', () => {
    it('returns the legacy inline-style token object', () => {
      setThemeColor('#ff0000');
      expect(getThemeCSS()).toEqual({
        '--primary-color': '#ff0000',
        '--primary-light': 'rgba(255, 0, 0, 0.12)',
        '--primary-dark': '#d70000',
      });
    });
  });

  describe('applyThemeToElement', () => {
    it('sets tokens on a given element', () => {
      const el = document.createElement('div');
      setThemeColor('#ff0000');
      applyThemeToElement(el);
      expect(el.style.getPropertyValue('--primary-color')).toBe('#ff0000');
      expect(el.style.getPropertyValue('--primary-light')).toBe('rgba(255, 0, 0, 0.12)');
      expect(el.style.getPropertyValue('--primary-dark')).toBe('#d70000');
    });

    it('is a no-op on a missing element', () => {
      expect(() => applyThemeToElement(null)).not.toThrow();
    });
  });
});
