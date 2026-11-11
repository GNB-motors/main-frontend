export default function RouteComparison({ route }) {
  if (!route.sap) return <span className="ud-pill ud-pill--muted">SAP not set</span>;
  if (!route.n) return <span className="ud-pill ud-pill--muted">No trips yet</span>;
  const verdict = route.sap.comparison?.verdict;
  if (!verdict || verdict === 'NO_KM')
    return <span className="ud-pill ud-pill--muted">More distance evidence needed</span>;
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
