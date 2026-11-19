import React, { useState, useEffect, useRef } from 'react';
import { Fuel, LayoutGrid, ListFilter, Truck, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import ReportsSidebar from '../../components/ReportsSidebar';
import '../PageStyles.css';
import './ReportsPage.css';
import { getThemeCSS } from '../../utils/colorTheme';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { DEFAULT_REPORT, resolveReport } from './reportCatalog';
import { FULL_TANK_REPORT_ID, useFullTankAvailable } from './fullTankAvailability';

import DriverReport from './reports/DriverReport.jsx';
import VehicleReport from './reports/VehicleReport.jsx';
import MileageIntervalReport from './reports/MileageIntervalReport.jsx';
import DieselRefuelReport from './reports/DieselRefuelReport.jsx';
import AdBlueComparisonReport from './reports/AdBlueComparisonReport.jsx';
import ModelComparisonPage from '../MileageTracking/ModelComparisonPage.jsx';
import FuelCyclesReport from './reports/FuelCyclesReport.jsx';
import FullTankTabReport from './reports/FullTankTabReport.jsx';
import NonBusinessReport from './reports/NonBusinessReport.jsx';
import RunningCostReport from './reports/RunningCostReport.jsx';
import OilAverageReport from './reports/OilAverageReport.jsx';
import RegisterMatchReport from './reports/RegisterMatchReport.jsx';
import LaneKmReport from './reports/LaneKmReport.jsx';
import CustomReportsPage from './reports/custom/CustomReportsPage.jsx';
import FuelMileageReport from './reports/consolidated/FuelReportPage.jsx';
import TripsRunningCostReport from './reports/consolidated/TripsRunningCostReport.jsx';

const REPORT_COMPONENTS = {
  fuelMileage: () => <FuelMileageReport />,
  tripsRunningCost: () => <TripsRunningCostReport />,
  driver: () => <DriverReport />,
  vehicle: () => <VehicleReport />,
  mileageIntervals: () => <MileageIntervalReport />,
  modelComparison: () => <ModelComparisonPage />,
  dieselReport: () => <DieselRefuelReport />,
  adblueReport: () => <AdBlueComparisonReport />,
  oilAverage: () => <OilAverageReport />,
  fuelCycles: () => <FuelCyclesReport />,
  fullTankTab: () => <FullTankTabReport />,
  nonBusiness: () => <NonBusinessReport />,
  runningCost: () => <RunningCostReport />,
  registerMatch: () => <RegisterMatchReport />,
  laneKm: () => <LaneKmReport />,
  customReports: () => <CustomReportsPage />,
};

const ReportsPage = () => {
  const [reportNavOpen, setReportNavOpen] = useState(false);
  const reportMenuButton = useRef(null);
  const [scopeNotice, setScopeNotice] = useState('');
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [searchParams, setSearchParams] = useSearchParams();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const { available: fullTankAvailable } = useFullTankAvailable();

  // The selected report lives in the URL (?report=vehicle) so a refresh or a
  // shared link opens the same report. Until flags load, trust the URL; after,
  // fall back to the default if this org cannot open the requested report.
  // Switching reports keeps the shared filter params (?dates, ?vehicle, …) so
  // the same slice of the business can be compared across two reports.
  const requested = searchParams.get('report') || DEFAULT_REPORT;
  const selectedReport = flagsLoading ? requested : resolveReport(requested, isEnabled);
  // The full-tank endpoint is newer than the rest of the Reports API. A
  // backend that answers 404 has no such report: its row is hidden, and a
  // direct link to it falls back to the default report instead of opening a
  // screen that can only show an error.
  const activeReport =
    selectedReport === FULL_TANK_REPORT_ID && !fullTankAvailable ? DEFAULT_REPORT : selectedReport;
  const consolidated = ['fuelMileage', 'tripsRunningCost'].includes(activeReport);
  useEffect(() => {
    if (!reportNavOpen) return undefined;
    const close = (event) => {
      if (event.key === 'Escape') {
        setReportNavOpen(false);
        reportMenuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [reportNavOpen]);
  const unsupportedManufacturer = ['registerMatch', 'laneKm'].includes(activeReport);
  useEffect(() => {
    if (!unsupportedManufacturer || !searchParams.has('manufacturer')) return;
    setScopeNotice(
      'Manufacturer filter cleared: this report uses reference or snapshot data that cannot be filtered by manufacturer.',
    );
    const next = new URLSearchParams(searchParams);
    next.delete('manufacturer');
    setSearchParams(next, { replace: true });
  }, [unsupportedManufacturer, searchParams, setSearchParams]);
  const setSelectedReport = (id) => {
    setReportNavOpen(false);
    if (!['registerMatch', 'laneKm'].includes(id)) setScopeNotice('');
    const next = new URLSearchParams(searchParams);
    next.set('report', id);
    setSearchParams(next, { replace: true });
  };

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

  const renderReport = REPORT_COMPONENTS[activeReport] || REPORT_COMPONENTS[DEFAULT_REPORT];

  return (
    <div
      className={`reports-page-container ${consolidated ? 'reports-page--consolidated' : ''}`}
      style={themeColors}
    >
      <ReportsSidebar
        isOpen={!consolidated || reportNavOpen}
        mobileOpen={reportNavOpen}
        drawer={consolidated}
        selectedReport={activeReport}
        setSelectedReport={setSelectedReport}
      />
      <div
        className={`reports-content ${consolidated ? '' : 'with-sidebar'} ${isMainSidebarCollapsed ? 'main-sidebar-collapsed' : ''}`}
      >
        {consolidated && (
          <div className="cr-report-switcher">
            <nav aria-label="Consolidated reports">
              <button
                type="button"
                aria-current={activeReport === 'fuelMileage' ? 'page' : undefined}
                onClick={() => setSelectedReport('fuelMileage')}
              >
                <Fuel size={16} />
                Fuel &amp; Mileage
              </button>
              {isEnabled('autoTrips') && (
                <button
                  type="button"
                  aria-current={activeReport === 'tripsRunningCost' ? 'page' : undefined}
                  onClick={() => setSelectedReport('tripsRunningCost')}
                >
                  <Truck size={16} />
                  Trips &amp; Running Cost
                </button>
              )}
            </nav>
            <button
              type="button"
              className="cr-library-button"
              ref={reportMenuButton}
              aria-label="All reports"
              aria-expanded={reportNavOpen}
              aria-controls="report-side-nav"
              onClick={() => setReportNavOpen((open) => !open)}
            >
              <LayoutGrid size={16} />
              <span>All reports</span>
            </button>
          </div>
        )}
        {consolidated &&
          reportNavOpen &&
          createPortal(
            <button
              type="button"
              className="cr-report-menu-backdrop"
              aria-label="Close report menu"
              onClick={() => setReportNavOpen(false)}
            />,
            document.body,
          )}
        <div className={`reports-mobile-nav ${consolidated ? 'cr-legacy-mobile-nav' : ''}`}>
          <button
            type="button"
            aria-expanded={reportNavOpen}
            aria-controls="report-side-nav"
            onClick={() => setReportNavOpen((open) => !open)}
          >
            {reportNavOpen ? (
              <X size={16} aria-hidden="true" />
            ) : (
              <ListFilter size={16} aria-hidden="true" />
            )}
            {reportNavOpen ? 'Close reports' : 'Browse reports'}
          </button>
        </div>
        <div className="reports-main-content">
          {scopeNotice ? (
            <p role="status" className="p-3 text-sm">
              {scopeNotice}
            </p>
          ) : null}
          {renderReport()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
