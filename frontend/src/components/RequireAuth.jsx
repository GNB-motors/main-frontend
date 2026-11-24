import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../utils/session.js';
import { isTokenExpired } from '../utils/authUtils.js';

// An expired token counts as signed out: mounting the shell with it only fires
// requests that are certain to 401 before the interceptor bounces the user.
export default function RequireAuth({ children }) {
  const { pathname, search, hash } = useLocation();
  const token = getToken();
  if (!token || isTokenExpired(token))
    return <Navigate to="/login" replace state={{ returnTo: pathname + search + hash }} />;
  return children;
}
