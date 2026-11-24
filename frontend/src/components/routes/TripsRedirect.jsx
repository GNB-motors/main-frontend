import { useParams } from 'react-router-dom';
import RedirectWithState from './RedirectWithState';

function TripsRedirect() {
  const { id } = useParams();
  return <RedirectWithState to={id ? `/auto-trips/${encodeURIComponent(id)}` : '/auto-trips'} />;
}

export default TripsRedirect;
