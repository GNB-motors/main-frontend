import { describe, it, expect, vi } from 'vitest';
import { isChunkLoadError, reloadForFreshChunks } from './chunkReload';

const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
};

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: http://localhost:5173/src/components/DashboardLayout.jsx?t=1',
    'error loading dynamically imported module: https://app.example/assets/Page-abc.js',
    'Importing a module script failed.',
    'Unable to preload CSS for /assets/Page-abc.css',
  ])('recognises %s', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('ignores ordinary errors and empty input', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe('reloadForFreshChunks', () => {
  it('reloads the first time', () => {
    const reload = vi.fn();
    expect(reloadForFreshChunks({ storage: memoryStorage(), reload, now: 1_000_000 })).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  // A chunk that is missing even after a fresh load must not reload forever.
  it('refuses a second reload within the guard window', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    reloadForFreshChunks({ storage, reload, now: 1_000_000 });
    expect(reloadForFreshChunks({ storage, reload, now: 1_005_000 })).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again once the guard window has passed', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    reloadForFreshChunks({ storage, reload, now: 1_000_000 });
    expect(reloadForFreshChunks({ storage, reload, now: 1_011_000 })).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('does not reload when storage is unavailable', () => {
    const reload = vi.fn();
    const storage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(reloadForFreshChunks({ storage, reload })).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
