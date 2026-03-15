import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleMap, useLoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api';
import {
    ArrowLeft, Truck, MapPin, Calendar, User, Fuel, Route,
    Gauge, BadgeIndianRupee, FileText, Clock, CircleDot, Weight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import WeightCertificateModal from './WeightCertificateModal';
import './TripReportDetailPage.css';

const GOOGLE_MAPS_LIBRARIES = ['places', 'directions'];

const TripReportDetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const trip = location.state?.trip;

    const [directions, setDirections] = useState(null);
    const [mapPoints, setMapPoints] = useState({ start: null, end: null });
    const [weightCertOpen, setWeightCertOpen] = useState(false);
    const mapRef = useRef(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    // Normalize data - handle both TripLedger shape and flat TripReport shape
    const driverName = trip?.driver?.fullName || trip?.driverName || '-';
    const vehicleReg = trip?.vehicle?.registrationNumber || trip?.vehicleRegNo || '-';
    const vehicleType = trip?.vehicle?.vehicleType || '-';
    const routeName = trip?.route?.name || trip?.route || '-';
    const startLoc = trip?.route?.sourceLocation?.city || trip?.startLocation || '-';
    const endLoc = trip?.route?.destLocation?.city || trip?.endLocation || '-';
    const distanceKm = trip?.route?.distanceKm || trip?.distanceKm;
    const revenue = trip?.performance?.totalRevenue;
    const expense = trip?.performance?.totalExpense;
    const profit = trip?.performance?.netProfit;
    const profitMargin = trip?.performance?.profitMargin;
    const grossWeight = trip?.weights?.grossWeight;
    const tareWeight = trip?.weights?.tareWeight;
    const netWeight = trip?.weights?.netWeight;

    // Calculate route directions
    const calculateRoute = useCallback(() => {
        if (!isLoaded || !window.google || !trip) return;
        if (startLoc === '-' || endLoc === '-') return;

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: startLoc,
                destination: endLoc,
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK') {
                    setDirections(result);
                    const leg = result.routes[0]?.legs[0];
                    if (leg) {
                        setMapPoints({
                            start: { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
                            end: { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
                        });
                    }
                }
            }
        );
    }, [isLoaded, trip, startLoc, endLoc]);

    useEffect(() => {
        if (isLoaded && trip) {
            calculateRoute();
        }
    }, [isLoaded, trip, calculateRoute]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '-';
        return `\u20B9${value.toLocaleString('en-IN')}`;
    };

    if (!trip) {
        return (
            <div className="trip-report-detail">
                <div className="trip-detail-empty">
                    <p>Trip data not available.</p>
                    <Button variant="outline" onClick={() => navigate('/reports')}>
                        <ArrowLeft size={16} /> Back to Reports
                    </Button>
                </div>
            </div>
        );
    }

    // Custom SVG marker icons (Lucide-style)
    const startMarkerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="%2316a34a" stroke="white" stroke-width="3"/>
      <svg x="10" y="10" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2"/>
        <circle cx="7" cy="18" r="2"/>
      </svg>
    </svg>`;

    const endMarkerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12 18 30 18 30s18-18 18-30C36 8.06 27.94 0 18 0z" fill="%23dc2626"/>
      <circle cx="18" cy="18" r="8" fill="white"/>
      <circle cx="18" cy="18" r="4" fill="%23dc2626"/>
    </svg>`;

    return (
        <div className="trip-report-detail">
            {/* Back Navigation */}
            <button className="back-nav-btn" onClick={() => navigate('/reports')}>
                <ArrowLeft size={16} />
                Back to Reports
            </button>

            {/* Header */}
            <div className="trip-detail-header">
                <div className="trip-detail-header-left">
                    <div>
                        <h2 className="trip-detail-title">Trip Details</h2>
                        <p className="trip-detail-subtitle">
                            {trip.tripNumber ? `#${trip.tripNumber} \u2022 ` : ''}{routeName}
                        </p>
                    </div>
                </div>
                <div className="trip-detail-header-right">
                    <span
                        className="trip-status-badge"
                        style={{
                            backgroundColor: (trip.status === 'COMPLETED' || trip.status === 'SUBMITTED') ? '#dcfce7' : '#fef3c7',
                            color: (trip.status === 'COMPLETED' || trip.status === 'SUBMITTED') ? '#16a34a' : '#d97706'
                        }}
                    >
                        {trip.status || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Main Content - Map Left, Details Right */}
            <div className="trip-detail-body">
                {/* Left - Map */}
                <div className="trip-detail-map-section">
                    <div className="map-container-wrapper">
                        {loadError && (
                            <div className="map-error">
                                <MapPin size={32} />
                                <p>Failed to load Google Maps</p>
                            </div>
                        )}
                        {!isLoaded && !loadError && (
                            <div className="map-loading">
                                <div className="map-loading-spinner" />
                                <p>Loading map...</p>
                            </div>
                        )}
                        {isLoaded && !loadError && (
                            <GoogleMap
                                mapContainerClassName="trip-map"
                                center={{ lat: 22.5726, lng: 88.3639 }}
                                zoom={6}
                                onLoad={(map) => { mapRef.current = map; }}
                                options={{
                                    zoomControl: true,
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: true,
                                }}
                            >
                                {directions && (
                                    <DirectionsRenderer
                                        directions={directions}
                                        options={{
                                            polylineOptions: {
                                                strokeColor: '#1a73e8',
                                                strokeWeight: 4,
                                                strokeOpacity: 0.8,
                                            },
                                            suppressMarkers: true,
                                        }}
                                    />
                                )}
                                {mapPoints.start && (
                                    <Marker
                                        position={mapPoints.start}
                                        title={`Start: ${startLoc}`}
                                        icon={{
                                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(startMarkerSvg),
                                            scaledSize: new window.google.maps.Size(44, 44),
                                            anchor: new window.google.maps.Point(22, 22),
                                        }}
                                    />
                                )}
                                {mapPoints.end && (
                                    <Marker
                                        position={mapPoints.end}
                                        title={`End: ${endLoc}`}
                                        icon={{
                                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(endMarkerSvg),
                                            scaledSize: new window.google.maps.Size(36, 48),
                                            anchor: new window.google.maps.Point(18, 48),
                                        }}
                                    />
                                )}
                            </GoogleMap>
                        )}
                    </div>

                    {/* Route Info below map */}
                    <div className="route-info-bar">
                        <div className="route-point">
                            <CircleDot size={16} color="#16a34a" />
                            <div>
                                <span className="route-label">From</span>
                                <span className="route-value">{startLoc}</span>
                            </div>
                        </div>
                        <div className="route-line" />
                        <div className="route-point">
                            <MapPin size={16} color="#dc2626" />
                            <div>
                                <span className="route-label">To</span>
                                <span className="route-value">{endLoc}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Details */}
                <div className="trip-detail-info-section">
                    {/* Trip Overview Card */}
                    <div className="detail-card">
                        <h3 className="detail-card-title">
                            <Route size={18} />
                            Trip Overview
                        </h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <Calendar size={14} />
                                <div>
                                    <span className="detail-label">Trip Date</span>
                                    <span className="detail-value">{formatDate(trip.tripDate)}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Truck size={14} />
                                <div>
                                    <span className="detail-label">Vehicle</span>
                                    <span className="detail-value">{vehicleReg}</span>
                                    {vehicleType !== '-' && <span className="detail-sub">{vehicleType}</span>}
                                </div>
                            </div>
                            <div className="detail-item">
                                <User size={14} />
                                <div>
                                    <span className="detail-label">Driver</span>
                                    <span className="detail-value">{driverName}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Clock size={14} />
                                <div>
                                    <span className="detail-label">Status</span>
                                    <span className="detail-value" style={{
                                        color: (trip.status === 'COMPLETED' || trip.status === 'SUBMITTED') ? '#16a34a' : '#d97706',
                                        fontWeight: 600
                                    }}>
                                        {trip.status || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Card */}
                    <div className="detail-card">
                        <h3 className="detail-card-title">
                            <BadgeIndianRupee size={18} />
                            Financial Summary
                        </h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <BadgeIndianRupee size={14} />
                                <div>
                                    <span className="detail-label">Revenue</span>
                                    <span className="detail-value highlight-green">{formatCurrency(revenue)}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <BadgeIndianRupee size={14} />
                                <div>
                                    <span className="detail-label">Expense</span>
                                    <span className="detail-value highlight-red">{formatCurrency(expense)}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <BadgeIndianRupee size={14} />
                                <div>
                                    <span className="detail-label">Net Profit</span>
                                    <span className={`detail-value ${profit >= 0 ? 'highlight-green' : 'highlight-red'}`}>
                                        {formatCurrency(profit)}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Gauge size={14} />
                                <div>
                                    <span className="detail-label">Profit Margin</span>
                                    <span className={`detail-value ${profitMargin >= 0 ? 'highlight-green' : 'highlight-red'}`}>
                                        {typeof profitMargin === 'number' ? `${profitMargin.toFixed(1)}%` : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weight & Distance Card */}
                    <div className="detail-card">
                        <h3 className="detail-card-title">
                            <Gauge size={18} />
                            Weight & Distance
                        </h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <MapPin size={14} />
                                <div>
                                    <span className="detail-label">Distance</span>
                                    <span className="detail-value highlight-blue">
                                        {typeof distanceKm === 'number' ? `${distanceKm.toLocaleString('en-IN')} km` : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Weight size={14} />
                                <div>
                                    <span className="detail-label">Net Weight</span>
                                    <span className="detail-value">
                                        {typeof netWeight === 'number' ? `${netWeight.toLocaleString('en-IN')} kg` : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Weight size={14} />
                                <div>
                                    <span className="detail-label">Gross Weight</span>
                                    <span className="detail-value">
                                        {typeof grossWeight === 'number' ? `${grossWeight.toLocaleString('en-IN')} kg` : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Weight size={14} />
                                <div>
                                    <span className="detail-label">Tare Weight</span>
                                    <span className="detail-value">
                                        {typeof tareWeight === 'number' ? `${tareWeight.toLocaleString('en-IN')} kg` : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Route Card */}
                    <div className="detail-card">
                        <h3 className="detail-card-title">
                            <MapPin size={18} />
                            Route Information
                        </h3>
                        <div className="detail-grid single-col">
                            <div className="detail-item">
                                <CircleDot size={14} color="#16a34a" />
                                <div>
                                    <span className="detail-label">Start Location</span>
                                    <span className="detail-value">{startLoc}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <MapPin size={14} color="#dc2626" />
                                <div>
                                    <span className="detail-label">End Location</span>
                                    <span className="detail-value">{endLoc}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Route size={14} />
                                <div>
                                    <span className="detail-label">Route Name</span>
                                    <span className="detail-value">{routeName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weight Certificate Button */}
                    <Button
                        className="weight-cert-btn"
                        onClick={() => setWeightCertOpen(true)}
                    >
                        <FileText size={18} />
                        View Weight Certificate
                    </Button>
                </div>
            </div>

            {/* Weight Certificate Modal */}
            <WeightCertificateModal
                isOpen={weightCertOpen}
                onClose={() => setWeightCertOpen(false)}
                trip={trip}
            />
        </div>
    );
};

export default TripReportDetailPage;
