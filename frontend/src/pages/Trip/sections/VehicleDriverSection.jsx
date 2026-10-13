import { Users } from 'lucide-react';

export default function VehicleDriverSection({ trip }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Users width={20} height={20} color="#1a73e8" />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Vehicle & Driver
        </h3>
      </div>
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
            Vehicle Registration
          </span>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a73e8' }}>
            {trip.vehicleId?.registrationNumber ||
              trip.journeyId?.vehicleId?.registrationNumber ||
              '-'}
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
            Vehicle Model
          </span>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {trip.vehicleId?.model || trip.journeyId?.vehicleId?.model || '-'}
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
            Driver Name
          </span>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {trip.driverId?.firstName && trip.driverId?.lastName
              ? `${trip.driverId.firstName} ${trip.driverId.lastName}`
              : trip.journeyId?.driverId?.firstName && trip.journeyId?.driverId?.lastName
                ? `${trip.journeyId.driverId.firstName} ${trip.journeyId.driverId.lastName}`
                : '-'}
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
            Driver Phone
          </span>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {trip.driverId?.mobileNumber || trip.journeyId?.driverId?.mobileNumber || '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
