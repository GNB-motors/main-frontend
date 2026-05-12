import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Menu, Search } from 'lucide-react';
import { applyThemeToRoot } from '../utils/colorTheme';
import { useTripCreationContext } from '../contexts/TripCreationContext';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { stepName } = useTripCreationContext();
    const [activeTripsCount, setActiveTripsCount] = useState(0);
    const [mileageCount, setMileageCount] = useState(0);
    const [mileageSearch, setMileageSearch] = useState('');
    const [tripSearch, setTripSearch] = useState('');

    // Re-apply the CSS theme variables to :root whenever the theme changes,
    // instead of holding a local style copy (which can desync vs :root and
    // override descendant cascade with stale values).
    useEffect(() => {
        applyThemeToRoot();
        const handleThemeChange = () => applyThemeToRoot();
        window.addEventListener('themeColorChange', handleThemeChange);
        return () => window.removeEventListener('themeColorChange', handleThemeChange);
    }, []);

    // Listen for active trips count updates
    useEffect(() => {
        const handleTripsUpdate = (event) => {
            setActiveTripsCount(event.detail.count);
        };

        window.addEventListener('activeTripsUpdate', handleTripsUpdate);

        return () => {
            window.removeEventListener('activeTripsUpdate', handleTripsUpdate);
        };
    }, []);

    // Listen for mileage tracking count + search reset updates
    useEffect(() => {
        const handleCount = (e) => setMileageCount(e.detail?.count ?? 0);
        const handleSearchReset = (e) => setMileageSearch(e.detail?.value ?? '');
        window.addEventListener('mileageCountUpdate', handleCount);
        window.addEventListener('mileageSearchReset', handleSearchReset);
        return () => {
            window.removeEventListener('mileageCountUpdate', handleCount);
            window.removeEventListener('mileageSearchReset', handleSearchReset);
        };
    }, []);

    const handleMileageSearch = (e) => {
        const value = e.target.value;
        setMileageSearch(value);
        window.dispatchEvent(new CustomEvent('mileageSearchChange', { detail: { value } }));
    };

    // Listen for trip search reset (e.g. when switching tabs)
    useEffect(() => {
        const handleTripSearchReset = (e) => setTripSearch(e.detail?.value ?? '');
        window.addEventListener('tripSearchReset', handleTripSearchReset);
        return () => window.removeEventListener('tripSearchReset', handleTripSearchReset);
    }, []);

    const handleTripSearch = (e) => {
        const value = e.target.value;
        setTripSearch(value);
        window.dispatchEvent(new CustomEvent('tripSearchChange', { detail: { value } }));
    };

    const getPageTitle = () => {
        // If stepName is provided (trip creation flow), display it
        if (stepName) return stepName;

        // Handle trip detail pages
        if (location.pathname.match(/^\/trip-management\/trip\/[a-f0-9]+$/)) {
            return '';
        }
        if (location.pathname.match(/^\/trip-management\/weight-slip\/[a-f0-9]+$/)) {
            return 'Trip Details';
        }

        const path = location.pathname.split('/').pop().replace('-', ' ');
        if (!path) return 'Overview'; // Default title for base path
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    const isTripsPage = location.pathname.includes('/trips') || location.pathname.includes('/trip');
    const isRefuelLogsPage = location.pathname.includes('/refuel-logs');
    const isMileagePage = location.pathname.startsWith('/mileage-tracking');
    const isMileageListPage = location.pathname === '/mileage-tracking';
    const isTripListPage = location.pathname === '/trip-management';

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}><Menu /></button>
                <h2>{getPageTitle()}</h2>
                {isMileageListPage && (
                    <span className="navbar-count-badge">{mileageCount}</span>
                )}
            </div>
            <div className="navbar-right">
                {isMileageListPage && (
                    <div className="navbar-search">
                        <Search size={16} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search by vehicle or status..."
                            value={mileageSearch}
                            onChange={handleMileageSearch}
                        />
                    </div>
                )}
                {isTripListPage && (
                    <div className="navbar-search">
                        <Search size={16} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search trips or refuel journeys..."
                            value={tripSearch}
                            onChange={handleTripSearch}
                        />
                    </div>
                )}
                {isTripsPage && (
                    <>
                        {activeTripsCount > 0 && (
                            <div className="active-trips-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="3" width="15" height="13" />
                                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                                <span>{activeTripsCount} Active Trip{activeTripsCount !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                        <button
                            className="btn btn-primary trip-action-btn"
                            onClick={() => window.dispatchEvent(new CustomEvent('startNewTrip'))}
                        >
                            <Plus size={16} />
                            <span>Start New Trip</span>
                        </button>
                    </>
                )}
                {isMileagePage && (
                    <button
                        className="btn btn-primary trip-action-btn"
                        onClick={() => navigate('/mileage-tracking/new')}
                    >
                        <Plus size={16} />
                        <span>Log Fuel</span>
                    </button>
                )}

            </div>
        </header>
    );
};

export default Navbar;