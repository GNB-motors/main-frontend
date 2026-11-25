import { Navigate, useLocation } from 'react-router-dom';

export default function MileageDefRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('tab', 'mileage');
  return <Navigate to={`/intelligence?${params}`} state={location.state} replace />;
}
