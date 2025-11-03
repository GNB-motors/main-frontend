import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import { useProfile } from '../pages/Profile/ProfileContext.jsx';
import LottieLoader from './LottieLoader.jsx';
import './DashboardLayout.css';

const DashboardLayout = () => {
    // Set sidebar to be open by default on desktop screens.
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);
    const { isLoadingProfile } = useProfile();

    // Debug logging
    console.log('DashboardLayout - isLoadingProfile:', isLoadingProfile);

    return (
        <div className="dashboard-layout">
            <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            
            {/* Only show main content when not loading */}
            {!isLoadingProfile ? (
                <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                    <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                    <div className="page-content">
                        <Outlet />
                    </div>
                </main>
            ) : (
                /* Show loader in main content area during loading */
                <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                    <div className="dashboard-loading-content">
                        <LottieLoader 
                            isLoading={true} 
                            size="medium" 
                            message="Loading..." 
                            overlay={true}
                        />
                    </div>
                </main>
            )}
        </div>
    );
};

export default DashboardLayout;