import { describe, it, expect } from 'vitest';
import { eligibleAccounts, canonicalManufacturer } from './vehicleManufacturerOptions.js';
describe('manufacturer account eligibility', () => {
  it('separates Tata and Ashok accounts and excludes unavailable connections', () => {
    const accounts = [
      { _id: 't', source: 'EXTENSION', status: 'ACTIVE' },
      { _id: 'a', source: 'IALERT_PORTAL', status: 'ACTIVE' },
      { _id: 'x', source: 'EXTENSION', status: 'AUTH_FAILED' },
    ];
    expect(eligibleAccounts(accounts, 'TATA').map((account) => account._id)).toEqual(['t']);
    expect(eligibleAccounts(accounts, 'ASHOK LEYLAND').map((account) => account._id)).toEqual([
      'a',
    ]);
    expect(eligibleAccounts(accounts, 'VOLVO')).toEqual([]);
    expect(canonicalManufacturer(' ashok-leyland ')).toBe('ASHOK LEYLAND');
  });
});
