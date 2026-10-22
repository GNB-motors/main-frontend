export const PRIMARY_MANUFACTURERS = [
  { value: 'TATA', label: 'Tata' },
  { value: 'ASHOK LEYLAND', label: 'Ashok Leyland' },
];
export function canonicalManufacturer(value) {
  const name = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
  if (name === 'TATA MOTORS') return 'TATA';
  if (/^ASHOK[ -]*LEYLAND$/.test(name)) return 'ASHOK LEYLAND';
  return name;
}
export function eligibleAccounts(accounts, manufacturer) {
  const make = canonicalManufacturer(manufacturer);
  return accounts.filter((account) => {
    const supported =
      account.compatibleManufacturers ||
      (account.source === 'IALERT_PORTAL'
        ? ['ASHOK LEYLAND']
        : ['WEBHOOK', 'EXTENSION'].includes(account.source)
          ? ['TATA']
          : []);
    return account.status === 'ACTIVE' && supported.includes(make);
  });
}
export function manufacturerLabel(value, catalog = PRIMARY_MANUFACTURERS) {
  return (
    catalog.find((item) => item.value === canonicalManufacturer(value))?.label ||
    (value === 'UNKNOWN' || !value ? 'Unclassified' : value)
  );
}
