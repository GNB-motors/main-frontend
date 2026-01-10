/**
 * TripDetailPage Component
 * 
 * Display detailed information about a refuel journey (trip).
 * Shows vehicle, driver, fuel logs, weight slip trips, revenue, expenses, etc.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, ChevronDown, ChevronUp, Users, MapPin, Package, DollarSign, TrendingUp, Zap } from 'lucide-react';
import '../PageStyles.css';
import './TripManagementPage.css';
import { TripService } from './services';

const TripDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    weightSlips: false,
    fuelLogs: false
  });

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await TripService.getTripById(id);
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
      'ONGOING': '#ff9800',
      'PLANNED': '#2196f3'
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  if (loading) {
    return (
      <div className="trip-detail-view">
        <div className="loading-state">
          <p>Loading journey details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="trip-detail-view">
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <p>{error || 'Journey not found'}</p>
          <button
            onClick={() => navigate('/trip-management')}
            className="back-btn"
            style={{ marginTop: '20px' }}
          >
            ← Back to Journeys
          </button>
        </div>
      </div>
    );
  }

  // Normalize mileage: prefer journeyId.mileage (contains odometer), fallback to top-level trip.mileage
  const journeyMileage = trip.journeyId?.mileage || {};
  const topMileage = trip.mileage || {};
  const displayMileage = {
    startOdometer: journeyMileage.startOdometer ?? topMileage.startOdometer,
    endOdometer: journeyMileage.endOdometer ?? topMileage.endOdometer,
    totalDistanceKm: journeyMileage.totalDistanceKm ?? topMileage.totalDistanceKm ?? topMileage.distanceKm,
    fuelLitres: journeyMileage.totalFuelUsedL ?? topMileage.fuelLitres ?? topMileage.totalFuelUsedL,
    fuelMileageKmPerL: journeyMileage.fuelMileageKmPerL ?? topMileage.fuelMileageKmPerL
  };

  // Use journeyFinancials from API response if available, otherwise calculate from weightSlipTrips
  const totalRevenue = trip.journeyFinancials?.totalRevenue || 
    trip.weightSlipTrips?.reduce((sum, wst) => sum + (wst.revenue?.actualAmountReceived || 0), 0) || 0;
  
  const totalExpense = trip.journeyFinancials?.totalExpenses || 
    trip.weightSlipTrips?.reduce((sum, wst) => {
      const exp = wst.expenses || {};
      return sum + ((exp.materialCost || 0) + (exp.toll || 0) + (exp.driverCost || 0) + 
                    (exp.driverTripExpense || 0) + (exp.royalty || 0));
    }, 0) || 0;
  
  const netProfit = trip.journeyFinancials?.netProfit ?? (totalRevenue - totalExpense);
  const totalTrips = trip.journeyFinancials?.totalTrips || trip.weightSlipTrips?.length || 0;

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
            Journey Details
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
            {trip.status?.toUpperCase()} • {totalTrips} trip{totalTrips !== 1 ? 's' : ''}
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
          {/* Trips Count Card */}
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
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Total Trips</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                {totalTrips}
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
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Total Revenue</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                {formatCurrency(totalRevenue)}
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
                color: netProfit >= 0 ? '#16a34a' : '#dc2626'
              }}>
                {formatCurrency(netProfit)}
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
                {trip.vehicleId?.registrationNumber || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Vehicle Type</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {trip.vehicleId?.vehicleType || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Driver Name</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {trip.driverId?.firstName && trip.driverId?.lastName
                  ? `${trip.driverId.firstName} ${trip.driverId.lastName}`
                  : '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Driver Phone</label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {trip.driverId?.phone || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Mileage Section */}
        {(displayMileage.startOdometer || displayMileage.endOdometer || displayMileage.totalDistanceKm || displayMileage.fuelLitres || displayMileage.fuelMileageKmPerL) && (
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <MapPin width={20} height={20} color="#1a73e8" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Mileage & Distance</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Start Odometer</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {displayMileage.startOdometer ? displayMileage.startOdometer.toLocaleString() : '-'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>km</p>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>End Odometer</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {displayMileage.endOdometer ? displayMileage.endOdometer.toLocaleString() : '-'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>km</p>
              </div>
              <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                <label style={{ fontSize: '12px', color: '#166534', fontWeight: '500', textTransform: 'uppercase' }}>Total Distance</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
                  {displayMileage.totalDistanceKm ? displayMileage.totalDistanceKm.toLocaleString() : '-'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#16a34a' }}>km</p>
              </div>
              {/* Fuel metrics */}
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Fuel Used</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {displayMileage.fuelLitres ? Number(displayMileage.fuelLitres).toLocaleString(undefined, {maximumFractionDigits:2}) : '-'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>liters</p>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Fuel Mileage</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {displayMileage.fuelMileageKmPerL ? Number(displayMileage.fuelMileageKmPerL).toFixed(2) : '-'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>km / liter</p>
              </div>
            </div>
          </div>
        )}

        {/* Fuel Management Section */}
        {trip.fuelManagement && (
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Zap width={20} height={20} color="#1a73e8" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Fuel Management</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Total Liters</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {trip.fuelManagement?.totalLiters?.toFixed(2) || '0'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>liters</p>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Total Cost</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {formatCurrency(trip.fuelManagement?.totalCost)}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                <label style={{ fontSize: '12px', color: '#166534', fontWeight: '500', textTransform: 'uppercase' }}>Average Rate</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
                  {formatCurrency(trip.fuelManagement?.averageRate)}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#16a34a' }}>per liter</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Revenue */}
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Revenue Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Total Revenue</label>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Average per Trip</label>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  {formatCurrency(totalTrips > 0 ? totalRevenue / totalTrips : 0)}
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
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Expense Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Total Expense</label>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Average per Trip</label>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  {formatCurrency(totalTrips > 0 ? totalExpense / totalTrips : 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Profit */}
          <div style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Profit Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Total Profit</label>
                <p style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  color: netProfit >= 0 ? '#16a34a' : '#dc2626'
                }}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Profit Margin</label>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  {trip.journeyFinancials?.averageProfitMargin?.toFixed(2) || 
                   (totalRevenue > 0 ? (((netProfit) / totalRevenue) * 100).toFixed(2) : '0')}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Associated Trips Section */}
        <div style={{
          background: 'white',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              marginBottom: expandedSections.weightSlips ? '20px' : '0'
            }}
            onClick={() => toggleSection('weightSlips')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package width={20} height={20} color="#1a73e8" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Associated Trips ({totalTrips})
              </h3>
            </div>
            {expandedSections.weightSlips ? <ChevronUp width={20} /> : <ChevronDown width={20} />}
          </div>

          {expandedSections.weightSlips && trip.weightSlipTrips && trip.weightSlipTrips.length > 0 && (
            <div style={{ marginTop: '0' }}>
              {trip.weightSlipTrips.map((wst, index) => (
                <div
                  key={wst._id || index}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    backgroundColor: '#f9fafb',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => navigate(`/trip-management/weight-slip/${wst._id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#1a73e8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>
                        {wst.tripNumber}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '12px' }}>
                        {wst.materialType?.toUpperCase()} • {wst.weights?.netWeight?.toLocaleString() || '-'} kg
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: getStatusColor(wst.status) + '25',
                        color: getStatusColor(wst.status),
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {wst.status}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
                    <div>
                      <span style={{ fontWeight: '500', color: '#111827' }}>Revenue:</span>
                      <br />
                      <span style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600' }}>
                        {formatCurrency(wst.revenue?.actualAmountReceived)}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: '500', color: '#111827' }}>Expense:</span>
                      <br />
                      <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600' }}>
                        {formatCurrency(
                          (wst.expenses?.materialCost || 0) + (wst.expenses?.toll || 0) + 
                          (wst.expenses?.driverCost || 0) + (wst.expenses?.driverTripExpense || 0) + 
                          (wst.expenses?.royalty || 0)
                        )}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: '500', color: '#111827' }}>Profit:</span>
                      <br />
                      <span style={{
                        fontSize: '14px',
                        color: ((wst.revenue?.actualAmountReceived || 0) - (
                          (wst.expenses?.materialCost || 0) + (wst.expenses?.toll || 0) + 
                          (wst.expenses?.driverCost || 0) + (wst.expenses?.driverTripExpense || 0) + 
                          (wst.expenses?.royalty || 0)
                        )) >= 0 ? '#16a34a' : '#dc2626',
                        fontWeight: '600'
                      }}>
                        {formatCurrency(
                          (wst.revenue?.actualAmountReceived || 0) - (
                            (wst.expenses?.materialCost || 0) + (wst.expenses?.toll || 0) + 
                            (wst.expenses?.driverCost || 0) + (wst.expenses?.driverTripExpense || 0) + 
                            (wst.expenses?.royalty || 0)
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {expandedSections.weightSlips && (!trip.weightSlipTrips || trip.weightSlipTrips.length === 0) && (
            <div style={{ padding: '20px', color: '#9ca3af', textAlign: 'center' }}>
              No trips associated with this journey
            </div>
          )}
        </div>

        {/* Timeline Section */}
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
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Status</label>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {trip.status || '-'}
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
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Journey ID</label>
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

export default TripDetailPage;
