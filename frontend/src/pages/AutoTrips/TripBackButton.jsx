import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { tripListHref } from './tripWorkspace';

export default function TripBackButton() {
  const location = useLocation();
  const [params] = useSearchParams();
  const returnTo = location.state?.tripsReturnTo;
  const to =
    typeof returnTo === 'string' &&
    (returnTo === '/auto-trips' || returnTo.startsWith('/auto-trips?'))
      ? returnTo
      : tripListHref(params);
  return (
    <Link to={to} className="trip-back-circle" aria-label="Back to trips" title="Back to trips">
      <ArrowLeft size={18} aria-hidden="true" />
    </Link>
  );
}
