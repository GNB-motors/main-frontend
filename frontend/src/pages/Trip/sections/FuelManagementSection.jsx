import { Zap } from 'lucide-react';
import { formatTripCurrency } from '../tripDetail';

export default function FuelManagementSection({ trip }) {
  if (!trip.fuelManagement) return null;
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
        <Zap width={20} height={20} color="#1a73e8" />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Fuel Management
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
            Total Liters
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            {trip.fuelManagement?.totalLiters?.toFixed(2) || '0'}
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
            Total Cost
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            {formatTripCurrency(trip.fuelManagement?.totalCost)}
          </p>
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
            Average Rate
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
            {formatTripCurrency(trip.fuelManagement?.averageRate)}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#16a34a' }}>per liter</p>
        </div>
      </div>
    </div>
  );
}
