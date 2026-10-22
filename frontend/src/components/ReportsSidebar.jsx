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
import { useNavigate } from 'react-router-dom';
import SecondarySideNav from './SecondarySideNav';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { reportDestination, visibleReportGroups } from '../pages/Reports/reportCatalog';

const ReportsSidebar = ({ isOpen, selectedReport, setSelectedReport }) => {
  const { isEnabled } = useFeatureFlags();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const onSelect = (id) => {
    const destination = reportDestination(id);
    if (destination) navigate(destination);
    else setSelectedReport(id);
  };

  return ReactDOM.createPortal(
    <SecondarySideNav
      variant="reports"
      scrollId="report-side-nav"
      items={visibleReportGroups(isEnabled)}
      activeOption={selectedReport}
      onSelect={onSelect}
    />,
    document.body,
  );
};

export default ReportsSidebar;