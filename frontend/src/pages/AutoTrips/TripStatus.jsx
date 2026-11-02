import { STATUS_CLASS, STATUS_LABEL } from './autoTripFormat';

export default function TripStatus({ status }) {
  return (
    <span className={`atx-status ${STATUS_CLASS[status] || 'atx-status--open'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
