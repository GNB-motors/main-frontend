import { describe, it, expect } from 'vitest';
import { extractLocationDetails } from './addLocationLogic';

const makeResult = (overrides = {}) => ({
  geometry: { location: { lat: () => 22.5726, lng: () => 88.3639 } },
  formatted_address: 'Some Street, Kolkata, West Bengal 700001, India',
  address_components: [
    { long_name: 'Kolkata', types: ['locality'] },
    { long_name: 'West Bengal', types: ['administrative_area_level_1'] },
    { long_name: '700001', types: ['postal_code'] },
  ],
  ...overrides,
});

describe('extractLocationDetails', () => {
  it('reads lat/lng/address/city/state/pincode from a well-formed result', () => {
    const details = extractLocationDetails(makeResult());
    expect(details).toEqual({
      lat: 22.5726,
      lng: 88.3639,
      address: 'Some Street, Kolkata, West Bengal 700001, India',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700001',
    });
  });

  it('falls back to a 6-digit regex match when no postal_code component is tagged', () => {
    const details = extractLocationDetails(
      makeResult({ address_components: [{ long_name: 'Kolkata', types: ['locality'] }] }),
    );
    expect(details.pincode).toBe('700001');
  });

  it('leaves pincode empty when neither the component nor the regex finds one', () => {
    const details = extractLocationDetails(
      makeResult({
        formatted_address: 'Some Street, Kolkata',
        address_components: [{ long_name: 'Kolkata', types: ['locality'] }],
      }),
    );
    expect(details.pincode).toBe('');
  });
});
