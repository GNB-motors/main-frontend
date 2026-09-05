import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Menu, Sun, Moon } from 'lucide-react';
import { applyThemeToRoot } from '../utils/colorTheme';
import { useTheme } from '../hooks/useTheme';
import { useTripCreationContext } from '../contexts/TripCreationContext';
import LocationSwitcher from './LocationSwitcher.jsx';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { stepName } = useTripCreationContext();

    // Re-apply the CSS theme variables to :root whenever the theme changes,
    // instead of holding a local style copy (which can desync vs :root and
    // override descendant cascade with stale values).
    useEffect(() => {
        applyThemeToRoot();
        const handleThemeChange = () => applyThemeToRoot();
        window.addEventListener('themeColorChange', handleThemeChange);
        return () => window.removeEventListener('themeColorChange', handleThemeChange);
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
        if (location.pathname.match(/^\/mileage-tracking\/vehicle\/[a-f0-9]+$/)) {
            return 'Mileage Tracking';
        }
        if (location.pathname.match(/^\/mileage-tracking\/[a-f0-9]+$/)) {
            return 'Mileage Tracking';
        }
        if (location.pathname.startsWith('/adblue-tracking')) {
            return 'AdBlue';
        }

        // Without this the slug fallback renders "Command center", which
        // contradicts the sidebar label and the page's own heading.
        if (location.pathname.startsWith('/command-center')) {
            return 'Overview';
        }
        if (location.pathname.match(/^\/erp\/trips\/[a-f0-9]{24}$/)) {
            return 'Trip Details';
        }

        // The fallback below is a URL slug, so any route ending in a raw
        // ObjectId would render the id as the page title. Fall back to the
        // section name instead of showing a 24-char hex string.
        const segments = location.pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1] || '';
        if (/^[a-f0-9]{24}$/i.test(last)) {
            const parent = segments[segments.length - 2] || '';
            if (!parent) return 'Details';
            const label = parent.replace(/-/g, ' ');
            return label.charAt(0).toUpperCase() + label.slice(1);
        }

        const path = location.pathname.split('/').pop().replace('-', ' ');
        if (!path) return 'Overview'; // Default title for base path
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    // Was `pathname.includes('/trip')`, which also matched /erp/trips/:id and
    // /erp/trip-close — so the Fleet trip-creation button appeared on ERP pages
    // and fired an event only the Fleet context listens for. Explicit now.
    const isTripsPage =
        location.pathname === '/fleet/trips' ||
        location.pathname === '/trip/new' ||
        location.pathname.startsWith('/trip-management');
    // /mileage-tracking now redirects into the Fuel hub, so the list-page search
    // and count badge that used to live here are gone with it — the hub owns
    // both. Only the deep create/detail routes remain standalone, and "Log Fuel"
    // is redundant on the create form itself.
    const isMileagePage =
        location.pathname.startsWith('/mileage-tracking') &&
        location.pathname !== '/mileage-tracking/new';
    const isAdBlueListPage = location.pathname === '/adblue-tracking';
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}><Menu /></button>
                <h2>{getPageTitle()}</h2>
            </div>
            <div className="navbar-right">
                {/* Active location switcher — always first in the action bar.
                    Renders only when the business has more than one location. */}
                <LocationSwitcher />
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                {isTripsPage && (
                    <button
                        className="btn btn-primary trip-action-btn"
                        onClick={() => window.dispatchEvent(new CustomEvent('startNewTrip'))}
                    >
                        <Plus size={16} />
                        <span>Start New Trip</span>
                    </button>
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
                {isAdBlueListPage && (
                    <button
                        className="btn btn-primary trip-action-btn"
                        onClick={() => navigate('/adblue-tracking/new')}
                    >
                        <Plus size={16} />
                        <span>Log AdBlue</span>
                    </button>
                )}

            </div>
        </header>
    );
};

export default Navbar;