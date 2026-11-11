// The server says which fields agreed: same_phone, same_licence, same_aadhaar, similar_name.
const MATCH_LABELS = {
  name: 'Name',
  phone: 'Mobile',
  mobile: 'Mobile',
  licence: 'DL',
  license: 'DL',
  aadhaar: 'Aadhaar',
};
export function matchLabels(matched) {
  const out = [];
  for (const field of Array.isArray(matched) ? matched : []) {
    const label =
      MATCH_LABELS[
        String(field)
          .toLowerCase()
          .replace(/^(same|similar)_/, '')
      ];
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}
