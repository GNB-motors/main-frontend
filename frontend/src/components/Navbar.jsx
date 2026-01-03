import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Menu } from 'lucide-react';
import { getPrimaryColor, getThemeCSS } from '../utils/colorTheme';
import { useTripCreationContext } from '../contexts/TripCreationContext';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { stepName } = useTripCreationContext();
    const [themeColors, setThemeColors] = useState(getThemeCSS());
    const [activeTripsCount, setActiveTripsCount] = useState(0);
    
    // Update theme colors when component mounts or profile color changes
    useEffect(() => {
        const updateTheme = () => {
            const newTheme = getThemeCSS();
            console.log('Navbar theme colors:', newTheme);
            setThemeColors(newTheme);
        };
        
        updateTheme();
        
        // Listen for storage changes (when profile color is updated)
        window.addEventListener('storage', updateTheme);
        
        return () => {
            window.removeEventListener('storage', updateTheme);
        };
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

    console.log('Navbar rendering with themeColors:', themeColors);
    console.log('Current path:', location.pathname, 'Is trips page:', isTripsPage);
    
    return (
        <header className="navbar" style={themeColors}>
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}><Menu /></button>
                <h2>{getPageTitle()}</h2>
            </div>
            <div className="navbar-right">
                {isTripsPage && (
                    <>
                        {activeTripsCount > 0 && (
                            <div className="active-trips-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="3" width="15" height="13"/>
                                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                                    <circle cx="5.5" cy="18.5" r="2.5"/>
                                    <circle cx="18.5" cy="18.5" r="2.5"/>
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

            </div>
        </header>
    );
};

export default Navbar;