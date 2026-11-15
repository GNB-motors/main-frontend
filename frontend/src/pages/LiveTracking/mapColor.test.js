import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveMapColor } from './mapColor.js';

/**
 * Google Maps draws on its own canvas: a "var(--token)" colour comes out
 * black there. The token has to be read off the document root and handed over
 * as a plain hex — with a hex fallback for when the token is not there.
 */
describe('map colours', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('leaves a plain colour alone', () => {
    expect(resolveMapColor('#ff0000')).toBe('#ff0000');
    expect(resolveMapColor('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
  });

  it('reads the token off the document root', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name) => (name === '--rd-leg-loaded' ? '  #2563eb  ' : ''),
    });
    expect(resolveMapColor('var(--rd-leg-loaded)')).toBe('#2563eb');
  });

  it('falls back to the token hex when the root has no value for it', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '',
    });
    expect(resolveMapColor('var(--rd-detour)')).toBe('#dc2626');
    expect(resolveMapColor('var(--rd-overspeed)')).toBe('#f97316');
  });

  it('falls back rather than returning another variable', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => 'var(--something-else)',
    });
    expect(resolveMapColor('var(--rd-leg-empty)')).toBe('#64748b');
  });

  it('has a plain hex for an unknown token', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '',
    });
    expect(resolveMapColor('var(--rd-nothing-here)')).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
