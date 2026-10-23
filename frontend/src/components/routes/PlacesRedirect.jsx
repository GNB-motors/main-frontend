import { Navigate, useLocation } from 'react-router-dom';

// Place Intelligence was folded into Place Hub; `?place=<siteId>` still opens that place.
function PlacesRedirect() {
  const id = new URLSearchParams(useLocation().search).get('place');
  const to = id ? `/place-hub?place=${encodeURIComponent(`site:${id}`)}` : '/place-hub';
  return <Navigate to={to} replace />;
}

export default PlacesRedirect;
