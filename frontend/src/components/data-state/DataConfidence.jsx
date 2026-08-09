import ArcGauge from '../cluster/ArcGauge';
import { confidenceOf, formatDataValue, DATA_STATES } from './dataConfidence';

/**
 * Data-confidence components.
 *
 * Telemetry surfaces three states that must never look the same:
 *   - NO DATA    never measured (value is null/undefined/NaN)
 *   - STALE      measured, but too old to trust
 *   - MEASURED   a fresh, confident reading (zero is a valid reading)
 *
 * Staleness is computed from the reading timestamp (`at`) via the existing
 * freshness contract (fresh / aging / stale / dead). The UI must degrade the
 * value itself — reduced emphasis, dashed gauge arcs, age shown inline —
 * rather than slapping a badge beside a confident-looking number.
 *
 * These components work in both light and dark themes because they only
 * consume existing cluster CSS variables and Tailwind utilities.
 */

/**
 * DataValue — a single number that renders confident, zero, stale, or no-data.
 *
 * Stale values are shown with their age, e.g. "84 L · 12d ago".
 * No-data renders as a muted em-dash.
 */
export function DataValue({ value, unit, at, decimals, className = '', noDataText = '—' }) {
  const { state, ageText } = confidenceOf(value, at);

  if (state === DATA_STATES.NO_DATA) {
    return (
      <span
        className={`data-state data-state--no-data ${className}`}
        title="No reading recorded"
      >
        {noDataText}
      </span>
    );
  }

  const text = formatDataValue(value, unit, { decimals });
  const suffix = state === DATA_STATES.STALE ? ` · ${ageText}` : '';

  return (
    <span
      className={`data-state data-state--${state} ${className}`}
      title={state === DATA_STATES.STALE ? `Reading is ${ageText}` : undefined}
    >
      {text}
      {suffix}
    </span>
  );
}

/**
 * DataArcGauge — a confidence-aware ArcGauge.
 *
 * Computes the confidence state from the value and timestamp, then hands the
 * unit, state, and age text to ArcGauge so the dial degrades visually for stale
 * or unverified readings.
 */
export function DataArcGauge({ value, label, unit, at, low = 15, warn = 35, size = 120 }) {
  const { state, ageText } = confidenceOf(value, at);
  return (
    <ArcGauge
      value={value}
      label={label}
      unit={unit}
      state={state}
      ageText={ageText}
      low={low}
      warn={warn}
      size={size}
    />
  );
}

/**
 * DataStateBlock — panel-level no-data treatment using the same visual
 * language as EmptyState: a directive title + explanatory hint. Use this when
 * an entire surface has no underlying data, while inline values use DataValue.
 */
export function DataStateBlock({ title, hint, action, className = '' }) {
  return (
    <div className={`data-state-block ${className}`}>
      <div className="data-state-block-title">{title}</div>
      {hint ? <div className="data-state-block-hint">{hint}</div> : null}
      {action}
    </div>
  );
}
