import React from 'react';

const PATHS = {
  refresh:
    '<path d="M21 3v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 21v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>',
  truck:
    '<path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1.5"/><path d="M9.5 17h3"/><path d="M19.5 17H21a1 1 0 0 0 1-1v-3.3a1 1 0 0 0-.2-.6l-3-3.7a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="17.5" r="2"/><circle cx="6.8" cy="17.5" r="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clipboard:
    '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4.5h6v2H9z"/><path d="m9.5 13 2 2 3.5-4"/>',
  down: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
  up: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  arrowR: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.2 4.2 5.6 5.6"/><path d="M18.4 18.4l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.2 19.8 5.6 18.4"/><path d="M18.4 5.6l1.4-1.4"/>',
};

export default function CcIcon({ n, s = 16, className, style }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[n] || '' }}
    />
  );
}
