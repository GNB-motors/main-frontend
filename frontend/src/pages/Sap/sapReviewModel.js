export function uniqueSuggestions(suggestions = [], kind) {
  const unique = new Map();
  for (const suggestion of suggestions) {
    const key = kind === 'PLANT' ? suggestion.orgSiteId || suggestion._id : suggestion.label;
    if (!key) continue;
    if (!unique.has(key) || (suggestion.score ?? 0) > (unique.get(key).score ?? 0))
      unique.set(key, suggestion);
  }
  return [...unique.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
export const reviewKey = (row, kind) => (kind === 'PLANT' ? row.label : row.orgSiteId);
export function reviewRows(data, kind, search = '', scope = 'pending') {
  const rows = kind === 'PLANT' ? data?.plants || [] : data?.drops || [];
  const term = search.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    const linked = kind === 'PLANT' ? row.sites?.length > 0 : Boolean(row.matched || row.label);
    if (scope === 'pending' && linked) return false;
    return (
      !term ||
      [row.name, row.label, ...(row.sites || []).map((s) => s.name)]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(term)
    );
  });
}
