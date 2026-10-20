import { Package, ChevronUp, ChevronDown } from 'lucide-react';
import { getTripStatusColor, formatTripCurrency } from '../tripDetail';

export default function AssociatedTripsSection({
  trip,
  totalTrips,
  expanded,
  onToggle,
  onOpenTrip,
}) {
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
      <div
        role="button"
        tabIndex={0}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: expanded ? '20px' : '0',
        }}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package width={20} height={20} color="#1a73e8" />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Associated Trips ({totalTrips})
          </h3>
        </div>
        {expanded ? <ChevronUp width={20} /> : <ChevronDown width={20} />}
      </div>

      {expanded && trip.weightSlipTrips && trip.weightSlipTrips.length > 0 && (
        <div style={{ marginTop: '0' }}>
          {trip.weightSlipTrips.map((wst, index) => (
            <div
              key={wst._id || index}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: '#f9fafb',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => onOpenTrip(wst)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenTrip(wst);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#1a73e8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <span style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>
                    {wst.tripNumber}
                  </span>
                  <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '12px' }}>
                    {wst.materialType?.toUpperCase()} •{' '}
                    {wst.weights?.netWeight?.toLocaleString() || '-'} kg
                  </span>
                </div>
                <span
                  style={{
                    backgroundColor: getTripStatusColor(wst.status) + '25',
                    color: getTripStatusColor(wst.status),
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {wst.status}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  fontSize: '13px',
                  color: '#6b7280',
                }}
              >
                <div>
                  <span style={{ fontWeight: '500', color: '#111827' }}>Revenue:</span>
                  <br />
                  <span style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600' }}>
                    {formatTripCurrency(wst.revenue?.actualAmountReceived)}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '500', color: '#111827' }}>Expense:</span>
                  <br />
                  <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600' }}>
                    {formatTripCurrency(wst.expenses?.totalExpense || 0)}
                  </span>
                  {wst.expenses?.allocatedFuelCost > 0 && (
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '4px' }}>
                      (incl. ₹{wst.expenses.allocatedFuelCost.toLocaleString()} fuel)
                    </span>
                  )}
                </div>
                <div>
                  <span style={{ fontWeight: '500', color: '#111827' }}>Profit:</span>
                  <br />
                  <span
                    style={{
                      fontSize: '14px',
                      color:
                        (wst.performance?.netProfit ??
                          (wst.revenue?.actualAmountReceived || 0) -
                            (wst.expenses?.totalExpense || 0)) >= 0
                          ? '#16a34a'
                          : '#dc2626',
                      fontWeight: '600',
                    }}
                  >
                    {formatTripCurrency(
                      wst.performance?.netProfit ??
                        (wst.revenue?.actualAmountReceived || 0) -
                          (wst.expenses?.totalExpense || 0),
                    )}
                  </span>
                </div>
                {wst.revenue?.variance !== undefined && wst.revenue?.variance !== 0 && (
                  <div>
                    <span style={{ fontWeight: '500', color: '#111827' }}>Variance:</span>
                    <br />
                    <span
                      style={{
                        fontSize: '14px',
                        color: wst.revenue.variance > 0 ? '#d97706' : '#dc2626',
                        fontWeight: '600',
                      }}
                    >
                      {formatTripCurrency(Math.abs(wst.revenue.variance))}
                      <span style={{ fontSize: '11px', marginLeft: '4px', fontWeight: '400' }}>
                        {wst.revenue.variance > 0 ? '(underpaid)' : '(overpaid)'}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && (!trip.weightSlipTrips || trip.weightSlipTrips.length === 0) && (
        <div style={{ padding: '20px', color: '#9ca3af', textAlign: 'center' }}>
          No trips associated with this journey
        </div>
      )}
    </div>
  );
}
