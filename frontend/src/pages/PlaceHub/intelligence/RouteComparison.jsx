/** `compact` shortens the long evidence label for table cells; the title keeps the full text. */
export default function RouteComparison({ route, compact = false }) {
  if (!route.sap) return <span className="ud-pill ud-pill--muted">SAP not set</span>;
  if (!route.n) return <span className="ud-pill ud-pill--muted">No trips yet</span>;
  const verdict = route.sap.comparison?.verdict;
  if (!verdict || verdict === 'NO_KM')
    return (
      <span className="ud-pill ud-pill--muted" title="More distance evidence needed">
        {compact ? 'Needs km evidence' : 'More distance evidence needed'}
      </span>
    );
  return (
    <span className={`ud-pill ud-pill--${verdict.toLowerCase()}`}>
      {verdict === 'OVER'
        ? 'Over SAP'
        : verdict === 'UNDER'
          ? 'Under SAP'
          : `Within ${route.sap.tolerancePct ?? 10}%`}
    </span>
  );
}
