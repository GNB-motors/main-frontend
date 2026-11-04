/**
 * The owner's daily report — the pure part.
 *
 * Every section resolves to exactly one of ok | empty | error, and the reader
 * can always tell which. `empty` means the query ran and found nothing: it is
 * never a zero. A number the server did not measure is "—" with the reason
 * beside it.
 */

/** What an unknown reads as. Never a zero. */
export const DASH = '—';

/** The reason a section is empty, in one line. */
export function sectionReason(section) {
  const notes = Array.isArray(section?.notes) ? section.notes.filter(Boolean) : [];
  if (notes.length) return notes.join(' · ');
  if (section?.error) return String(section.error);
  return 'The query ran and found nothing for this day.';
}

/** The state of a section, defaulting to the honest one (empty). */
export function sectionState(section) {
  const state = section?.state;
  return state === 'ok' || state === 'empty' || state === 'error' ? state : 'empty';
}

/** The section's title, falling back to its id. */
export function sectionTitle(section) {
  return section?.title || section?.id || 'Section';
}

/** The "how we know" footer the server writes for every section. */
export function sectionFooter(section) {
  return section?.footer?.text || '';
}

/** "dieselBillInr" → "diesel bill inr". */
export function humanKey(key) {
  return String(key || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase();
}

/** One measured value, written the way the page writes every other number. */
export function formatValue(key, value) {
  if (value == null) return DASH;
  if (Array.isArray(value)) {
    if (!value.length) return DASH;
    return value
      .map((item) =>
        item && typeof item === 'object'
          ? Object.values(item)
              .filter((v) => v != null && typeof v !== 'object')
              .join(' ')
          : String(item),
      )
      .join(', ');
  }
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value !== 'number') return String(value);
  const k = String(key || '');
  if (k.endsWith('Inr')) return `₹${value.toLocaleString('en-IN')}`;
  if (k.endsWith('Pct')) return `${value}%`;
  if (k.endsWith('Km')) return `${value} km`;
  if (k.endsWith('Minutes') || k.endsWith('Min')) return `${value} min`;
  if (k.endsWith('Hours')) return `${value} h`;
  if (k.endsWith('Litres')) return `${value} L`;
  return value.toLocaleString('en-IN');
}

/** The numbers of one section, ready to render. */
export function numberPairs(numbers) {
  if (!numbers || typeof numbers !== 'object') return [];
  return Object.entries(numbers).map(([key, value]) => ({
    key,
    label: humanKey(key),
    value: formatValue(key, value),
    unknown: value == null,
  }));
}

const LABEL_KEYS = [
  'label',
  'name',
  'kind',
  'registrationNumber',
  'title',
  'subject',
  'condition',
  'docType',
  'type',
];

/** The rows of one section, flattened to label + note pairs. */
export function rowPairs(rows) {
  if (!rows) return [];
  if (Array.isArray(rows)) {
    return rows.slice(0, 8).map((row) => {
      if (!row || typeof row !== 'object') return { label: String(row), note: '' };
      const entries = Object.entries(row).filter(([, v]) => v != null && typeof v !== 'object');
      const labelEntry =
        entries.find(([k]) => LABEL_KEYS.includes(k)) || entries[0] || ['label', ''];
      const note = entries
        .filter(([k]) => k !== labelEntry[0])
        .map(([k, v]) => `${humanKey(k)}: ${formatValue(k, v)}`)
        .join(' · ');
      return { label: formatValue(labelEntry[0], labelEntry[1]), note };
    });
  }
  if (typeof rows === 'object') {
    return Object.entries(rows)
      .slice(0, 8)
      .map(([key, value]) => ({
        label: humanKey(key),
        note: Array.isArray(value) ? `${value.length} row(s)` : formatValue(key, value),
      }));
  }
  return [];
}

/** The morning brief's sections, ready to render. */
export function briefSections(brief) {
  const sections = Array.isArray(brief?.sections) ? brief.sections : [];
  return sections.map((section) => ({
    key: section?.key || 'section',
    label: section?.label || humanKey(section?.key || 'section'),
    status: section?.status === 'empty' ? 'empty' : 'ok',
    rupees: section?.rupees == null ? null : Number(section.rupees),
    suggestedAction: section?.suggestedAction || '',
    vehicles: Array.isArray(section?.vehicles)
      ? section.vehicles.map((v) => ({
          registrationNumber: v?.registrationNumber || '—',
          rupees: v?.rupees == null ? null : Number(v.rupees),
          durationMin: v?.durationMin == null ? null : Number(v.durationMin),
          excessL: v?.excessL == null ? null : Number(v.excessL),
        }))
      : [],
  }));
}
