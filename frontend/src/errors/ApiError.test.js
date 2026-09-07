import { describe, it, expect } from 'vitest';
import ApiError from './ApiError';

describe('ApiError', () => {
  describe('constructor fields', () => {
    it('stores status, requestId, body, code and cause', () => {
      const cause = new Error('boom');
      const err = new ApiError('it broke', {
        status: 500,
        requestId: 'req-123',
        body: { message: 'it broke' },
        code: 'ERR_X',
        cause,
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.name).toBe('ApiError');
      expect(err.message).toBe('it broke');
      expect(err.status).toBe(500);
      expect(err.requestId).toBe('req-123');
      expect(err.body).toEqual({ message: 'it broke' });
      expect(err.code).toBe('ERR_X');
      expect(err.cause).toBe(cause);
    });

    it('defaults optional fields to null', () => {
      const err = new ApiError('plain');
      expect(err.status).toBeNull();
      expect(err.requestId).toBeNull();
      expect(err.body).toBeNull();
      expect(err.code).toBeNull();
      expect(err.cause).toBeNull();
    });
  });

  describe('backward-compat axios aliases', () => {
    it('exposes response/config from the cause', () => {
      const axiosErr = {
        response: { status: 422, data: { detail: 'invalid' } },
        config: { url: '/api/x' },
      };
      const err = new ApiError('bad', { status: 422, cause: axiosErr });
      expect(err.response).toEqual(axiosErr.response);
      expect(err.config).toEqual(axiosErr.config);
    });

    it('falls back to null response/config without a cause', () => {
      const err = new ApiError('bad');
      expect(err.response).toBeNull();
      expect(err.config).toBeNull();
    });

    it('carries userMessage over from the cause', () => {
      const err = new ApiError('bad', { cause: { userMessage: 'Session expired' } });
      expect(err.userMessage).toBe('Session expired');
    });

    it('omits userMessage when the cause has none', () => {
      const err = new ApiError('bad', { cause: new Error('x') });
      expect('userMessage' in err).toBe(false);
    });

    it('preserves .code from the options bag', () => {
      expect(new ApiError('bad', { code: 'ECONNABORTED' }).code).toBe('ECONNABORTED');
    });
  });

  describe('type getters', () => {
    it('isNetworkError when there is no status but a transport code', () => {
      expect(new ApiError('net', { code: 'ERR_NETWORK' }).isNetworkError).toBe(true);
      expect(new ApiError('net', { code: 'ECONNABORTED' }).isNetworkError).toBe(true);
    });

    it('is not a network error when a status is present', () => {
      expect(new ApiError('http', { status: 503, code: 'E_X' }).isNetworkError).toBe(false);
    });

    it('is not a network error without a code', () => {
      expect(new ApiError('plain').isNetworkError).toBe(false);
    });

    it('isAuthError only for 401/403', () => {
      expect(new ApiError('a', { status: 401 }).isAuthError).toBe(true);
      expect(new ApiError('a', { status: 403 }).isAuthError).toBe(true);
      expect(new ApiError('a', { status: 400 }).isAuthError).toBe(false);
      expect(new ApiError('a', {}).isAuthError).toBe(false);
    });

    it('isRateLimited only for 429', () => {
      expect(new ApiError('rl', { status: 429 }).isRateLimited).toBe(true);
      expect(new ApiError('rl', { status: 430 }).isRateLimited).toBe(false);
    });

    it('isServerError for any 5xx', () => {
      expect(new ApiError('s', { status: 500 }).isServerError).toBe(true);
      expect(new ApiError('s', { status: 503 }).isServerError).toBe(true);
      expect(new ApiError('s', { status: 400 }).isServerError).toBe(false);
      expect(new ApiError('s', { status: null }).isServerError).toBe(false);
    });
  });

  describe('displayMessage', () => {
    it('prefers body.message, then body.detail, then userMessage, then message', () => {
      expect(new ApiError('m', { body: { message: 'from body' } }).displayMessage).toBe(
        'from body',
      );
      expect(new ApiError('m', { body: { detail: 'detail' } }).displayMessage).toBe('detail');
      expect(new ApiError('m', { cause: { userMessage: 'user msg' } }).displayMessage).toBe(
        'user msg',
      );
      expect(new ApiError('fallback only').displayMessage).toBe('fallback only');
    });
  });
});

describe('ApiError.from', () => {
  it('is idempotent for ApiError instances', () => {
    const err = new ApiError('already', { status: 418 });
    expect(ApiError.from(err)).toBe(err);
  });

  it('extracts status, requestId and body from an axios-style error', () => {
    const axiosErr = {
      message: 'Request failed with status code 404',
      response: {
        status: 404,
        headers: { 'x-request-id': 'req-9' },
        data: { message: 'Not here' },
      },
    };
    const err = ApiError.from(axiosErr);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.requestId).toBe('req-9');
    expect(err.body).toEqual({ message: 'Not here' });
    expect(err.message).toBe('Not here');
    expect(err.response).toBe(axiosErr.response);
  });

  it('prefers body.message over the raw error message', () => {
    const err = ApiError.from({
      message: 'Request failed with status code 400',
      response: { status: 400, data: { detail: 'Validation failed' } },
    });
    expect(err.message).toBe('Validation failed');
  });

  it('falls back to the provided message for unrecognised throws', () => {
    expect(ApiError.from(null, 'Fallback').message).toBe('Fallback');
    expect(ApiError.from(undefined, 'Fallback').message).toBe('Fallback');
  });

  it('keeps the thrown value as cause and copies its code', () => {
    const net = { code: 'ERR_NETWORK', message: 'Network down' };
    const err = ApiError.from(net);
    expect(err.cause).toBe(net);
    expect(err.code).toBe('ERR_NETWORK');
    expect(err.isNetworkError).toBe(true);
  });

  it('maps non-Error strings through the fallback', () => {
    const err = ApiError.from('string failure', 'Fallback');
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('Fallback');
  });
});
