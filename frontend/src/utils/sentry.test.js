import { installGlobalHandlers } from './sentry.js';

describe('sentry.js — installGlobalHandlers', () => {
  let target;
  let listeners;
  let uninstall;

  beforeEach(() => {
    listeners = {};
    target = {
      addEventListener: (type, fn) => {
        listeners[type] = fn;
      },
      removeEventListener: (type) => {
        delete listeners[type];
      },
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    uninstall = installGlobalHandlers(target);
  });

  afterEach(() => {
    uninstall?.();
    vi.restoreAllMocks();
  });

  it('subscribes to both global failure channels', () => {
    expect(typeof listeners.unhandledrejection).toBe('function');
    expect(typeof listeners.error).toBe('function');
  });

  it('the returned cleanup removes both listeners', () => {
    uninstall();
    expect(listeners.unhandledrejection).toBeUndefined();
    expect(listeners.error).toBeUndefined();
    uninstall = null;
  });

  // The point of the handler is that these no longer vanish: before it, an
  // await with no catch produced no toast, no Sentry event and a UI stuck on
  // a spinner.
  it('handles a rejection with an Error reason without throwing', () => {
    expect(() => listeners.unhandledrejection({ reason: new Error('boom') })).not.toThrow();
  });

  it('handles a rejection with a non-Error reason', () => {
    expect(() => listeners.unhandledrejection({ reason: 'just a string' })).not.toThrow();
    expect(() => listeners.unhandledrejection({ reason: undefined })).not.toThrow();
  });

  it('ignores an ApiError — the axios interceptor already reported it', () => {
    const apiError = Object.assign(new Error('404'), { name: 'ApiError' });
    expect(() => listeners.unhandledrejection({ reason: apiError })).not.toThrow();
  });

  it('ignores an aborted request', () => {
    expect(() =>
      listeners.unhandledrejection({ reason: { name: 'CanceledError', code: 'ERR_CANCELED' } }),
    ).not.toThrow();
  });

  it('handles a window error event with and without an error object', () => {
    expect(() => listeners.error({ error: new Error('render blew up') })).not.toThrow();
    expect(() => listeners.error({ message: 'script error' })).not.toThrow();
  });
});
