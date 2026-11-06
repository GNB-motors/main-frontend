import { STATUS_CLASS, STATUS_LABEL } from './autoTripFormat';

export default function TripStatus({ status, leg }) {
  return (
    <span className={`atx-status ${STATUS_CLASS[status] || 'atx-status--open'}`}>
      {status === 'COMPLETE' && leg === 'REPOSITION'
        ? 'Movement complete'
        : STATUS_LABEL[status] || status}
    </span>
  );
}
