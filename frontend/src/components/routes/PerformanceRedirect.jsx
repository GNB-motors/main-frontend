import { useLocation } from 'react-router-dom';
import RedirectWithState from './RedirectWithState';

export default function PerformanceRedirect() {
  const { search } = useLocation();
  const tab = new URLSearchParams(search).get('tab');
  return (
    <RedirectWithState
      to={`/intelligence?tab=${tab === 'drivers' || tab === 'perfDrivers' ? 'perfDrivers' : 'perfVehicles'}`}
    />
  );
}
