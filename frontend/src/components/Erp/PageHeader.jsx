import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [], // [{ label: 'ERP', to: '/erp' }, { label: 'Pipeline' }]
  actions = null,
}) => {
  return (
    <header className="erp-page-header" style={{ marginBottom: '24px' }}>
      <div>
        {breadcrumbs.length > 0 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={b.label}>
                {idx > 0 && <ChevronRight size={12} style={{ color: '#cbd5e1' }} />}
                {b.to ? (
                  <Link to={b.to} style={{ color: '#64748b', textDecoration: 'none' }} className="hover:underline">
                    {b.label}
                  </Link>
                ) : (
                  <span style={{ fontWeight: 600, color: '#1a202c' }}>{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#1a202c', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {title}
        </h1>
        {subtitle && <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{subtitle}</p>}
      </div>

      {actions && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
