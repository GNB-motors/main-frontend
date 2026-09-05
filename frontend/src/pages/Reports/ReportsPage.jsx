import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import MileageIntervalReport from './reports/MileageIntervalReport.jsx';

import RefuelLogsPage from '../Trip/RefuelLogsPage.jsx';
import AdBlueComparisonReport from './reports/AdBlueComparisonReport.jsx';
import ModelComparisonPage from '../MileageTracking/ModelComparisonPage.jsx';

// Each report is an aggregated, exportable view of data you WORK with
// somewhere else. Reports runs on its own api/reports/* surface, so these are
// not duplicates of the operational screens — but nothing told the user which
// door to use, or that the other door existed. This is the return path.
const LIVE_DATA_FOR = {
    driver: { to: '/drivers', label: 'Drivers' },
    vehicle: { to: '/vehicles', label: 'Vehicles' },
    mileageIntervals: { to: '/fleet/fuel?tab=logs&view=mileage', label: 'Mileage logs' },
    modelComparison: { to: '/fleet/fuel?tab=logs&view=mileage', label: 'Mileage logs' },
    dieselReport: { to: '/fleet/fuel?tab=logs&view=mileage', label: 'Fuel logs' },
    adblueReport: { to: '/fleet/fuel?tab=logs&view=adblue', label: 'AdBlue logs' },
};

// Valid ?r= values. An unknown one falls back to the driver report rather than
// rendering an empty pane.
const REPORT_IDS = new Set([
    'driver', 'vehicle', 'mileageIntervals', 'modelComparison', 'dieselReport', 'adblueReport', 'outliers',
]);

// --- MAIN REPORTS PAGE COMPONENT ---
const ReportsPage = () => {
    const [isReportsSidebarOpen, setIsReportsSidebarOpen] = useState(true);
    const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);
    const [themeColors, setThemeColors] = useState(getThemeCSS());
    // Which report is showing lives in the URL (?r=), not just in state, so a
    // report can be linked to. Operational pages now point at their matching
    // report — "View mileage report →" from Fuel, and so on — which was
    // impossible while the selection was component-local.
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedReport = REPORT_IDS.has(searchParams.get('r')) ? searchParams.get('r') : 'driver';
    const setSelectedReport = (id) => setSearchParams({ r: id }, { replace: true });
    const [highlightedOutlierId, setHighlightedOutlierId] = useState(null); // Used for linking

    // Removed profile context - profile logic completely removed
    const businessRefId = null;

    // Effect for theme
    useEffect(() => { setThemeColors(getThemeCSS()); }, []);

    // Remove global page-content padding only for this page
    useEffect(() => {
        const pageContentEl = document.querySelector('.page-content');
        if (pageContentEl) {
            pageContentEl.classList.add('no-padding');
        }
        return () => {
            if (pageContentEl) {
                pageContentEl.classList.remove('no-padding');
            }
        };
    }, []);

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
            case 'mileageIntervals':
                return <MileageIntervalReport />;
            case 'modelComparison':
                return <ModelComparisonPage />;
            case 'dieselReport':
                return <RefuelLogsPage fuelType="DIESEL" />;
            case 'adblueReport':
                return <AdBlueComparisonReport />;
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
                    {/* Reports are read-only aggregates; this is the way back
                        to the screen where the same data is entered and fixed. */}
                    {LIVE_DATA_FOR[selectedReport] && (
                        <div className="reports-crosslink">
                            <Link to={LIVE_DATA_FOR[selectedReport].to}>
                                Go to live data · {LIVE_DATA_FOR[selectedReport].label} &rarr;
                            </Link>
                        </div>
                    )}
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