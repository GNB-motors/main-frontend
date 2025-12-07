/**
 * ChevronIcon Component
 * 
 * Reusable SVG icon for dropdown/expandable menu indicators.
 * Used in Sidebar component for nested menu items.
 * 
 * @param {number} size - Icon size in pixels (default: 16)
 * @param {string} className - Additional CSS classes
 * @param {Object} style - Additional inline styles
 */

import React from 'react';

const ChevronIcon = ({ size = 16, className = '', style = {} }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path 
        d="M12 6C12 6 9.05366 10 8 10C6.94634 10 4 6 4 6" 
        stroke="currentColor" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronIcon;
