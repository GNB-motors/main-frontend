import React from 'react';

const Row = ({ label, children }) => (
  <div className="erp-detail-row">
    <span className="erp-detail-label">{label}</span>
    <span className="erp-detail-value">{children}</span>
  </div>
);

export default Row;
