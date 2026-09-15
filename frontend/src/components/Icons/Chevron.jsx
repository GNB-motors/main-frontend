import React from 'react';

// A single chevron glyph (points down). Rotate it via CSS for open/closed —
// never swap two icons, so the rotation can animate. Colour = currentColor.
const Chevron = ({ size = 20, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M8 10.5L12 14.5L16 10.5" />
  </svg>
);

export default Chevron;
