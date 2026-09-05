import React from 'react';
import FleetHub from '../../components/Fleet/FleetHub.jsx';

import LiveConsole from './LiveConsole.jsx';
import OverviewPage from '../Overview/OverviewPage.jsx';
import FleetCoveragePage from '../FleetCoverage/FleetCoveragePage.jsx';
import DailyDigestPage from '../DailyDigest/DailyDigestPage.jsx';

/**
 * LiveHub — the Fleet landing surface, and the answer to the original question:
 * "why do I have to scroll past six cards to see the map?"
 *
 * The old /overview stacked nine blocks and put the map SEVENTH, roughly
 * 1,260px down an ~840px viewport — so the only real-time thing on the page sat
 * below one and a half screens of seven-day aggregates, and Live Tracking
 * itself had no sidebar entry at all.
 *
 * The fix is not to move the map to the top of that page. The two things
 * answer different questions on different clocks: the map answers "where is my
 * fleet right now" and repolls every 45s; the dashboard answers "how did the
 * last seven days go" and does not change while you watch. Interleaving them in
 * one scroll gives neither a good layout and makes the live view pay the
 * dashboard's load cost.
 *
 * So they are siblings. Live is the default tab and fills the viewport;
 * Insights is the same dashboard, one click away, unchanged.
 *
 * `fill: true` on the Live tab makes the hub own the remaining height and stops
 * .page-content scrolling — see FleetHub and .fleet-fill in index.css.
 */
const LiveHub = () => {
  const tabs = [
    {
      id: 'live',
      label: 'Live',
      fill: true,
      render: () => <LiveConsole />,
    },
    {
      id: 'insights',
      label: 'Insights',
      render: () => <OverviewPage embedded />,
    },
    {
      id: 'coverage',
      label: 'Coverage',
      render: () => <FleetCoveragePage embedded />,
    },
    {
      id: 'digest',
      label: 'Daily digest',
      render: () => <DailyDigestPage embedded />,
    },
  ];

  return (
    <FleetHub
      title="Fleet"
      subtitle="Where every vehicle is right now"
      breadcrumbs={[{ label: 'Fleet' }, { label: 'Live' }]}
      defaultTab="live"
      tabs={tabs}
    />
  );
};

export default LiveHub;
