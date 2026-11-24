import { Link } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';

export default function NotFoundPage() {
  return (
    <PageShell title="Page not found" subtitle="This link may be old, or the page may have moved.">
      <Link to="/digest" className="underline">
        Back to Daily Digest
      </Link>
    </PageShell>
  );
}
