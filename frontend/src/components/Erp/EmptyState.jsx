import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * The ERP's one empty state. Extracted from ErpTable so the master lists that
 * replaced bare <ul> markup render the same "nothing here" treatment as tables
 * — several of those lists previously rendered as a blank card, which is
 * indistinguishable from a failed load.
 */
const EmptyState = ({
  icon = null,
  text = 'No records found',
  hint = null,
  cta = null,
  compact = false,
}) => {
  // Assigned in the body rather than renamed in the destructure: this repo's
  // ESLint has no react plugin, so JSX identifiers don't count as "used" and
  // only the `varsIgnorePattern: ^[A-Z_]` escape hatch keeps components quiet.
  const Icon = icon || Inbox;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        color: '#64748b',
        padding: compact ? '20px 16px' : '40px 16px',
        textAlign: 'center',
      }}
    >
      <Icon size={compact ? 24 : 32} style={{ color: '#cbd5e1' }} />
      <p style={{ margin: 0, fontWeight: 500 }}>{text}</p>
      {hint && <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{hint}</p>}
      {cta && <div style={{ marginTop: '8px' }}>{cta}</div>}
    </div>
  );
};

export default EmptyState;
