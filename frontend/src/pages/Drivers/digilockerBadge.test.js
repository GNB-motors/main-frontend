import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildDigiLockerBadge,
  daysUntil,
  expiryTone,
  formatVerifiedDate,
  needsAttention,
} from './digilockerBadge';

const future = (days) => new Date(Date.now() + days * 86_400_000).toISOString();
const past = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

describe('daysUntil / expiryTone', () => {
  afterEach(() => vi.useRealTimers());

  it('returns null for missing or invalid input', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil('not-a-date')).toBeNull();
  });

  it('buckets by urgency', () => {
    expect(expiryTone(future(200))).toBe('valid');
    expect(expiryTone(future(10))).toBe('expiring');
    expect(expiryTone(past(1))).toBe('expired');
    expect(expiryTone(null)).toBe('unknown');
  });
});

describe('buildDigiLockerBadge', () => {
  it('hides the badge entirely when the integration is off', () => {
    const b = buildDigiLockerBadge({ enabled: false, verified: { DL: false, RC: false } });
    expect(b.visible).toBe(false);
    expect(b.tone).toBe('unavailable');
  });

  it('shows "Not verified" when enabled but nothing verified', () => {
    const b = buildDigiLockerBadge({
      enabled: true,
      verified: { DL: false, RC: false },
      verifiedAt: { DL: null, RC: null },
    });
    expect(b.visible).toBe(true);
    expect(b.tone).toBe('none');
    expect(b.verifiedCount).toBe(0);
  });

  it('shows the verified tone only when BOTH docs carry a verifiedAt stamp', () => {
    const b = buildDigiLockerBadge({
      enabled: true,
      verified: { DL: true, RC: true },
      verifiedAt: { DL: past(3), RC: past(3) },
    });
    expect(b.tone).toBe('verified');
    expect(b.verifiedCount).toBe(2);
    expect(b.label).toMatch(/verified/i);
  });

  it('never treats `verified: true` without a verifiedAt stamp as verified', () => {
    // Guards the security contract: verifiedAt is the only source of truth.
    const b = buildDigiLockerBadge({
      enabled: true,
      verified: { DL: true, RC: true },
      verifiedAt: { DL: null, RC: null },
    });
    expect(b.tone).toBe('none');
    expect(b.verifiedCount).toBe(0);
  });

  it('shows a partial tone when only one doc is verified', () => {
    const b = buildDigiLockerBadge({
      enabled: true,
      verified: { DL: true, RC: false },
      verifiedAt: { DL: past(1), RC: null },
    });
    expect(b.tone).toBe('partial');
    expect(b.label).toMatch(/1\/2/);
    expect(b.title).toMatch(/Driving Licence/);
    expect(b.title).toMatch(/Registration Certificate/);
  });

  it('accepts an explicit enabled override from the parent', () => {
    const b = buildDigiLockerBadge(null, { enabled: true });
    expect(b.visible).toBe(true);
    expect(b.tone).toBe('none');
  });

  it('exposes per-doc expiry tone so the UI can warn before expiry', () => {
    const b = buildDigiLockerBadge({
      enabled: true,
      verified: { DL: true, RC: true },
      verifiedAt: { DL: past(1), RC: past(1) },
      expiryDate: { DL: future(400), RC: future(5) },
    });
    const dl = b.docs.find((d) => d.key === 'DL');
    const rc = b.docs.find((d) => d.key === 'RC');
    expect(dl.expiryTone).toBe('valid');
    expect(rc.expiryTone).toBe('expiring');
  });

  it('propagates the sandbox flag for the dev-only banner', () => {
    expect(buildDigiLockerBadge({ enabled: true, sandbox: true }).sandbox).toBe(true);
    expect(buildDigiLockerBadge({ enabled: true, sandbox: false }).sandbox).toBe(false);
  });
});

describe('formatVerifiedDate', () => {
  it('formats a valid date and returns null otherwise', () => {
    expect(formatVerifiedDate('2026-08-12T00:00:00.000Z')).toMatch(/\d{2} \w{3} \d{4}/);
    expect(formatVerifiedDate(null)).toBeNull();
    expect(formatVerifiedDate('nope')).toBeNull();
  });
});

describe('needsAttention', () => {
  it('flags none / partial badges', () => {
    expect(needsAttention(buildDigiLockerBadge({ enabled: true }))).toBe(true);
    expect(
      needsAttention(
        buildDigiLockerBadge({
          enabled: true,
          verified: { DL: true, RC: false },
          verifiedAt: { DL: past(1), RC: null },
        }),
      ),
    ).toBe(true);
  });

  it('does not flag a fully verified, comfortably-valid driver', () => {
    const b = buildDigiLockerBadge({
      enabled: true,
      verified: { DL: true, RC: true },
      verifiedAt: { DL: past(1), RC: past(1) },
      expiryDate: { DL: future(400), RC: future(300) },
    });
    expect(needsAttention(b)).toBe(false);
  });

  it('flags an expired or soon-to-expire verified doc', () => {
    const expiring = buildDigiLockerBadge({
      enabled: true,
      verified: { DL: true, RC: true },
      verifiedAt: { DL: past(1), RC: past(1) },
      expiryDate: { DL: future(5), RC: future(400) },
    });
    expect(needsAttention(expiring)).toBe(true);
  });

  it('never flags when the integration is disabled', () => {
    expect(needsAttention(buildDigiLockerBadge({ enabled: false }))).toBe(false);
  });
});
