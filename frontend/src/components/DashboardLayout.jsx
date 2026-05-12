import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import LottieLoader from './LottieLoader.jsx';
import { applyThemeToRoot } from '../utils/colorTheme.js';
import { ProfileService } from '../pages/Profile/ProfileService.jsx';
import { storeProfileData } from '../utils/profileStorage.js';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);

    React.useEffect(() => {
        // Set all CSS tokens on :root immediately — covers page refresh & login redirect.
        // This updates --primary-color, --primary-light, --primary-dark,
        // --color-primary-500/600/100, and Shadcn's --primary (oklch).
        applyThemeToRoot();

        // Re-apply on any colour change (login, profile page, onboarding finish).
        // CustomEvent fires in the same tab — window 'storage' event does NOT.
        window.addEventListener('themeColorChange', applyThemeToRoot);
        return () => window.removeEventListener('themeColorChange', applyThemeToRoot);
    }, []);

    // Fetch profile (incl. primaryThemeColor) once for the entire authenticated
    // session, regardless of which page the user lands on. storeProfileData
    // dispatches `themeColorChange`, which the listener above translates into
    // applyThemeToRoot — so every page (Overview, Reports, Trip, …) gets the
    // user's theme color applied immediately after login.
    React.useEffect(() => {
        let cancelled = false;
        const syncProfileTheme = async () => {
            if (!localStorage.getItem('authToken')) return;
            try {
                const data = await ProfileService.getProfile();
                if (cancelled || !data) return;
                storeProfileData(data);
                if (data.primaryThemeColor) applyThemeToRoot();
            } catch (err) {
                console.warn('DashboardLayout: failed to sync profile theme:', err);
            }
        };
        syncProfileTheme();
        return () => { cancelled = true; };
    }, []);

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