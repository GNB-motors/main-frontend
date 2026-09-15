/**
 * Pure parsing of a Google geocoder result into the location form's fields
 * (rule 21) — including the regex fallback for a pincode Google didn't tag
 * as a distinct address component.
 */
export function extractLocationDetails(result) {
  const lat = result.geometry.location.lat();
  const lng = result.geometry.location.lng();
  const address = result.formatted_address;

  const addressComponents = result.address_components || [];
  let city = '';
  let state = '';
  let pincode = '';

  addressComponents.forEach((component) => {
    if (component.types.includes('locality')) {
      city = component.long_name;
    }
    if (component.types.includes('administrative_area_level_1')) {
      state = component.long_name;
    }
    if (component.types.includes('postal_code')) {
      pincode = component.long_name;
    }
  });

  // Fallback: Try regex on formatted address if pincode is still empty
  if (!pincode && address) {
    const pinMatch = address.match(/\b\d{6}\b/);
    if (pinMatch) {
      pincode = pinMatch[0];
    }
  }

  return { lat, lng, address, city, state, pincode };
}
