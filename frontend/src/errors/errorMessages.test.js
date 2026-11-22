import { describe, it, expect } from 'vitest';
import { describeError, getErrorStatus, getRequestId, ERROR_KIND } from './errorMessages';

describe('describeError', () => {
  it('maps 401 to a sign-in message', () => {
    const info = describeError({ status: 401 });
    expect(info.kind).toBe(ERROR_KIND.AUTH);
    expect(info.needsLogin).toBe(true);
    expect(info.retryable).toBe(false);
  });

  it('maps 403 to an access explanation', () => {
    const info = describeError({ status: 403 });
    expect(info.kind).toBe(ERROR_KIND.FORBIDDEN);
    expect(info.title).toBe("You don't have access to this.");
    expect(info.retryable).toBe(false);
  });

  it('keeps the status and request id for support', () => {
    const info = describeError({ status: 500, requestId: 'req-1' });
    expect(info.status).toBe(500);
    expect(info.requestId).toBe('req-1');
  });

  it('reads the status and request id out of an axios error', () => {
    const error = { response: { status: 404, headers: { 'x-request-id': 'abc' }, data: {} } };
    expect(getErrorStatus(error)).toBe(404);
    expect(getRequestId(error)).toBe('abc');
  });

  it('treats a transport failure as a connection problem that can be retried', () => {
    const info = describeError({ code: 'ERR_NETWORK' });
    expect(info.kind).toBe(ERROR_KIND.NETWORK);
    expect(info.retryable).toBe(true);
  });

  it('never leaks the raw server text into the owner-facing sentence', () => {
    const info = describeError({ status: 500, message: 'connect ECONNREFUSED 127.0.0.1:8000' });
    expect(info.title).not.toContain('ECONNREFUSED');
    expect(info.message).not.toContain('127.0.0.1');
  });

  it('always gives a next step, even for an unknown failure', () => {
    const info = describeError(null);
    expect(info.title).toBeTruthy();
    expect(info.message).toBeTruthy();
    expect(info.retryable).toBe(true);
  });
});
