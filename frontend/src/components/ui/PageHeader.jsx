/**
 * PageHeader — one header anatomy for every workspace.
 *
 * Title in plain words, one line that says what the screen is for, the scope
 * the numbers belong to, and a single primary action on the right. Shared by
 * the design contract (finding 9) so pages stop inventing their own h1.
 */
export default function PageHeader({
  title,
  purpose = null,
  scope = null,
  action = null,
  breadcrumb = null,
  className = '',
  children = null,
}) {
  const crumbs = Array.isArray(breadcrumb) ? breadcrumb : breadcrumb ? [breadcrumb] : [];

  return (
    <header
      className={`flex flex-wrap items-start justify-between gap-4 ${className}`}
      style={{ borderBottom: '1px solid var(--ds-line)' }}
    >
      <div className="min-w-0 flex-1">
        {crumbs.length ? (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1.5">
            {crumbs.map((crumb, index) => (
              <span
                key={`${crumb?.label ?? crumb}-${index}`}
                className="text-[12px] truncate"
                style={{ color: 'var(--ds-ink3)' }}
              >
                {crumb?.label ?? crumb}
                {index < crumbs.length - 1 ? (
                  <span aria-hidden="true" className="px-1">
                    ›
                  </span>
                ) : null}
              </span>
            ))}
          </nav>
        ) : null}

        <h1
          className="m-0 text-[24px] font-semibold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ds-ink)' }}
        >
          {title}
        </h1>

        {purpose ? (
          <p
            className="m-0 mt-1 max-w-[70ch] text-[13px] leading-relaxed"
            style={{ color: 'var(--ds-ink2)' }}
          >
            {purpose}
          </p>
        ) : null}

        {scope ? (
          <p className="m-0 mt-1 text-[12px]" style={{ color: 'var(--ds-ink3)' }}>
            {scope}
          </p>
        ) : null}

        {children}
      </div>

      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}
