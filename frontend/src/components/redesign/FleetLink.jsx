import { Link } from 'react-router-dom';
import { fleetDestination } from '@/utils/redesign/fleetDestination';

/** Only operational destinations may be opened by a fleet report shortcut. */
export default function FleetLink({ to, children, className, hideUnavailable = false, ...props }) {
  const destination = fleetDestination(to);
  if (!destination) return hideUnavailable ? null : <span className={className}>{children}</span>;
  return (
    <Link to={destination} className={className} {...props}>
      {children}
    </Link>
  );
}
