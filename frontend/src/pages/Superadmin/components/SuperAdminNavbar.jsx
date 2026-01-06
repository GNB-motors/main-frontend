import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import './SuperAdminNavbar.css';

const SuperAdminNavbar = ({ toggleSidebar }) => {
    const location = useLocation();
    
    const getPageTitle = () => {
        if (location.pathname === '/superadmin') {
            return 'Dashboard';
        } else if (location.pathname.includes('/add-user')) {
            return 'Add New User';
        }
        return 'Super Admin';
    };

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}>
                    <Menu />
                </button>
                <h2>{getPageTitle()}</h2>
            </div>
            <div className="navbar-right">
                <div className="user-info">
                    <span className="user-name">
                        {localStorage.getItem('user_firstName')} {localStorage.getItem('user_lastName')}
                    </span>
                    <span className="user-role">Super Admin</span>
                </div>
            </div>
        </header>
    );
};

export default SuperAdminNavbar;
