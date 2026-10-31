// src/components/ReportsSidebar.jsx
//
// The Reports module's secondary navigation. Only report tables belong here;
// standalone Fuel Management pages use the main sidebar.
// Portaled to <body> to escape any transformed ancestor.

import React from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import SecondarySideNav from './SecondarySideNav';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import {
  activeReportId,
  reportDestination,
  visibleReportGroups,
} from '../pages/Reports/reportCatalog';

const ReportsSidebar = ({ isOpen, selectedReport, setSelectedReport, mobileOpen = false }) => {
  const { isEnabled } = useFeatureFlags();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const active =
    selectedReport != null ? selectedReport : activeReportId(location.pathname, location.search);

  const onSelect = (id) => {
    const destination = reportDestination(id);
    if (destination) navigate(destination);
    else if (setSelectedReport) setSelectedReport(id);
    else navigate(`/reports?report=${id}`);
  };

  return ReactDOM.createPortal(
    <SecondarySideNav
      variant="reports"
      className={mobileOpen ? 'reports-sidebar--mobile-open' : ''}
      scrollId="report-side-nav"
      items={visibleReportGroups(isEnabled)}
      activeOption={active}
      onSelect={onSelect}
    />,
    document.body,
  );
};

export default ReportsSidebar;
