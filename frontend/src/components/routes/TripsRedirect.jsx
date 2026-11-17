import { Navigate, useParams } from 'react-router-dom';

function TripsRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/auto-trips/${id}` : '/auto-trips'} replace />;
}

export default TripsRedirect;
