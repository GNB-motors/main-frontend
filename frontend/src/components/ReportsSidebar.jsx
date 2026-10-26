// src/components/ReportsSidebar.jsx
//
// The Reports module's secondary (inner) side nav. A thin wrapper over the
// reusable <SecondarySideNav/> — it supplies the report groups the org can
// open and wires selection to the page. Rows that consolidate onto a screen
// they already own (catalog entries with a `to`) navigate there instead of
// swapping the table in place, so nothing that works today is rewritten.
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

// `selectedReport` / `setSelectedReport` are optional. The Reports page passes
// them (it owns the in-page report state); on a dedicated report screen the rail
// renders standalone and falls back to the URL for the active row and to a
// navigate for in-page reports — so the same rail works everywhere.
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
