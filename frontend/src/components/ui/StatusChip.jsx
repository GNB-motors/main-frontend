import { label, toneOf } from '../../lib/vocabulary';

/**
 * StatusChip — the one way status is rendered anywhere in the product.
 * Takes an internal constant, never renders it raw: the label comes from
 * the vocabulary layer and the colour from the reserved status tones.
 *
 *   <StatusChip group="status" value={vehicle.state} />
 *   <StatusChip group="severity" value={alert.severity} />
 *
 * `tone` overrides the inferred tone; `fallback` covers absent values.
 */
export default function StatusChip({ group, value, tone, fallback = '—', className = '' }) {
  const resolvedTone = tone || toneOf(group, value);
  const text = label(group, value, fallback);
  return (
    <span className={`status-chip status-chip--${resolvedTone} ${className}`.trim()}>{text}</span>
  );
}
