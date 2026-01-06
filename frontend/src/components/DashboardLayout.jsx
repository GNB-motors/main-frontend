import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import LottieLoader from './LottieLoader.jsx';
import './DashboardLayout.css';

const DashboardLayout = () => {
    // Set sidebar to be open by default on desktop screens.
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);

    // Debug logging

    return (
        <div className="dashboard-layout">
            <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            
            <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;