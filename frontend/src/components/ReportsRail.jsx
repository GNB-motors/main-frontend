// Mounts the Reports secondary rail on a dedicated report SCREEN (Fuel
// Integrity, DEF Ledger, Fuel vs FleetEdge) so the rail stays put when one of
// those reports is opened from the Reports hub — instead of the page losing it
// on navigation. Rendering this anywhere in such a page is enough: the rail
// itself is portaled to <body>, and this also toggles a class on `.page-content`
// that reserves the 246px the fixed rail occupies, so the page content clears it.
// The Reports hub page (/reports) owns its own rail + layout and must NOT render
// this.

import React from 'react';
import ReportsSidebar from './ReportsSidebar';

const ReportsRail = () => {
  React.useEffect(() => {
    const el = document.querySelector('.page-content');
    if (!el) return undefined;
    el.classList.add('reports-rail-pad');
    return () => el.classList.remove('reports-rail-pad');
  }, []);

  return <ReportsSidebar isOpen />;
};

export default ReportsRail;
