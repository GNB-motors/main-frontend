/**
 * TripDetailPage Component
 *
 * Display detailed information about a refuel journey (trip).
 * Shows vehicle, driver, fuel logs, weight slip trips, revenue, expenses, etc.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import '../PageStyles.css';
import './TripManagementPage.css';
import { TripService } from './services';
import { getTripStatusColor, normalizeTripMileage, computeTripFinancials } from './tripDetail';
import {
  SummaryCards,
  VehicleDriverSection,
  MileageSection,
  FuelManagementSection,
  FinancialSummary,
  AssociatedTripsSection,
  TimelineSection,
} from './TripDetailSections';

const TripDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    weightSlips: false,
    fuelLogs: false,
  });

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  // Enable Start New Trip button to work from this page
  useEffect(() => {
    const handleStartNewTrip = () => navigate('/trip/new');
    window.addEventListener('startNewTrip', handleStartNewTrip);
    return () => window.removeEventListener('startNewTrip', handleStartNewTrip);
  }, [navigate]);

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

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
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

  const displayMileage = normalizeTripMileage(trip);
  const { totalRevenue, totalExpense, netProfit, totalTrips } = computeTripFinancials(trip);

  return (
    <div className="trip-detail-view" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
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
            transition: 'all 0.2s ease',
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
            backgroundColor: getTripStatusColor(trip.status) + '25',
            color: getTripStatusColor(trip.status),
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
          }}
        >
          {trip.status}
        </div>
      </div>

      {/* Main Content */}
      <div className="trip-detail-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <SummaryCards totalTrips={totalTrips} totalRevenue={totalRevenue} netProfit={netProfit} />

        <VehicleDriverSection trip={trip} />

        <MileageSection displayMileage={displayMileage} />

        <FuelManagementSection trip={trip} />

        <FinancialSummary
          trip={trip}
          totalRevenue={totalRevenue}
          totalExpense={totalExpense}
          netProfit={netProfit}
          totalTrips={totalTrips}
        />

        <AssociatedTripsSection
          trip={trip}
          totalTrips={totalTrips}
          expanded={expandedSections.weightSlips}
          onToggle={() => toggleSection('weightSlips')}
          onOpenTrip={(wst) => navigate(`/trip-management/weight-slip/${wst._id}`)}
        />

        <TimelineSection trip={trip} />
      </div>
    </div>
  );
};

export default TripDetailPage;
