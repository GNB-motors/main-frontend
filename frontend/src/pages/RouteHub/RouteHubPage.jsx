import React, { lazy, Suspense, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from './useRouteHubToast.jsx';
import './routeHubDesign.css';

const OverviewView = lazy(() => import('./views/OverviewView.jsx'));
const DeviationView = lazy(() => import('./views/DeviationView.jsx'));
const ReplayView = lazy(() => import('./views/ReplayView.jsx'));
const ProfitabilityView = lazy(() => import('./views/ProfitabilityView.jsx'));
const OverspeedView = lazy(() => import('./views/OverspeedView.jsx'));

const VIEWS = [
  { key: 'overview', label: 'Overview', Component: OverviewView },
  { key: 'deviation', label: 'Route deviation', badge: 'deviation', Component: DeviationView },
  { key: 'replay', label: 'Route replay', Component: ReplayView },
  { key: 'profitability', label: 'Profitability', Component: ProfitabilityView },
  { key: 'overspeed', label: 'Overspeed audit', badge: 'overspeed', Component: OverspeedView },
];

/**
 * Route Hub — a port of Design/landing-page/assets/Route Hub pages/*.html
 * ("Nova Edge Pro"). The mockup ships as five standalone files that are the
 * same document with a different starting hash; here the five views live under
 * one route and swap on ?tab=, so deep links and the browser's back button
 * behave like the rest of the app.
 */
export default function RouteHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, toastNode } = useToast();

  const activeKey = VIEWS.some((v) => v.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'overview';

  // Nav badge counts are published by whichever view has loaded its data, so
  // the bar doesn't fire its own duplicate requests on every tab.
  const [badges, setBadges] = useState({});
  const setBadge = useCallback((key, value) => {
    setBadges((b) => (b[key] === value ? b : { ...b, [key]: value }));
  }, []);

  const go = useCallback(
    (key, extra) => {
      const next = { tab: key, ...(extra || {}) };
      setSearchParams(next);
      window.scrollTo({ top: 0 });
    },
    [setSearchParams],
  );

  const active = VIEWS.find((v) => v.key === activeKey);
  const ActiveComponent = active.Component;

  return (
    <div className="nova-rh">
      {/*
        Just the tab strip — no title/org/theme here. The app shell's own
        Navbar (src/components/Navbar.jsx) already renders a page title
        (auto-derived from the URL, which happens to say "Route hub" too),
        a location switcher and the theme toggle on every page; the mockup's
        own copies of those would only duplicate them.
      */}
      <header className="appbar">
        <div className="appbar-in">
          <nav className="nav">
            {VIEWS.map((v) => (
              <a
                key={v.key}
                href={`?tab=${v.key}`}
                data-v={v.key}
                aria-current={v.key === activeKey ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(v.key);
                }}
              >
                {v.label}
                {v.badge && badges[v.badge] != null ? <b>{badges[v.badge]}</b> : null}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="page">
        <Suspense fallback={<div className="empty">Loading…</div>}>
          <ActiveComponent go={go} toast={toast} params={searchParams} setBadge={setBadge} />
        </Suspense>
      </main>

      {toastNode}
    </div>
  );
}
