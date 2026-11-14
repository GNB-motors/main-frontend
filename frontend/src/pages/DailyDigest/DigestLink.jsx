import { Link } from 'react-router-dom';
import { digestDestination } from './digestDestination';

/** Digest shortcuts share route repair and keep the window behind the card. */
export default function DigestLink({ to, day, days = 1, children, className, ...props }) {
  const destination = digestDestination(to, day, days);
  if (!destination) return <span className={className}>{children}</span>;
  return (
    <Link to={destination} className={className} {...props}>
      {children}
    </Link>
  );
}
