import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Fleet page header — title, optional subtitle, breadcrumbs and an actions slot.
 *
 * Deliberately NOT a reuse of components/Erp/PageHeader.jsx. That one sets every
 * colour as an inline hex (#1a202c, #64748b, #cbd5e1), so it renders dark text
 * on a dark ground once the app is in dark mode. Fleet pages already theme
 * correctly through the cluster tokens in index.css, so this is the same layout
 * driven by var(--cluster-text) / var(--cluster-text-dim) / var(--hairline).
 *
 * Keep it presentational: no data fetching, no routing decisions.
 */
const FleetPageHeader = ({ title, subtitle, breadcrumbs = [], actions = null }) => (
  <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <ChevronRight size={12} style={{ color: 'var(--cluster-text-dim)', opacity: 0.6 }} />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:underline" style={{ color: 'var(--cluster-text-dim)' }}>
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--cluster-text)', fontWeight: 600 }}>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <h1 className="cluster-title text-2xl">{title}</h1>
      {subtitle && <p className="text-dim mt-1 text-sm">{subtitle}</p>}
    </div>

    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

export default FleetPageHeader;
