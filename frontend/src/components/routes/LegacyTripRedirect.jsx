import { useParams } from 'react-router-dom';
import RedirectWithState from './RedirectWithState';

export default function LegacyTripRedirect() {
  const { tripId } = useParams();
  return <RedirectWithState to={`/trip-management/trip/${encodeURIComponent(tripId)}`} />;
}
