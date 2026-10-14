import { formatTripCurrency } from '../tripDetail';

export default function FinancialSummary({
  trip,
  totalRevenue,
  totalExpense,
  netProfit,
  totalTrips,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      }}
    >
      {/* Revenue */}
      <div
        style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Revenue Summary
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
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
              Total Revenue
            </span>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
              {formatTripCurrency(totalRevenue)}
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
              Average per Trip
            </span>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {formatTripCurrency(totalTrips > 0 ? totalRevenue / totalTrips : 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div
        style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Expense Summary
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
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
              Total Expense
            </span>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
              {formatTripCurrency(totalExpense)}
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
              Average per Trip
            </span>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {formatTripCurrency(totalTrips > 0 ? totalExpense / totalTrips : 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Profit */}
      <div
        style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Profit Summary
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
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
              Total Profit
            </span>
            <p
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: netProfit >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {formatTripCurrency(netProfit)}
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
              Profit Margin
            </span>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {trip.journeyFinancials?.averageProfitMargin?.toFixed(2) ||
                (totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0')}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
