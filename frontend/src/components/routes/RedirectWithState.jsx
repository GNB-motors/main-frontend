import { Navigate, useLocation } from 'react-router-dom';

function RedirectWithState({ to }) {
  const location = useLocation();
  const target = new URL(to, 'https://fleet.invalid');
  const params = new URLSearchParams(location.search);
  // A redirect's explicit keys select the destination view; the remaining
  // truck, driver and date filters belong to the link that was opened.
  for (const [key, value] of target.searchParams) params.set(key, value);
  const search = params.toString();
  return (
    <Navigate
      to={`${target.pathname}${search ? `?${search}` : ''}${target.hash || location.hash}`}
      state={location.state}
      replace
    />
  );
}

export default RedirectWithState;
