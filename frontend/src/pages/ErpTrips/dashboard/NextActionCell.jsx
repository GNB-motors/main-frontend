import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * What the operator has to do next, so nobody has to read two gate columns and
 * infer it. `wait` means the ball is in someone else's court.
 */
const nextAction = (trip) => {
  switch (trip.state) {
    case 'CANCELLED':
      return null;
    // Queued behind a laden trip. Starting it is what cuts the previous trip's
    // telematics window, so it is a deliberate act and not automatic.
    case 'PLANNED':
      return { label: 'Start trip', drawer: 'start' };
    case 'PLACED':
    case 'ADVANCE_PENDING':
    case 'ADVANCE_PAID':
    case 'CN_PENDING':
      return { label: 'Create CN', drawer: 'cn' };
    case 'CN_UPDATED':
    case 'DISPATCHED':
      return { label: 'Close trip', drawer: 'close' };
    case 'TRIP_CLOSED':
      return { label: 'Upload POD', drawer: 'pod' };
    case 'POD_RECEIVED':
      return { label: 'Enter unloading', drawer: 'unloading' };
    case 'UNLOADED':
      return { label: 'Generate sale bill', drawer: 'salebill' };
    case 'BILLED':
      return { label: 'Awaiting payment', drawer: 'receipt', wait: true };
    default:
      return null;
  }
};

const NextActionCell = ({ trip }) => {
  const action = nextAction(trip);
  if (!action) return <span className="trippipe-action none">—</span>;
  return (
    <Link
      to={`/erp/trips/${trip._id}${action.wait ? '' : `?drawer=${action.drawer}`}`}
      className={`trippipe-action ${action.wait ? 'wait' : 'act'}`}
    >
      {action.label}
      {!action.wait && <ArrowRight size={13} />}
    </Link>
  );
};

export default NextActionCell;
