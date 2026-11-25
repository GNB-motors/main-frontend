import { describe, it, expect } from 'vitest';
import {
  scrubUrl,
  scrubValue,
  scrubEvent,
  buildLemuEvent,
  scrubAxiosError,
} from './sentry.js';

const TOKEN = 'tok-SECRET-123';

describe('sentry scrubbing', () => {
  it('D6: scrubs the token out of a URL', () => {
    expect(scrubUrl('/api/auth/password-reset/verify?token=abc123&page=1')).toBe(
      '/api/auth/password-reset/verify?token=[redacted]&page=1',
    );
    expect(scrubUrl('/reset-password?token=abc123')).toBe('/reset-password?token=[redacted]');
  });

  it('D6: scrubs a token out of request data and tags', () => {
    expect(scrubValue({ token: 'abc123' })).toEqual({ token: '[redacted]' });
    expect(scrubValue({ nested: { token: 'abc123' } })).toEqual({
      nested: { token: '[redacted]' },
    });
    expect(scrubValue('/x?token=abc123')).toBe('/x?token=[redacted]');
  });

  it('D6: never attaches a reset request body', () => {
    const event = {
      request: {
        url: '/api/auth/password-reset/complete?token=abc123',
        data: { token: 'abc123', password: 'longenough1' },
      },
    };

    const scrubbed = scrubEvent(event);
    expect(scrubbed.request.url).toBe('/api/auth/password-reset/complete?token=[redacted]');
    expect(scrubbed.request.data).toBeUndefined();
  });

  it('D6: scrubs tokens out of tags and breadcrumbs', () => {
    const event = {
      tags: { 'api.url': '/api/auth/password-reset/verify?token=abc123' },
      breadcrumbs: [{ message: '/reset-password?token=abc123', data: { token: 'abc123' } }],
    };

    const scrubbed = scrubEvent(event);
    expect(scrubbed.tags['api.url']).toBe('/api/auth/password-reset/verify?token=[redacted]');
    expect(scrubbed.breadcrumbs[0].message).toBe('/reset-password?token=[redacted]');
    expect(scrubbed.breadcrumbs[0].data).toEqual({ token: '[redacted]' });
  });

  it('review 2: scrubs a bare query string (request.query_string has no "?" )', () => {
    expect(scrubUrl(`token=${TOKEN}&page=1`)).toBe(`token=[redacted]&page=1`);
    expect(scrubUrl(`page=1&token=${TOKEN}`)).toBe(`page=1&token=[redacted]`);
    expect(scrubUrl(`token=${TOKEN}`)).toBe('token=[redacted]');
  });

  it('review 2: scrubs the breadcrumb url, its data url and its message', () => {
    const event = scrubEvent({
      breadcrumbs: [
        {
          category: 'navigation',
          url: `/reset-password?token=${TOKEN}`,
          message: `went to /reset-password?token=${TOKEN}`,
          data: { url: `/api/auth/password-reset/verify?token=${TOKEN}`, token: TOKEN },
        },
      ],
    });

    const crumb = event.breadcrumbs[0];
    expect(crumb.url).toBe('/reset-password?token=[redacted]');
    expect(crumb.message).toBe('went to /reset-password?token=[redacted]');
    expect(crumb.data.url).toBe('/api/auth/password-reset/verify?token=[redacted]');
    expect(crumb.data.token).toBe('[redacted]');
  });

  it('review 2: scrubs the exception values and the stack frame vars', () => {
    const event = scrubEvent({
      exception: {
        values: [
          {
            type: 'Error',
            value: `Request failed for /reset-password?token=${TOKEN}`,
            stacktrace: {
              frames: [
                {
                  filename: `/src/reset.js?token=${TOKEN}`,
                  vars: { token: TOKEN, url: `/reset-password?token=${TOKEN}`, other: 'fine' },
                },
              ],
            },
          },
        ],
      },
    });

    const value = event.exception.values[0];
    expect(value.value).toBe('Request failed for /reset-password?token=[redacted]');
    expect(value.stacktrace.frames[0].filename).toBe('/src/reset.js?token=[redacted]');
    expect(value.stacktrace.frames[0].vars.token).toBe('[redacted]');
    expect(value.stacktrace.frames[0].vars.url).toBe('/reset-password?token=[redacted]');
    expect(value.stacktrace.frames[0].vars.other).toBe('fine');
  });

  it('review 2: a whole representative event carries no token at all', () => {
    const event = {
      request: {
        url: `/api/auth/password-reset/verify?token=${TOKEN}`,
        query_string: `token=${TOKEN}`,
        data: { token: TOKEN },
        headers: { Authorization: `Bearer ${TOKEN}` },
      },
      tags: { 'api.url': `/api/auth/password-reset/verify?token=${TOKEN}` },
      extra: { note: `token=${TOKEN}` },
      contexts: { browser: { url: `/reset-password?token=${TOKEN}` } },
      breadcrumbs: [
        { url: `/reset-password?token=${TOKEN}`, message: `token=${TOKEN}`, data: { token: TOKEN } },
      ],
      exception: {
        values: [{ value: `token=${TOKEN}`, stacktrace: { frames: [{ vars: { token: TOKEN } }] } }],
      },
    };

    const scrubbed = scrubEvent(event);
    const serialised = JSON.stringify(scrubbed);

    expect(serialised).not.toContain(TOKEN);
    expect(scrubbed.request.data).toBeUndefined();
    expect(scrubbed.request.query_string).toBe('token=[redacted]');
    expect(scrubbed.request.headers.Authorization).toBe('[redacted]');
  });

  it('review 2: the LEMU event scrubs the message, the stack and the context', () => {
    const error = new Error(`Request failed for /reset-password?token=${TOKEN}`);
    error.stack = `Error: token=${TOKEN}\n  at reset (/src/reset.js?token=${TOKEN})`;

    const event = buildLemuEvent(error, {
      tags: { 'api.url': `/api/auth/password-reset/verify?token=${TOKEN}` },
      extra: { token: TOKEN, note: `token=${TOKEN}` },
    });

    const serialised = JSON.stringify(event);
    expect(serialised).not.toContain(TOKEN);
    expect(event.message).toBe('Request failed for /reset-password?token=[redacted]');
    expect(event.stack).not.toContain(TOKEN);
    expect(event.extra.token).toBe('[redacted]');
    expect(event.context.token).toBe('[redacted]');
    expect(event.fingerprint).not.toContain(TOKEN);
  });

  it('review 4: scrubs the secrets of a JSON body that was serialised into a string', () => {
    const body = JSON.stringify({
      token: TOKEN,
      password: 'longenough1',
      otp: '999111',
      role: 'DRIVER',
    });

    const scrubbed = scrubValue(body);
    expect(scrubbed).not.toContain(TOKEN);
    expect(scrubbed).not.toContain('longenough1');
    expect(scrubbed).not.toContain('999111');
    expect(scrubbed).toContain('[REDACTED]');
    expect(scrubbed).toContain('"role":"DRIVER"');
  });

  it('review 4: scrubs the top level message and the transaction name', () => {
    const event = scrubEvent({
      message: `reset failed for {"token":"${TOKEN}"}`,
      transaction: `POST /api/auth/password-reset/complete?token=${TOKEN}`,
    });

    expect(event.message).not.toContain(TOKEN);
    expect(event.transaction).not.toContain(TOKEN);
    expect(event.transaction).toContain('[redacted]');
  });

  it('review 4: the body of another request is redacted, not dropped', () => {
    const event = scrubEvent({
      request: { url: '/api/drivers', data: { token: TOKEN, name: 'Asha' } },
    });

    expect(event.request.data.token).toBe('[redacted]');
    expect(event.request.data.name).toBe('Asha');
  });

  it('review 4: the body of a reset request never leaves the browser', () => {
    const event = scrubEvent({
      request: {
        url: '/api/auth/password-reset/complete',
        data: { token: TOKEN, password: 'longenough1' },
        body: JSON.stringify({ token: TOKEN, password: 'longenough1' }),
      },
    });

    expect(event.request.data).toBeUndefined();
    expect(event.request.body).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain(TOKEN);
  });

  it('review 4: the captured axios error never carries the body of a reset call', () => {
    const error = new Error('Request failed with status code 400');
    error.name = 'AxiosError';
    error.config = {
      url: '/api/auth/password-reset/complete',
      method: 'post',
      data: JSON.stringify({ token: TOKEN, password: 'longenough1' }),
    };
    error.isAxiosError = true;

    const safe = scrubAxiosError(error);

    expect(safe.config.data).toBeUndefined();
    expect(safe.config.url).toBe('/api/auth/password-reset/complete');
    expect(safe.message).toContain('400');
    expect(JSON.stringify(safe)).not.toContain(TOKEN);
    expect(error.config.data).toContain(TOKEN); // the original error is untouched
  });

  it('review 4: the body of another axios call stays', () => {
    const error = new Error('boom');
    error.config = { url: '/api/drivers', data: { name: 'Asha' } };

    expect(scrubAxiosError(error).config.data).toEqual({ name: 'Asha' });
  });
});
