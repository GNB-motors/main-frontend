import '@testing-library/jest-dom';

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
