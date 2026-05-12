import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Grid, FileText, Settings, LogOut, Users, User, Truck, MapPin, Fuel, BookOpen } from 'lucide-react';
import ChevronIcon from '../pages/Trip/assets/ChevronIcon';
import UkoLogo from '../assets/uko-logo.png';
import { applyThemeToRoot } from '../utils/colorTheme';
import './Sidebar.css';


const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isVehicleActivityOpen, setIsVehicleActivityOpen] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    // Defensive: ensure :root has the current theme CSS variables on mount and
    // whenever the theme color changes. The Sidebar previously kept a LOCAL
    // copy of theme colors and applied them inline on <aside>, which created a
    // competing CSS variable scope: when the local state was stale (e.g. before
    // the profile API resolved), descendants resolved var(--primary-light) to
    // the stale inline value instead of the freshly-updated :root value. By
    // dropping the inline style and routing all updates through :root, every
    // descendant sees a single source of truth.
    useEffect(() => {
        applyThemeToRoot();
        const handleThemeChange = () => applyThemeToRoot();
        window.addEventListener('themeColorChange', handleThemeChange);
        return () => window.removeEventListener('themeColorChange', handleThemeChange);
    }, []);

    // Check if any Vehicle Activity child route is active
    useEffect(() => {
        const vehicleActivityRoutes = ['/trip-management', '/refuel-logs', '/mileage-tracking'];
        if (vehicleActivityRoutes.includes(location.pathname)) {
            setIsVehicleActivityOpen(true);
        }
    }, [location.pathname]);

    // Auto-close Vehicle Activity when sidebar is not hovered on desktop
    useEffect(() => {
        if (!isSidebarHovered && window.innerWidth > 992) {
            // Close after a small delay when mouse leaves
            const timer = setTimeout(() => {
                const vehicleActivityRoutes = ['/trip-management', '/refuel-logs', '/mileage-tracking'];
                // Keep it open only if we're on a child route
                if (!vehicleActivityRoutes.includes(location.pathname)) {
                    setIsVehicleActivityOpen(false);
                }
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isSidebarHovered, location.pathname]);

    const handleLogout = () => {
        // Clear user tokens here in a real application
        localStorage.removeItem('authToken'); // Clear token on logout
        // Clear individual profile fields on logout
        localStorage.removeItem('profile_id');
        localStorage.removeItem('profile_owner_email');
        localStorage.removeItem('profile_company_name');
        localStorage.removeItem('profile_gstin');
        localStorage.removeItem('primaryThemeColor');
        navigate('/login');
    };

    // When a nav link is clicked on mobile, close the sidebar.
    const closeSidebarOnMobile = () => {
        if (window.innerWidth <= 992) {
            setSidebarOpen(false);
        }
    };

    return (
        <aside
            className="sidebar"
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
        >
            <div className="sidebar-content">
                <div className="sidebar-header">
                    <img src={UkoLogo} alt="Uko Logo" className="logo-img" />
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/overview" className="nav-link" onClick={closeSidebarOnMobile}>
                        <Grid size={20} /><span>Overview</span>
                    </NavLink>

                    {/* Vehicle Activity Section */}
                    <div className="nav-section">
                        <button
                            className={`nav-link nav-parent ${isVehicleActivityOpen ? 'active-parent' : ''}`}
                            onClick={() => setIsVehicleActivityOpen(!isVehicleActivityOpen)}
                        >
                            <div className="nav-parent-left">
                                <Truck size={20} />
                                <span>Vehicle Activity</span>
                            </div>
                            <ChevronIcon
                                size={16}
                                className={`chevron-icon ${isVehicleActivityOpen ? 'rotated' : ''}`}
                            />
                        </button>
                        <div className={`nav-children ${isVehicleActivityOpen ? 'open' : ''}`}>
                            <NavLink
                                to="/trip-management"
                                className="nav-link nav-child"
                                onClick={closeSidebarOnMobile}
                            >
                                <span>Trip Management</span>
                            </NavLink>
                            <NavLink
                                to="/refuel-logs"
                                className="nav-link nav-child"
                                onClick={closeSidebarOnMobile}
                            >
                                <span>Refuel Logs</span>
                            </NavLink>
                            <NavLink
                                to="/mileage-tracking"
                                className="nav-link nav-child"
                                onClick={closeSidebarOnMobile}
                            >
                                <span>Mileage Tracking</span>
                            </NavLink>
                        </div>
                    </div>

                    <NavLink to="/reports" className="nav-link" onClick={closeSidebarOnMobile}>
                        <FileText size={20} /><span>Reports</span>
                    </NavLink>
                    {/* --- Added Drivers Link --- */}
                    <NavLink to="/drivers" className="nav-link" onClick={closeSidebarOnMobile}>
                        <Users size={20} />
                        <span>Employees</span>
                    </NavLink>
                    <NavLink to="/vehicles" className="nav-link" onClick={closeSidebarOnMobile}>
                        <Truck size={20} />
                        <span>Vehicles</span>
                    </NavLink>
                    <NavLink to="/locations" className="nav-link" onClick={closeSidebarOnMobile}>
                        <MapPin size={20} />
                        <span>Locations</span>
                    </NavLink>
                    <NavLink to="/khata-ledger" className="nav-link" onClick={closeSidebarOnMobile}>
                        <BookOpen size={20} />
                        <span>Khata Ledger</span>
                    </NavLink>
                    <NavLink to="/fuel-comparison" className="nav-link" onClick={closeSidebarOnMobile}>
                        <Fuel size={20} />
                        <span>Fuel Comparison</span>
                    </NavLink>
                    <NavLink to="/profile" className="nav-link" onClick={closeSidebarOnMobile}>
                        <User size={20} />
                        <span>Profile</span>
                    </NavLink>
                </nav>
            </div>

            <div className="sidebar-footer">
                <button className="nav-link logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;