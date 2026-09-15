import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createLiveStream,
  backoffDelayMs,
  BACKOFF_MIN_MS,
  BACKOFF_MAX_MS,
  GRACE_PERIOD_MS,
  HIDDEN_CLOSE_MS,
  MISSING_ENDPOINT_RETRY_MS,
} from './liveStream';

/** Minimal EventSource double: records listeners, lets a test drive open/error/named events. */
class FakeEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.onopen = null;
    this.onerror = null;
    this.onmessage = null;
    this.listeners = new Map();
    this.closed = false;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }

  close() {
    this.closed = true;
  }

  simulateOpen() {
    this.onopen?.();
  }

  simulateError() {
    this.onerror?.();
  }

  emit(type, data) {
    (this.listeners.get(type) || []).forEach((h) => h({ data }));
  }
}

const TICKET = 'ticket-abc';

function makeDeps(overrides = {}) {
  return {
    requestTicket: vi.fn().mockResolvedValue(TICKET),
    openStream: vi.fn((url) => new FakeEventSource(url)),
    streamUrl: (ticket) => `/api/live/stream?ticket=${ticket}`,
    visibility: null,
    ...overrides,
  };
}

/** Flush the microtasks queued by the async connect() up to the EventSource construction. */
async function flushConnect() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeEventSource.instances = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('backoffDelayMs', () => {
  it('stays within [0, min] on the first attempt under full jitter', () => {
    expect(backoffDelayMs(0, () => 0.999)).toBeLessThan(BACKOFF_MIN_MS);
    expect(backoffDelayMs(0, () => 0)).toBe(0);
  });

  it('doubles the ceiling each attempt up to the 30 s cap', () => {
    expect(backoffDelayMs(1, () => 0.999)).toBeLessThan(BACKOFF_MIN_MS * 2);
    expect(backoffDelayMs(30, () => 0.999)).toBeLessThanOrEqual(BACKOFF_MAX_MS - 1);
    expect(backoffDelayMs(100, () => 1)).toBeLessThanOrEqual(BACKOFF_MAX_MS);
  });
});

