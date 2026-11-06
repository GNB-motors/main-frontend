/** Shared view controls and surfaces for the Intelligence tabs. Kept local so
 * standalone Place Hub and Route Hub retain their existing presentation. */
export function IntelligenceViewSwitcher({ label, role = 'tablist', children }) {
  return (
    <div className="intel-subview-toolbar">
      <span className="intel-subview-label">View</span>
      <div role={role} aria-label={label} className="intel-segmented">
        {children}
      </div>
    </div>
  );
}

export function IntelligenceMapWorkspace({ label, hasDetail = false, loading = false, children }) {
  return (
    <section
      aria-label={label}
      aria-busy={loading}
      className="ph-page intel-map-workspace"
      data-has-detail={hasDetail ? 'true' : 'false'}
    >
      {children}
    </section>
  );
}

export function IntelligenceAuditWorkspace({ label, children }) {
  return (
    <section aria-label={label} className="nova-rh intel-audit-workspace">
      {children}
    </section>
  );
}
