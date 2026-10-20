import { describe, it, expect } from 'vitest';
import { EMPTY_ENQUIRY, toEnquiryPayload, validateEnquiry } from './enquiry';

const filled = (overrides = {}) => ({
  ...EMPTY_ENQUIRY,
  name: 'Ravi Kumar',
  email: 'ravi@raviroadlines.in',
  fleetSize: '26-100',
  ...overrides,
});

describe('validateEnquiry', () => {
  it('passes a form with a name, a fleet size and one way to reply', () => {
    expect(validateEnquiry(filled())).toEqual({});
    expect(validateEnquiry(filled({ email: '', phone: '+91 98310 12345' }))).toEqual({});
  });

  it('flags every missing required field on an empty form', () => {
    expect(validateEnquiry(EMPTY_ENQUIRY)).toEqual({
      name: 'Enter your name',
      email: 'Add an email or a phone number so we can reply',
      fleetSize: 'Pick your fleet size',
    });
  });

  it('rejects a malformed email or phone', () => {
    expect(validateEnquiry(filled({ email: 'ravi@' })).email).toBe('Enter a valid email');
    expect(validateEnquiry(filled({ phone: 'call me' })).phone).toBe('Enter a valid phone number');
  });
});

describe('toEnquiryPayload', () => {
  it('trims text and keeps the topic list', () => {
    expect(toEnquiryPayload(filled({ name: '  Ravi  ', topics: ['DEMO'] }))).toMatchObject({
      name: 'Ravi',
      topics: ['DEMO'],
    });
  });
});
