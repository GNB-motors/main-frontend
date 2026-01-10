/**
 * WeightSlipTripDetailPage Component
 * 
 * Display detailed information about a specific weight slip trip.
 * Includes: vehicle info, driver, material details, weights, revenue, expenses, etc.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, MapPin, Users, FileText, DollarSign, Package, TrendingUp } from 'lucide-react';
import '../PageStyles.css';
import './TripManagementPage.css';
import { WeightSlipTripService, TripService } from './services';

const WeightSlipTripDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await WeightSlipTripService.getById(id);
      const tripData = response.data;
      setTrip(tripData);
    } catch (err) {
      console.error('Failed to fetch trip details:', err);
      setError('Failed to load trip details');
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'SUBMITTED': '#4caf50',
      'COMPLETED': '#4caf50',
      'DRIVER_SELECTED': '#2196f3',
      'DOCUMENTS_UPLOADED': '#2196f3',
      'OCR_VERIFIED': '#2196f3',
      'ROUTES_ASSIGNED': '#2196f3',
      'REVENUE_ENTERED': '#ff9800',
      'EXPENSES_ENTERED': '#ff9800',
      'ONGOING': '#ff9800'
    };
    return colors[status] || '#757575';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="trip-detail-view">
        <div className="loading-state">
          <p>Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="trip-detail-view">
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <p>{error || 'Trip not found'}</p>
          <button
            onClick={() => navigate('/trip-management')}
            className="back-btn"
            style={{ marginTop: '20px' }}
          >
            ← Back to Trips
          </button>
        </div>
      </div>
    );
  }

  const journey = trip.journeyId;
  const performance = trip.performance || {};

  // Normalize mileage: prefer journey.mileage (contains odometer), fallback to top-level trip.mileage
  const journeyMileage = journey?.mileage || {};
  const topMileage = trip.mileage || {};
  const displayMileage = {
    startOdometer: journeyMileage.startOdometer ?? topMileage.startOdometer,
    endOdometer: journeyMileage.endOdometer ?? topMileage.endOdometer,
    totalDistanceKm: journeyMileage.totalDistanceKm ?? topMileage.totalDistanceKm ?? topMileage.distanceKm,
    fuelLitres: journeyMileage.totalFuelUsedL ?? topMileage.fuelLitres ?? topMileage.totalFuelUsedL ?? topMileage.fuelLitres,
    fuelMileageKmPerL: journeyMileage.fuelMileageKmPerL ?? topMileage.fuelMileageKmPerL
  };

  return (
    <div className="trip-detail-view" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => navigate('/trip-management')}
          style={{
            width: '28px',
            height: '28px',
            padding: '0',
            background: 'white',
            borderRadius: '999px',
            border: '1px solid #D3D3D5',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.borderColor = '#a0a0a0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#D3D3D5';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ArrowLeft width={14} height={14} color="#121214" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#111827' }}>
            Trip Details
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
            {trip.tripNumber} • {trip.materialType?.toUpperCase()}
          </p>
        </div>
        <div
          style={{
            backgroundColor: getStatusColor(trip.status) + '25',
            color: getStatusColor(trip.status),
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}
        >
          {trip.status}
        </div>
      </div>

      {/* Main Content */}
      <div className="trip-detail-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Net Weight Card */}
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: '#f0f9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <Package width={24} height={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Net Weight</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                {trip.weights?.netWeight?.toLocaleString() || '-'} kg
              </p>
            </div>
          </div>

          {/* Revenue Card */}
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a'
            }}>
              <DollarSign width={24} height={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Revenue</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                {formatCurrency(trip.revenue?.actualAmountReceived)}
              </p>
            </div>
          </div>

          {/* Profit Card */}
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706'
            }}>
              <TrendingUp width={24} height={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Net Profit</p>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '24px',
                fontWeight: '700',
                color: performance.netProfit >= 0 ? '#16a34a' : '#dc2626'
              }}>
                {formatCurrency(performance.netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle & Driver Section */}
        <div style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Users width={20} height={20} color="#1a73e8" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Vehicle & Driver</h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Vehicle Registration</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a73e8' }}>
                {typeof journey?.vehicleId === 'object' ? journey?.vehicleId?._id : journey?.vehicleId || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Vehicle Type</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                -
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Driver Name</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {typeof journey?.driverId === 'object' 
                  ? `${journey?.driverId?.firstName || ''} ${journey?.driverId?.lastName || ''}`.trim() || '-'
                  : journey?.driverId || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Driver Phone</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                -
              </p>
            </div>
          </div>
        </div>

        {/* Journey & Route Section */}
        <div style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <MapPin width={20} height={20} color="#1a73e8" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Journey & Material</h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Material Type</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                {trip.materialType || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Journey Status</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {journey?.status || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Journey Sequence</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                #{trip.journeySequence || '-'}
              </p>
            </div>
            {(displayMileage.startOdometer || displayMileage.endOdometer || displayMileage.totalDistanceKm || displayMileage.fuelLitres || displayMileage.fuelMileageKmPerL) && (
              <>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Start Odometer</label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {displayMileage.startOdometer ? displayMileage.startOdometer.toLocaleString() : '-'} km
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>End Odometer</label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {displayMileage.endOdometer ? displayMileage.endOdometer.toLocaleString() : '-'} km
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Total Distance</label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {displayMileage.totalDistanceKm ? displayMileage.totalDistanceKm.toLocaleString() : '-'} km
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Fuel Used</label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {displayMileage.fuelLitres ? Number(displayMileage.fuelLitres).toLocaleString(undefined, {maximumFractionDigits:2}) : '-'} liters
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Fuel Mileage</label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {displayMileage.fuelMileageKmPerL ? Number(displayMileage.fuelMileageKmPerL).toFixed(2) : '-'} km / liter
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Route Information Section */}
        {trip.routeData && (Object.keys(trip.routeData).length > 0 || trip.routeData.sourceLocation || trip.routeData.destLocation) && (
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <MapPin width={20} height={20} color="#1a73e8" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Route Information</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Route Name</label>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {trip.routeData?.name || `${trip.routeData?.sourceLocation?.city || 'Unknown'} to ${trip.routeData?.destLocation?.city || 'Unknown'}`}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Trip Type</label>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {trip.tripType === 'ROUND_TRIP' ? 'Round Trip' : 'Pickup & Drop'}
                </p>
              </div>
              {trip.routeData?.sourceLocation && (
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Source</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {trip.routeData.sourceLocation.city}, {trip.routeData.sourceLocation.state}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    {trip.routeData.sourceLocation.address}
                  </p>
                </div>
              )}
              {trip.routeData?.destLocation && (
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Destination</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {trip.routeData.destLocation.city}, {trip.routeData.destLocation.state}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    {trip.routeData.destLocation.address}
                  </p>
                </div>
              )}
              {trip.routeData?.actualDistanceKm && (
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Distance</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {trip.routeData.actualDistanceKm} km
                  </p>
                  {trip.routeData.baseDistanceKm && trip.tripType === 'ROUND_TRIP' && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Base: {trip.routeData.baseDistanceKm} km (2x for round trip)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weights Section */}
        <div style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Weight Information</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Gross Weight</label>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                {trip.weights?.grossWeight?.toLocaleString() || '-'}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>kg</p>
            </div>
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Tare Weight</label>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                {trip.weights?.tareWeight?.toLocaleString() || '-'}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>kg</p>
            </div>
            <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
              <label style={{ fontSize: '12px', color: '#166534', fontWeight: '500', textTransform: 'uppercase' }}>Net Weight</label>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                {trip.weights?.netWeight?.toLocaleString() || '-'}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#16a34a' }}>kg</p>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Revenue */}
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Revenue Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Rate per kg</label>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  ₹{trip.revenue?.ratePerKg?.toLocaleString() || '-'}
                </p>
              </div>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Amount Received</label>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
                  {formatCurrency(trip.revenue?.actualAmountReceived)}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Variance</label>
                <p style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: trip.revenue?.variance < 0 ? '#dc2626' : '#16a34a'
                }}>
                  {formatCurrency(trip.revenue?.variance)}
                </p>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Expense Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Material Cost', value: trip.expenses?.materialCost },
                { label: 'Toll', value: trip.expenses?.toll },
                { label: 'Driver Cost', value: trip.expenses?.driverCost },
                { label: 'Driver Trip Expense', value: trip.expenses?.driverTripExpense },
                { label: 'Royalty', value: trip.expenses?.royalty }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{item.label}</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {formatCurrency(item.value)}
                  </p>
                </div>
              ))}
              <div style={{ paddingTop: '12px', borderTop: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', color: '#111827', fontWeight: '600' }}>Total Expense</label>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
                  {formatCurrency(trip.expenses?.totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {performance && Object.keys(performance).length > 0 && (
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Performance Metrics</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <label style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Total Revenue</label>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0284c7' }}>
                  {formatCurrency(performance.totalRevenue)}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <label style={{ fontSize: '12px', color: '#7f1d1d', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Total Expense</label>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                  {formatCurrency(performance.totalExpense)}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                <label style={{ fontSize: '12px', color: '#166534', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Net Profit</label>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
                  {formatCurrency(performance.netProfit)}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde047' }}>
                <label style={{ fontSize: '12px', color: '#92400e', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Profit Margin</label>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#d97706' }}>
                  {performance.profitMargin?.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Section */}
        {trip.weightCertificateDoc && (
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <FileText width={20} height={20} color="#1a73e8" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Weight Certificate</h3>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {trip.weightCertificateDoc.fileKey?.split('/').pop() || 'Weight Certificate'}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  {trip.weightCertificateDoc.docType}
                </p>
              </div>
              {trip.weightCertificateDoc.publicUrl && (
                <a
                  href={trip.weightCertificateDoc.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#1a73e8',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1565c0'}
                  onMouseLeave={(e) => e.target.style.background = '#1a73e8'}
                >
                  <Download width={16} height={16} />
                  Download
                </a>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Timeline & Info</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Trip Number</label>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827', fontFamily: 'monospace' }}>
                {trip.tripNumber || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Created At</label>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {formatDate(trip.createdAt)}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Updated At</label>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {formatDate(trip.updatedAt)}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Trip ID</label>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#111827', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {trip._id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightSlipTripDetailPage;
