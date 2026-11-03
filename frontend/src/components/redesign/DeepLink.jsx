import { Link } from 'react-router-dom';
import { fleetDestination } from '@/utils/redesign/fleetDestination';

/**
 * DeepLink — a link the backend decided the destination of.
 *
 * Components never build an app URL by hand. The API sends `link.to`, and
 * this renders it, so the Intelligence page, the Digest and the Track panel
 * can never point at different screens.
 */
export default function DeepLink({ link = null, className = '' }) {
  const destination = fleetDestination(link?.to);
  if (!destination) return null;

  return (
    <Link
      to={destination}
      className={`text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline ${className}`}
    >
      {`${link.label} →`}
    </Link>
  );
}
