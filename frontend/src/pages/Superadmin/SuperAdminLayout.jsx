import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './components/SuperAdminSidebar.jsx';
import SuperAdminNavbar from './components/SuperAdminNavbar.jsx';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="dashboard-layout">
            <SuperAdminSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                <SuperAdminNavbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;
