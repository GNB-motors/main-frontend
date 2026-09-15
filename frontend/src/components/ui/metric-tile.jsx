import * as React from 'react';
import { CircleAlert, CircleDashed, ShieldX } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * MetricTile — presentational metric tile with five honest states
 * (artboard §1). Pure props in, state rendered out: no fetching, no
 * invented metrics. The five states are first-class because a fleet
 * with zero telemetry renders them constantly:
 *
 *   state="normal"           value + unit + comparison + freshness
 *   state="not-set-up"       never reported — "no device / configure" CTA
 *   state="error"            feed failed — names the failure, may show a
 *                            frozen last-known value marked stale
 *   state="permission-denied" access message, never a fake zero
 *   state="no-signal"        waiting for data — pulsing, not an error
 *
 * The normal state additionally takes tone="ok" | "warn" | "crit" for
 * the status rail / pill (status always out-shouts brand orange, which
 * never appears on this component).
 *
 *   <MetricTile
 *     label="Cost per km" detail="Fleet average · Aug 2026"
 *     value="₹28.40" unit="per km"
 *     comparison={{ direction: 'down', tone: 'ok', text: '₹1.10 (3.7%) vs Jul 2026' }}
 *     freshness={{ text: 'Updated 4 min ago · IST', live: true }}
 *   />
 *
 * Visuals live in index.css (.mtile*) so this file stays small.
 */
function MetricTile({
  label,
  detail,
  state = 'normal',
  tone = 'ok',
  value,
  unit,
  subline,
  comparison,
  staleValue,
  staleCaption,
  message,
  freshness,
  cta,
  className,
  ...props
}) {
  const pill = {
    normal: { ok: 'Normal', warn: 'Watch', crit: 'Critical' }[tone],
    'not-set-up': 'Not set up',
    error: 'Error',
    'permission-denied': 'No access',
    'no-signal': 'No signal',
  }[state];

  const StateIcon = {
    'not-set-up': CircleDashed,
    error: CircleAlert,
    'permission-denied': ShieldX,
  }[state];

  const hasValue = state === 'normal' && value != null;

  return (
    <section
      data-slot="metric-tile"
      data-state={state}
      data-tone={state === 'normal' ? tone : undefined}
      aria-label={label}
      className={cn(
        'mtile',
        `mtile--${state}`,
        state === 'normal' && `mtile--tone-${tone}`,
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="mtile-rail" />
      {state === 'normal' && tone !== 'ok' && <span aria-hidden="true" className="mtile-wash" />}
      {state === 'error' && <span aria-hidden="true" className="mtile-wash" />}
      <div className="mtile-head">
        <p className="mtile-label">
          {label}
          {detail && <span className="mtile-detail">{detail}</span>}
        </p>
        <span className="mtile-pill" data-pill={state === 'normal' ? tone : state}>
          <span aria-hidden="true" className="mtile-pill-dot" />
          {pill}
        </span>
      </div>

      {hasValue ? (
        <>
          <p className="mtile-value">
            {value}
            {unit && <span className="mtile-unit">{unit}</span>}
          </p>
          {subline && <p className="mtile-sub">{subline}</p>}
          {comparison?.text && (
            <p
              className={cn(
                'mtile-compare',
                comparison.tone && `mtile-compare--${comparison.tone}`,
              )}
            >
              {comparison.direction === 'down' ? '↓ ' : comparison.direction === 'up' ? '↑ ' : ''}
              {comparison.text}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mtile-value mtile-value--empty">
            {state === 'error' && staleValue != null ? staleValue : '—'}
          </p>
          {state === 'error' && staleValue != null && staleCaption && (
            <p className="mtile-sub">{staleCaption}</p>
          )}
          {message && (
            <p className="mtile-msg">
              {StateIcon && <StateIcon size={15} aria-hidden="true" />}
              <span>{message}</span>
            </p>
          )}
        </>
      )}

      {(freshness || cta) && (
        <div className="mtile-foot">
          {freshness && (
            <span className="mtile-fresh">
              <span
                aria-hidden="true"
                className={cn('mtile-fresh-dot', freshness.live ? 'is-live' : 'is-stale')}
              />
              {freshness.text}
            </span>
          )}
          {cta &&
            (cta.href ? (
              <a className="mtile-cta" href={cta.href} onClick={cta.onClick}>
                {cta.label}
              </a>
            ) : (
              <button type="button" className="mtile-cta" onClick={cta.onClick}>
                {cta.label}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}

export { MetricTile };
