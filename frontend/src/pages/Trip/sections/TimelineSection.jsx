import { formatTripDate } from '../tripDetail';

export default function TimelineSection({ trip }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
        Timeline & Info
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Status
          </span>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            {trip.status || '-'}
          </p>
        </div>
        <div>
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Created At
          </span>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            {formatTripDate(trip.createdAt)}
          </p>
        </div>
        <div>
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Updated At
          </span>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            {formatTripDate(trip.updatedAt)}
          </p>
        </div>
        <div>
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Journey ID
          </span>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: '600',
              color: '#111827',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            {trip._id}
          </p>
        </div>
      </div>
    </div>
  );
}
