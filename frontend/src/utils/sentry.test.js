import { describe, it, expect } from 'vitest';
import { scrubUrl, scrubValue, scrubEvent } from './sentry.js';

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
});
