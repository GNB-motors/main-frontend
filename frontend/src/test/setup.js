import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// CI runs the suite with coverage on a shared runner, where a render that
// settles in 50 ms locally can take over a second. findBy*/waitFor give up
// after asyncUtilTimeout, so the default 1 s made unrelated tests flaky there.
configure({ asyncUtilTimeout: 5000 });

// Restored Route Hub views use the browser's ResizeObserver. jsdom does not
// provide it; supply the observation lifecycle without changing production code.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage?.getItem !== 'function'
) {
  const store = new Map();
  const storageMock = {
    getItem: (key) => store.get(String(key)) ?? null,
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(String(key));
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock,
    configurable: true,
    writable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      configurable: true,
      writable: true,
    });
  }
}

// floating-ui (inside Base UI popovers) asks every ancestor whether it
// `matches(':popover-open')` or `matches(':modal')` on each position update.
// jsdom's selector engine does not know those pseudo-classes and recompiles
// them on every call, so opening one dropdown took ~35 s in tests. Nothing in
// jsdom is ever in the top layer, so the answer is always false.
if (typeof Element !== 'undefined') {
  const nativeMatches = Element.prototype.matches;
  Element.prototype.matches = function matches(selector) {
    if (selector === ':popover-open' || selector === ':modal') return false;
    return nativeMatches.call(this, selector);
  };
}
