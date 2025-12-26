import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Headphones, Bell, ChevronDown } from 'lucide-react';
import ReportsSidebar from '../../components/ReportsSidebar';
import '../PageStyles.css';
import './ReportsPage.css';
import { getThemeCSS } from '../../utils/colorTheme';

// --- IMPORTS for MUI (Layout) ---
import {
    Box, Typography, CircularProgress, Alert
} from '@mui/material';

// --- IMPORTS for Date Pickers (Context Provider) ---
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// --- IMPORTS FOR CONTEXT ---
// Removed useProfile import - profile logic completely removed

// --- IMPORTS FOR SEGREGATED REPORT COMPONENTS ---
import DriverReport from './reports/DriverReport.jsx';
import VehicleReport from './reports/VehicleReport.jsx';
import TripReport from './reports/TripReport.jsx';
import ProjectedReport from './reports/ProjectedReport.jsx';
import OutlierReport from './reports/OutlierReport.jsx';
import SalesSummaryReport from './reports/SalesSummaryReport.jsx';


// --- MAIN REPORTS PAGE COMPONENT ---
const ReportsPage = () => {
    const [isReportsSidebarOpen, setIsReportsSidebarOpen] = useState(true);
    const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);
    const [themeColors, setThemeColors] = useState(getThemeCSS());
    const [selectedReport, setSelectedReport] = useState('driver'); // Default to driver report
    const [highlightedOutlierId, setHighlightedOutlierId] = useState(null); // Used for linking

    // Removed profile context - profile logic completely removed
    const businessRefId = null;

    // Effect for theme
    useEffect(() => { setThemeColors(getThemeCSS()); }, []);

    // Effect to track main sidebar collapse state
    useEffect(() => {
        const checkMainSidebarState = () => {
            const sidebar = document.querySelector('.sidebar');
            const isCollapsed = sidebar && !sidebar.classList.contains('open');
            setIsMainSidebarCollapsed(isCollapsed);
        };
        checkMainSidebarState();
        const observer = new MutationObserver(checkMainSidebarState);
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        }
        return () => observer.disconnect();
    }, []);

    // Function passed down to link reports to the outlier view
    const handleViewOutliers = (identifier) => { // Identifier can be driver name or vehicle reg no
        console.log(`Highlighting outliers for: ${identifier}`);
        setHighlightedOutlierId(identifier);
        setSelectedReport('outliers');
    };

    // Clear highlight when leaving outliers report
    useEffect(() => {
        if (selectedReport !== 'outliers') {
            setHighlightedOutlierId(null);
        }
    }, [selectedReport]);


    // --- RENDER FUNCTION (Selects which report component to show) ---
    const renderReport = () => {
        // Props to pass to all relevant reports (removed profile dependencies)
        const reportProps = {
            // Removed businessRefId, isLoadingProfile, profileError - profile logic completely removed
        };

        switch (selectedReport) {
            case 'driver':
                return <DriverReport {...reportProps} handleViewOutliers={handleViewOutliers} />;
            case 'vehicle':
                return <VehicleReport {...reportProps} handleViewOutliers={handleViewOutliers} />;
            case 'trip':
                return <TripReport {...reportProps} />;
            case 'projected':
                return <ProjectedReport {...reportProps} />;
            case 'outliers':
                return <OutlierReport {...reportProps} highlightedOutlierId={highlightedOutlierId} />;
            case 'salesSummary':
                return <SalesSummaryReport />;
            default:
                return <DriverReport {...reportProps} handleViewOutliers={handleViewOutliers} />;
        }
    };

    // --- RETURN JSX ---
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="reports-page-container" style={themeColors}>
                {/* Sidebar */}
                <ReportsSidebar
                    isOpen={isReportsSidebarOpen}
                    isMainSidebarCollapsed={isMainSidebarCollapsed}
                    selectedReport={selectedReport}
                    setSelectedReport={setSelectedReport}
                />
                {/* Main Content Area */}
                <div className={`reports-content ${isReportsSidebarOpen ? 'with-sidebar' : ''} ${isMainSidebarCollapsed ? 'main-sidebar-collapsed' : ''}`}>
                    {/* Top Nav Bar */}
                    {/* Report Content */}
                    <div className="reports-main-content">
                        {renderReport()} {/* Renders the selected report component */}
                    </div>
                </div>
            </div>
        </LocalizationProvider>
    );
};

export default ReportsPage;