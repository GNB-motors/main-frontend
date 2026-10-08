import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReportsSidebar from '../../components/ReportsSidebar';
import '../PageStyles.css';
import './ReportsPage.css';
import { getThemeCSS } from '../../utils/colorTheme';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { DEFAULT_REPORT, resolveReport } from './reportCatalog';

import DriverReport from './reports/DriverReport.jsx';
import VehicleReport from './reports/VehicleReport.jsx';
import MileageIntervalReport from './reports/MileageIntervalReport.jsx';
import RefuelLogsPage from '../Trip/RefuelLogsPage.jsx';
import AdBlueComparisonReport from './reports/AdBlueComparisonReport.jsx';
import ModelComparisonPage from '../MileageTracking/ModelComparisonPage.jsx';
import FuelCyclesReport from './reports/FuelCyclesReport.jsx';
import NonBusinessReport from './reports/NonBusinessReport.jsx';
import RunningCostReport from './reports/RunningCostReport.jsx';
import OilAverageReport from './reports/OilAverageReport.jsx';

const REPORT_COMPONENTS = {
  driver: () => <DriverReport />,
  vehicle: () => <VehicleReport />,
  mileageIntervals: () => <MileageIntervalReport />,
  modelComparison: () => <ModelComparisonPage />,
  dieselReport: () => <RefuelLogsPage fuelType="DIESEL" />,
  adblueReport: () => <AdBlueComparisonReport />,
  oilAverage: () => <OilAverageReport />,
  fuelCycles: () => <FuelCyclesReport />,
  nonBusiness: () => <NonBusinessReport />,
  runningCost: () => <RunningCostReport />,
};

const ReportsPage = () => {
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [searchParams, setSearchParams] = useSearchParams();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();

  // The selected report lives in the URL (?report=vehicle) so a refresh or a
  // shared link opens the same report. Until flags load, trust the URL; after,
  // fall back to the default if this org cannot open the requested report.
  const requested = searchParams.get('report') || DEFAULT_REPORT;
  const selectedReport = flagsLoading ? requested : resolveReport(requested, isEnabled);
  const setSelectedReport = (id) => setSearchParams({ report: id }, { replace: true });

  useEffect(() => {
    setThemeColors(getThemeCSS());
  }, []);

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

  const renderReport = REPORT_COMPONENTS[selectedReport] || REPORT_COMPONENTS[DEFAULT_REPORT];

  return (
    <div className="reports-page-container" style={themeColors}>
      <ReportsSidebar
        isOpen
        selectedReport={selectedReport}
        setSelectedReport={setSelectedReport}
      />
      <div
        className={`reports-content with-sidebar ${isMainSidebarCollapsed ? 'main-sidebar-collapsed' : ''}`}
      >
        <div className="reports-main-content">{renderReport()}</div>
      </div>
    </div>
  );
};

export default ReportsPage;
