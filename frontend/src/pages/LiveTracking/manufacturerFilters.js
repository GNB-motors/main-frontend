/** Normalize known makes without guessing manufacturer from model or registration. */
export function normalizeManufacturer(value) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!name || name.toUpperCase() === 'UNKNOWN') return '';
  if (/^tata(?: motors)?$/i.test(name)) return 'Tata';
  if (/^ashok[\s-]*leyland$/i.test(name)) return 'Ashok Leyland';
  return name;
}

// Empty selection means all, including manufacturers added in the future.
export function toggleManufacturer(selected, name) {
  return selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name];
}
