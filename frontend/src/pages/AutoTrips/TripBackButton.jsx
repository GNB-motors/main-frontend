import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TripBackButton() {
  return (
    <Link
      to="/auto-trips"
      className="trip-back-circle"
      aria-label="Back to trips"
      title="Back to trips"
    >
      <ArrowLeft size={18} aria-hidden="true" />
    </Link>
  );
}
