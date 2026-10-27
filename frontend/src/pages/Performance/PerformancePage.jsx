import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import VehiclesTab from './VehiclesTab';
import DriversTab from './DriversTab';
import LeaderboardsTab from './LeaderboardsTab';
import { PERFORMANCE_TABS } from './performanceTabs';
import './PerformancePage.css';

/**
 * Performance — one section that folds in Driving DNA, the Mileage performance
 * tab, Leaderboards and Vehicle360's telemetry panels.
 *
 * The tab lives in the URL (`?tab=vehicles|drivers|leaderboards`) so the old
 * links keep working and every deep link is shareable.
 */
export default function PerformancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const active = PERFORMANCE_TABS.some((tab) => tab.key === requested) ? requested : 'vehicles';

  const selectTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="cluster-page">
      <PageShell
        title="Performance"
        subtitle="Every number says where it came from — and anything we cannot compare says so instead of showing a zero."
      >
        <div className="pf-tabs" role="tablist" aria-label="Performance sections">
          {PERFORMANCE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active === tab.key}
              className={`pf-tab${active === tab.key ? ' pf-tab--active' : ''}`}
              onClick={() => selectTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {active === 'vehicles' ? (
          <VehiclesTab />
        ) : active === 'drivers' ? (
          <DriversTab />
        ) : (
          <LeaderboardsTab />
        )}
      </PageShell>
    </div>
  );
}
