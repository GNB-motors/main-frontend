import { useId } from 'react';
import { AlertCircle, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/** A card with a title, an optional subtitle and actions on the right. */
export function KhataCard({
  title,
  subtitle,
  actions,
  flush = false,
  className = '',
  children,
  as = 'section',
  titleAs = 'h3',
  ...rest
}) {
  const id = useId();
  const Tag = as;
  const Title = titleAs;
  return (
    <Tag
      className={['khata-card', flush && 'khata-card--flush', className].filter(Boolean).join(' ')}
      aria-labelledby={title ? id : undefined}
      {...rest}
    >
      {title || actions ? (
        <div className="khata-card-head">
          <div>
            {title ? (
              <Title id={id} className="khata-card-title">
                {title}
              </Title>
            ) : null}
            {subtitle ? <p className="khata-card-sub">{subtitle}</p> : null}
          </div>
          {actions ? <div className="khata-card-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}

/** The title row above a group of cards: no card around it, actions on the right. */
export function KhataSectionHead({ title, subtitle, actions, as = 'h2' }) {
  const Title = as;
  return (
    <div className="khata-section-head">
      <div>
        <Title className="khata-section-title">{title}</Title>
        {subtitle ? <p className="khata-section-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="khata-section-actions">{actions}</div> : null}
    </div>
  );
}

const PILL_TONES = { critical: 'bad', warning: 'warn', danger: 'bad' };

export function KhataPill({ tone = 'neutral', small = false, className = '', children }) {
  const name = PILL_TONES[tone] || tone;
  return (
    <span
      className={[
        'khata-pill',
        name !== 'neutral' && `khata-pill--${name}`,
        small && 'khata-pill--sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

/** A label above a control. `htmlFor` points at the control's id. */
export function KhataField({ label, htmlFor, className = '', children }) {
  return (
    <div className={`khata-field ${className}`.trim()}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

export function KhataSearch({ value, onChange, placeholder, label }) {
  return (
    <div className="khata-search">
      <Search size={15} aria-hidden="true" />
      <input
        type="search"
        aria-label={label || placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="khata-icon-btn khata-search-clear"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

export function KhataEmpty({ icon: Icon, title, children, action = null }) {
  return (
    <div className="khata-empty">
      {Icon ? <Icon size={22} aria-hidden="true" /> : null}
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function KhataError({ title, children, onRetry }) {
  return (
    <div className="khata-error" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {children ? <p>{children}</p> : null}
      </div>
      {onRetry ? (
        <button type="button" className="khata-btn" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function KhataTableSkeleton({ rows = 5 }) {
  return (
    <div className="khata-skeleton-rows" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-9 w-full rounded" />
      ))}
    </div>
  );
}

/** The count on the left, "Previous · Page x of y · Next" on the right. */
export function KhataPager({ summary, page = 1, totalPages = 1, onPage, disabled = false }) {
  const pages = Math.max(1, totalPages || 1);
  return (
    <div className="khata-pager">
      <span>{summary}</span>
      {pages > 1 ? (
        <span className="khata-pager-nav">
          <button
            type="button"
            className="khata-link"
            disabled={disabled || page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="khata-link"
            disabled={disabled || page >= pages}
            onClick={() => onPage(page + 1)}
          >
            Next
          </button>
        </span>
      ) : null}
    </div>
  );
}
