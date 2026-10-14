import { Navigate, useLocation } from 'react-router-dom';

function RedirectWithState({ to }) {
  const location = useLocation();
  return <Navigate to={to} state={location.state} replace />;
}

export default RedirectWithState;
