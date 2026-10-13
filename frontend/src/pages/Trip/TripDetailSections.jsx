/**
 * Presentational sections for TripDetailPage. Extracted (WS0.7/0.10) to bring
 * the page under the file-size rule; all inline markup preserved byte-identically.
 */
import {
  Users,
  MapPin,
  Package,
  DollarSign,
  TrendingUp,
  Zap,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { getTripStatusColor, formatTripDate, formatTripCurrency } from './tripDetail';

export function SummaryCards({ totalTrips, totalRevenue, netProfit }) {
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

export function VehicleDriverSection({ trip }) {
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

export function MileageSection({ displayMileage }) {
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

export function FuelManagementSection({ trip }) {
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

export function FinancialSummary({ trip, totalRevenue, totalExpense, netProfit, totalTrips }) {
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

export function AssociatedTripsSection({ trip, totalTrips, expanded, onToggle, onOpenTrip }) {
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

export function TimelineSection({ trip }) {
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
