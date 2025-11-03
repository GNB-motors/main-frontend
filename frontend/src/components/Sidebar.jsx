import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Grid, FileText, Settings, LogOut, Users, User } from 'lucide-react'; // Added Users and User icons
import UkoLogo from '../assets/uko-logo.png';
import { getPrimaryColor, getLightColor, getThemeCSS } from '../utils/colorTheme';
import './Sidebar.css';

const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const [themeColors, setThemeColors] = useState(getThemeCSS());

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
                    <NavLink to="/reports" className="nav-link" onClick={closeSidebarOnMobile}>
                        <FileText size={20} /><span>Reports</span>
                    </NavLink>
                    {/* --- Added Drivers Link --- */}
                    <NavLink to="/drivers" className="nav-link" onClick={closeSidebarOnMobile}>
                        <Users size={20} />
                        <span>Employees</span>
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