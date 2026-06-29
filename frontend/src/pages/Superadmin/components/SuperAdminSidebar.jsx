import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Grid, UserPlus, LogOut, ToggleRight } from 'lucide-react';
import UkoLogo from '../../../assets/uko-logo.png';
import './SuperAdminSidebar.css';

const SuperAdminSidebar = ({ setSidebarOpen }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear all auth data
        localStorage.clear();
        navigate('/login');
    };

    const closeSidebarOnMobile = () => {
        if (window.innerWidth <= 992) {
            setSidebarOpen(false);
        }
    };

    return (
        <aside className="superadmin-sidebar">
            <div className="superadmin-sidebar-content">
                <div className="superadmin-sidebar-header">
                    <img src={UkoLogo} alt="Uko Logo" className="superadmin-logo-img" />
                    <h1 className="superadmin-logo-text">FleetPro Admin</h1>
                </div>

                <nav className="superadmin-sidebar-nav">
                    <NavLink to="/superadmin" end className="superadmin-nav-link" onClick={closeSidebarOnMobile}>
                        <Grid size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/superadmin/add-user" className="superadmin-nav-link" onClick={closeSidebarOnMobile}>
                        <UserPlus size={20} />
                        <span>Add New User</span>
                    </NavLink>

                    <NavLink to="/superadmin/feature-flags" className="superadmin-nav-link" onClick={closeSidebarOnMobile}>
                        <ToggleRight size={20} />
                        <span>Feature Flags</span>
                    </NavLink>
                </nav>
            </div>

            <div className="superadmin-sidebar-footer">
                <button className="superadmin-nav-link superadmin-logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default SuperAdminSidebar;
