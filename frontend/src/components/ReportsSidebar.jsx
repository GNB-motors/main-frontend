// src/components/ReportsSidebar.jsx
//
// The Reports module's secondary (inner) side nav. A thin wrapper over the
// reusable <SecondarySideNav/> — it just supplies the report groups and wires
// selection to the page. Portaled to <body> to escape any transformed ancestor.

import React from 'react';
import ReactDOM from 'react-dom';
import SecondarySideNav from './SecondarySideNav';

// Report groups. Add a group with `children` for a collapsible section, or a
// bare { id, label } for a flat top-level entry.
const REPORT_GROUPS = [
  {
    id: 'fleet',
    label: 'FLEET REPORTS',
    children: [
      { id: 'driver', label: 'Driver Report' },
      { id: 'vehicle', label: 'Vehicle Report' },
      { id: 'mileageIntervals', label: 'Mileage Report' },
      { id: 'modelComparison', label: 'Model Comparison' },
      { id: 'dieselReport', label: 'Diesel Report' },
      { id: 'adblueReport', label: 'AdBlue Report' },
    ],
  },
];

const ReportsSidebar = ({ isOpen, selectedReport, setSelectedReport }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <SecondarySideNav
      variant="reports"
      scrollId="report-side-nav"
      items={REPORT_GROUPS}
      activeOption={selectedReport}
      onSelect={setSelectedReport}
    />,
    document.body,
  );
};

export default ReportsSidebar;
