import React from 'react';
import PageHeader from './PageHeader';

/**
 * PageShell — the outer frame every ERP page renders into.
 *
 * WHY THIS EXISTS:
 * The four hub pages (Pipeline / Billing / Payables / Accounts) each render a
 * PageHeader and then mount a child page with `embedded={true}`. But no child
 * page ever destructured that prop, so each one also rendered its own
 * `.erp-page` wrapper and its own `<h1>` — every financial tab shipped with two
 * stacked titles and doubled padding.
 *
 * Centralising it here rather than destructuring `embedded` in eight files
 * means the rule lives in one place and any new page inherits it for free.
 *
 * Standalone (`embedded={false}`): full page chrome — padding, breadcrumbs, h1.
 * Embedded (`embedded={true}`): no chrome at all. The hub already rendered the
 * heading; the child contributes only its actions row and its content.
 */
const PageShell = ({
  embedded = false,
  title,
  subtitle = null,
  breadcrumbs = [],
  actions = null,
  children,
}) => {
  if (embedded) {
    return (
      <>
        {actions && (
          <div
            className="erp-header-actions"
            style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '16px', flexWrap: 'wrap' }}
          >
            {actions}
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <div className="erp-page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      {children}
    </div>
  );
};

export default PageShell;
