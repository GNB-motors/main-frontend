// src/components/ReportsSidebar.jsx
//
// The Reports module's secondary (inner) side nav. A thin wrapper over the
// reusable <SecondarySideNav/> — it supplies the report groups the org can
// open and wires selection to the page. Portaled to <body> to escape any
// transformed ancestor.

import React from 'react';
import ReactDOM from 'react-dom';
import SecondarySideNav from './SecondarySideNav';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { visibleReportGroups } from '../pages/Reports/reportCatalog';

const ReportsSidebar = ({ isOpen, selectedReport, setSelectedReport }) => {
  const { isEnabled } = useFeatureFlags();

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <SecondarySideNav
      variant="reports"
      scrollId="report-side-nav"
      items={visibleReportGroups(isEnabled)}
      activeOption={selectedReport}
      onSelect={setSelectedReport}
    />,
    document.body,
  );
};

export default ReportsSidebar;
