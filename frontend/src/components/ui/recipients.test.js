import { describe, it, expect } from 'vitest';
import { parseRecipients, isEmail, MAX_RECIPIENTS } from './recipients';

describe('recipients', () => {
  it('spec 4: splits a typed list on commas, semicolons and spaces', () => {
    const { valid, invalid } = parseRecipients('a@x.com, b@y.com; c@z.com d@w.com');
    expect(valid).toEqual(['a@x.com', 'b@y.com', 'c@z.com', 'd@w.com']);
    expect(invalid).toEqual([]);
  });

  it('spec 4: lowercases and de-duplicates the addresses', () => {
    const { valid } = parseRecipients('Owner@Gnb.com, owner@gnb.com');
    expect(valid).toEqual(['owner@gnb.com']);
  });

  it('spec 4: keeps the addresses that are not addresses apart', () => {
    const { valid, invalid } = parseRecipients('a@x.com, not-an-email, @nope.com');
    expect(valid).toEqual(['a@x.com']);
    expect(invalid).toEqual(['not-an-email', '@nope.com']);
  });

  it('spec 4: an empty list has no recipients', () => {
    expect(parseRecipients('')).toEqual({ valid: [], invalid: [] });
    expect(parseRecipients(undefined)).toEqual({ valid: [], invalid: [] });
  });

  it('spec 4: knows an address from a word', () => {
    expect(isEmail('owner@gnb.com')).toBe(true);
    expect(isEmail('owner@gnb')).toBe(false);
    expect(isEmail('owner gnb.com')).toBe(false);
    expect(isEmail(null)).toBe(false);
  });

  it('spec 4: the maximum is ten addresses', () => {
    expect(MAX_RECIPIENTS).toBe(10);
  });
});
