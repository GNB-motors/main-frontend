import { MapPin } from 'lucide-react';

export default function MileageSection({ displayMileage }) {
  if (
    !displayMileage.startOdometer &&
    !displayMileage.endOdometer &&
    !displayMileage.totalDistanceKm &&
    !displayMileage.fuelLitres &&
    !displayMileage.fuelMileageKmPerL
  ) {
    return null;
  }
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
        <MapPin width={20} height={20} color="#1a73e8" />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Mileage & Distance
        </h3>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
            }}
          >
            Start Odometer
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            {displayMileage.startOdometer ? displayMileage.startOdometer.toLocaleString() : '-'}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>km</p>
        </div>
        <div
          style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
            }}
          >
            End Odometer
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            {displayMileage.endOdometer ? displayMileage.endOdometer.toLocaleString() : '-'}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>km</p>
        </div>
        <div
          style={{
            padding: '16px',
            background: '#dcfce7',
            borderRadius: '8px',
            border: '1px solid #b7e4c7',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#166534',
              fontWeight: '500',
              textTransform: 'uppercase',
            }}
          >
            Total Distance
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
            {displayMileage.totalDistanceKm ? displayMileage.totalDistanceKm.toLocaleString() : '-'}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#16a34a' }}>km</p>
        </div>
        {/* Fuel metrics */}
        <div
          style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
            }}
          >
            Fuel Used
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            {displayMileage.fuelLitres
              ? Number(displayMileage.fuelLitres).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })
              : '-'}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>liters</p>
        </div>
        <div
          style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
            }}
          >
            Fuel Mileage
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            {displayMileage.fuelMileageKmPerL
              ? Number(displayMileage.fuelMileageKmPerL).toFixed(2)
              : '-'}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>km / liter</p>
        </div>
      </div>
    </div>
  );
}
