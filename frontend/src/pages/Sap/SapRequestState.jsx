import { CloudOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
export default function SapRequestState({ query, children }) {
  if (query.error)
    return (
      <div role="alert" className="sap-card sap-empty">
        <CloudOff size={28} aria-hidden="true" />
        <strong>Could not load this section</strong>
        <p>Please try again shortly.</p>
        <Button variant="outline" size="sm" onClick={query.refetch}>
          Try again
        </Button>
      </div>
    );
  if (!query.data)
    return (
      <div
        role="status"
        aria-label={query.loading ? 'Loading' : 'No data yet'}
        className="sap-loading"
      />
    );
  return children;
}
