import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Grid, FileText, Settings, LogOut, Users, User, Upload, Truck } from 'lucide-react'; // Added Users, User, Truck icons
import ChevronIcon from '../pages/Trip/assets/ChevronIcon';
import UkoLogo from '../assets/uko-logo.png';
import { getPrimaryColor, getLightColor, getThemeCSS } from '../utils/colorTheme';
import './Sidebar.css';


const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [themeColors, setThemeColors] = useState(getThemeCSS());
    const [isVehicleActivityOpen, setIsVehicleActivityOpen] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    // Update theme colors when component mounts or profile color changes
    useEffect(() => {
        const updateTheme = () => {
            setThemeColors(getThemeCSS());
        };
        
        updateTheme();
        
        // Listen for storage changes (when profile color is updated)
        window.addEventListener('storage', updateTheme);
        
        return () => {
            window.removeEventListener('storage', updateTheme);
        };
    }, []);

    // Check if any Vehicle Activity child route is active
    useEffect(() => {
        const vehicleActivityRoutes = ['/trip-management', '/refuel-logs'];
        if (vehicleActivityRoutes.includes(location.pathname)) {
            setIsVehicleActivityOpen(true);
        }
    }, [location.pathname]);

    // Auto-close Vehicle Activity when sidebar is not hovered on desktop
    useEffect(() => {
        if (!isSidebarHovered && window.innerWidth > 992) {
            // Close after a small delay when mouse leaves
            const timer = setTimeout(() => {
                const vehicleActivityRoutes = ['/trip-management', '/refuel-logs'];
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
        localStorage.removeItem('profile_user_id');
        localStorage.removeItem('profile_company_name');
        localStorage.removeItem('profile_business_ref_id');
        localStorage.removeItem('profile_color');
        localStorage.removeItem('profile_is_onboarded');
        localStorage.removeItem('profile_is_superadmin');
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
            style={themeColors}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
        >
            <div className="sidebar-content">
                <div className="sidebar-header">
                    <img src={UkoLogo} alt="Uko Logo" className="logo-img" />
                    <h1 className="logo-text">FleetPro</h1>
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
                    <NavLink
                        to="/bulk-upload"
                        className="nav-link"
                        onClick={closeSidebarOnMobile}
                    >
                        <Upload size={20} />
                        <span>Bulk Upload</span>
                    </NavLink>
                    {/* ------------------------- */}
                    {/* <NavLink to="/settings" className="nav-link" onClick={closeSidebarOnMobile}>
                        <Settings size={20} /><span>Settings</span>
                    </NavLink> */}
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