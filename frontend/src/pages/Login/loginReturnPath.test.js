import { describe, it, expect } from 'vitest';
import { resolveLoginReturnPath } from './loginReturnPath';

describe('login return destination', () => {
  it('retains the report, dates, and explicit all-location scope', () => {
    const report = '/reports?report=tripsRunningCost&from=2026-11-01&to=2026-11-17&loc=all';
    expect(resolveLoginReturnPath(report, '/live-tracking')).toBe(report);
  });

  it.each([
    undefined,
    null,
    {},
    '',
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/login',
    '/login?next=x',
    '/onboarding',
    '/\nexample.com',
  ])('keeps the normal landing page for an invalid return destination %j', (value) =>
    expect(resolveLoginReturnPath(value, '/live-tracking')).toBe('/live-tracking'),
  );
});