describe('createLiveStream', () => {
  it('opens one ticket-authenticated EventSource for the first subscriber', async () => {
    const deps = makeDeps();
    const stream = createLiveStream(deps);
    stream.subscribe('positions', () => {});
    await flushConnect();

    expect(deps.requestTicket).toHaveBeenCalledTimes(1);
    expect(deps.openStream).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.instances[0].url).toBe(`/api/live/stream?ticket=${TICKET}`);
    stream.dispose();
  });

  it('dispatches named events to matching subscribers with parsed JSON payloads', async () => {
    const stream = createLiveStream(makeDeps());
    const seen = [];
    stream.subscribe('positions', (p) => seen.push(p));
    await flushConnect();

    FakeEventSource.instances[0].simulateOpen();
    FakeEventSource.instances[0].emit('positions', JSON.stringify({ reg: 'KA01AB1234' }));

    expect(seen).toEqual([{ reg: 'KA01AB1234' }]);
    stream.dispose();
  });

  it('ignores malformed JSON frames without killing the stream', async () => {
    const stream = createLiveStream(makeDeps());
    const seen = [];
    stream.subscribe('positions', (p) => seen.push(p));
    await flushConnect();
    FakeEventSource.instances[0].simulateOpen();

    expect(() => FakeEventSource.instances[0].emit('positions', '{not json')).not.toThrow();
    FakeEventSource.instances[0].emit('positions', JSON.stringify([1]));
    expect(seen).toEqual([[1]]);
    expect(FakeEventSource.instances[0].closed).toBe(false);
    stream.dispose();
  });

  it('reconnects with backoff after a stream error and re-mints the ticket', async () => {
    const deps = makeDeps();
    const stream = createLiveStream(deps);
    const states = [];
    stream.onConnectionState((s) => states.push(s));
    stream.subscribe('positions', () => {});
    await flushConnect();
    FakeEventSource.instances[0].simulateOpen();

    FakeEventSource.instances[0].simulateError();
    expect(stream.getState()).toBe('reconnecting');
    expect(FakeEventSource.instances[0].closed).toBe(true);

    await vi.advanceTimersByTimeAsync(BACKOFF_MAX_MS * 2);
    expect(deps.requestTicket).toHaveBeenCalledTimes(2);
    expect(FakeEventSource.instances.length).toBe(2);
    FakeEventSource.instances[1].simulateOpen();
    expect(stream.getState()).toBe('open');
    stream.dispose();
  });

  it('settles into closed and only probes a missing (404) ticket endpoint every 5 minutes', async () => {
    const notFound = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
    });
    const deps = makeDeps({ requestTicket: vi.fn().mockRejectedValue(notFound) });
    const stream = createLiveStream(deps);
    const states = [];
    stream.onConnectionState((s) => states.push(s));
    stream.subscribe('positions', () => {});
    await flushConnect();

    expect(stream.getState()).toBe('closed');
    expect(deps.requestTicket).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(MISSING_ENDPOINT_RETRY_MS - 1);
    expect(deps.requestTicket).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(deps.requestTicket).toHaveBeenCalledTimes(2);
    expect(states).not.toContain('reconnecting');
    stream.dispose();
  });

  it('keeps the connection through the grace period when the last subscriber leaves, then closes', async () => {
    const deps = makeDeps();
    const stream = createLiveStream(deps);
    const unsub = stream.subscribe('positions', () => {});
    await flushConnect();
    FakeEventSource.instances[0].simulateOpen();

    unsub();
    await vi.advanceTimersByTimeAsync(GRACE_PERIOD_MS - 1);
    expect(FakeEventSource.instances[0].closed).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(FakeEventSource.instances[0].closed).toBe(true);
    expect(stream.getState()).toBe('closed');
    stream.dispose();
  });

  it('reuses the grace-period connection when a subscriber returns in time', async () => {
    const deps = makeDeps();
    const stream = createLiveStream(deps);
    const unsub = stream.subscribe('positions', () => {});
    await flushConnect();
    expect(deps.requestTicket).toHaveBeenCalledTimes(1);

    unsub();
    stream.subscribe('positions', () => {});
    await vi.advanceTimersByTimeAsync(GRACE_PERIOD_MS * 2);
    // Same EventSource, no second ticket, still open past the grace timer.
    expect(deps.requestTicket).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.instances.length).toBe(1);
    expect(FakeEventSource.instances[0].closed).toBe(false);
    stream.dispose();
  });

  it('closes after 5 minutes hidden and reopens when visible again', async () => {
    const visibility = {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    let onVisibility;
    visibility.addEventListener.mockImplementation((type, handler) => {
      if (type === 'visibilitychange') onVisibility = handler;
    });
    const deps = makeDeps({ visibility });
    const stream = createLiveStream(deps);
    stream.subscribe('positions', () => {});
    await flushConnect();
    FakeEventSource.instances[0].simulateOpen();

    visibility.visibilityState = 'hidden';
    onVisibility();
    await vi.advanceTimersByTimeAsync(HIDDEN_CLOSE_MS - 1);
    expect(FakeEventSource.instances[0].closed).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeEventSource.instances[0].closed).toBe(true);

    visibility.visibilityState = 'visible';
    onVisibility();
    await flushConnect();
    expect(FakeEventSource.instances.length).toBe(2);
    FakeEventSource.instances[1].simulateOpen();
    expect(stream.getState()).toBe('open');
    stream.dispose();
  });

  it('stops reconnecting when the last subscriber unsubscribes mid-backoff', async () => {
    const deps = makeDeps();
    const stream = createLiveStream(deps);
    const unsub = stream.subscribe('positions', () => {});
    await flushConnect();
    FakeEventSource.instances[0].simulateError();

    unsub();
    await vi.advanceTimersByTimeAsync(BACKOFF_MAX_MS * 2);
    expect(deps.requestTicket).toHaveBeenCalledTimes(1);
    expect(stream.getState()).toBe('closed');
    stream.dispose();
  });
});
