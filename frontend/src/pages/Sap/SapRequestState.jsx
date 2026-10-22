export default function SapRequestState({ query, children }) {
  if (query.error)
    return (
      <div role="alert" className="sap-box">
        <p>This section is temporarily unavailable. Please try again shortly.</p>
        <button className="sap-btn" type="button" onClick={query.refetch}>
          Try again
        </button>
      </div>
    );
  if (!query.data) return <p role="status">{query.loading ? 'Loading…' : 'No data yet.'}</p>;
  return children;
}
