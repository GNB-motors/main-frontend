import FreshnessBadge from '../cluster/FreshnessBadge';

/**
 * PageShell — one page layout, learned once (audit §2.9).
 * Title + count, subtitle, freshness chip, primary actions, filter slot,
 * content, and an honest-counts footer. Fleet pages mount their surface here
 * so no two pages lay out differently.
 *
 *   <PageShell
 *     title="Trips" count={total} freshnessAt={generatedAt}
 *     actions={<Link className="pshell-btn pshell-btn--primary">New trip</Link>}
 *     filters={<FilterBar ... />}
 *     footer={`Showing ${rows.length} of ${total}`}
 *   >
 *     <DataTable ... />
 *   </PageShell>
 *
 * `embedded` — the page is mounted inside another page's tab (e.g. the
 * /mileage hub), which already carries the title: only actions, filters and
 * content render.
 */
export default function PageShell({
  title,
  subtitle,
  count = null,
  freshnessAt = null,
  actions = null,
  filters = null,
  footer = null,
  children,
  className = '',
  embedded = false,
}) {
  return (
    <div
      className={['pshell', embedded && 'pshell--embedded', className].filter(Boolean).join(' ')}
    >
      {!embedded || actions ? (
        <header className="pshell-head">
          {!embedded && (
            <div className="pshell-head-main">
              <div className="pshell-title-row">
                <h1 className="pshell-title">{title}</h1>
                {count != null && <span className="pshell-count num">{count}</span>}
                {freshnessAt ? <FreshnessBadge at={freshnessAt} /> : null}
              </div>
              {subtitle ? <p className="pshell-subtitle">{subtitle}</p> : null}
            </div>
          )}
          {actions ? <div className="pshell-actions">{actions}</div> : null}
        </header>
      ) : null}
      {filters ? <div className="pshell-filters">{filters}</div> : null}
      <div className="pshell-body">{children}</div>
      {footer ? <footer className="pshell-footer">{footer}</footer> : null}
    </div>
  );
}
