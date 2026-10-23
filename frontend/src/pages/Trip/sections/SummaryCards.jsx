import { Package, DollarSign, TrendingUp } from 'lucide-react';
import { formatTripCurrency } from '../tripDetail';

export default function SummaryCards({ totalTrips, totalRevenue, netProfit }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}
    >
      {/* Trips Count Card */}
      <div
        style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
          }}
        >
          <Package width={24} height={24} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
            Total Trips
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>
            {totalTrips}
          </p>
        </div>
      </div>

      {/* Revenue Card */}
      <div
        style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16a34a',
          }}
        >
          <DollarSign width={24} height={24} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
            Total Revenue
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
            {formatTripCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Profit Card */}
      <div
        style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706',
          }}
        >
          <TrendingUp width={24} height={24} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
            Net Profit
          </p>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '24px',
              fontWeight: '700',
              color: netProfit >= 0 ? '#16a34a' : '#dc2626',
            }}
          >
            {formatTripCurrency(netProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}
