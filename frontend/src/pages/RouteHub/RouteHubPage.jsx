import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from './useRouteHubToast.jsx';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import Ico from './routeHubIcons.jsx';
import RouteHubService from '../../services/RouteHubService';
import { ViewSkeleton } from './routeHubShared.jsx';
import './routeHubDesign.css';

const OverviewView = lazy(() => import('./views/OverviewView.jsx'));
const DeviationView = lazy(() => import('./views/DeviationView.jsx'));
const ReplayView = lazy(() => import('./views/ReplayView.jsx'));
const ProfitabilityView = lazy(() => import('./views/ProfitabilityView.jsx'));
const OverspeedView = lazy(() => import('./views/OverspeedView.jsx'));
const IntelligenceView = lazy(() => import('./views/IntelligenceView.jsx'));

const VIEWS = [
  { key: 'overview', label: 'Overview', Component: OverviewView },
  { key: 'deviation', label: 'Route deviation', badge: 'deviation', Component: DeviationView },
  { key: 'replay', label: 'Route replay', Component: ReplayView },
  { key: 'profitability', label: 'Profitability', Component: ProfitabilityView },
  { key: 'overspeed', label: 'Overspeed audit', badge: 'overspeed', Component: OverspeedView },
  { key: 'intelligence', label: 'Intelligence', Component: IntelligenceView },
];

export default function RouteHubPage() {
  useFullPageLayout();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, toastNode } = useToast();

  const activeKey = VIEWS.some((v) => v.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'overview';

  // Badges published by loaded views
  const [badges, setBadges] = useState({});
  const setBadge = useCallback((key, value) => {
    setBadges((b) => (b[key] === value ? b : { ...b, [key]: value }));
  }, []);

  // Universal Fuzzy Search State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);
  const [vehiclesCache, setVehiclesCache] = useState([]);
  const [corridorsCache, setCorridorsCache] = useState([]);
  const searchInputRef = useRef(null);
  const searchBoxRef = useRef(null);

  // Pre-load reference lists for instant client-side fuzzy suggestions
  useEffect(() => {
    let cancelled = false;
    RouteHubService.getVehicles()
      .then((res) => {
        if (!cancelled && Array.isArray(res)) {
          setVehiclesCache(
            res.map((v) => ({
              id: v._id || v.id,
              plate: v.registrationNumber || v.vehicleNumber || v.plateNumber || '',
              driver: v.currentDriverName || v.assignedDriver?.name || '',
              type: 'vehicle',
            })),
          );
        }
      })
      .catch(() => {});

    RouteHubService.getCorridors()
      .then((res) => {
        if (!cancelled && Array.isArray(res)) {
          setCorridorsCache(
            res.map((c) => ({
              id: c._id,
              name: c.name || `${c.origin?.city || 'Origin'} → ${c.destination?.city || 'Dest'}`,
              distance: c.distanceKm || c.routeDistanceKm,
              type: 'corridor',
            })),
          );
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Global shortcut: press '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const go = useCallback(
    (key, extra) => {
      const next = { tab: key, ...(extra || {}) };
      setSearchParams(next);
      window.scrollTo({ top: 0 });
    },
    [setSearchParams],
  );

  // Compute fuzzy suggestions
  const suggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/[-\s]/g, '');
    if (!q) return [];

    const matches = [];

    // Search vehicles
    for (const v of vehiclesCache) {
      const cleanPlate = v.plate.replace(/[-\s]/g, '').toLowerCase();
      const cleanDriver = v.driver.toLowerCase();
      if (cleanPlate.includes(q) || cleanDriver.includes(searchQuery.trim().toLowerCase())) {
        matches.push({
          key: `v-${v.plate}`,
          title: v.plate,
          sub: v.driver ? `Driver: ${v.driver}` : 'Commercial Asset',
          category: 'Vehicle',
          icon: 'truck',
          action: () => {
            go('replay', { v: v.plate });
            setIsSearchOpen(false);
          },
        });
      }
      if (matches.length >= 4) break;
    }

    // Search corridors
    for (const c of corridorsCache) {
      if (c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
        matches.push({
          key: `c-${c.id}`,
          title: c.name,
          sub: c.distance ? `${c.distance} km standard corridor` : 'Authorized Route',
          category: 'Corridor',
          icon: 'route',
          action: () => {
            go('deviation', { q: c.name.split('→')[0].trim() });
            setIsSearchOpen(false);
          },
        });
      }
      if (matches.length >= 7) break;
    }

    // Direct Trip Search Suggestion if input resembles a trip or order code
    if (/^(trp|trip|wb|jh|nl|od|dl)/i.test(searchQuery.trim()) || searchQuery.trim().length >= 4) {
      matches.push({
        key: `direct-trip-${searchQuery.trim()}`,
        title: `Filter "${searchQuery.trim()}" in ${activeKey.charAt(0).toUpperCase() + activeKey.slice(1)}`,
        sub: 'Apply instant query to active console',
        category: 'Quick Filter',
        icon: 'search',
        action: () => {
          const current = Object.fromEntries(searchParams.entries());
          setSearchParams({ ...current, tab: activeKey, q: searchQuery.trim() });
          setIsSearchOpen(false);
        },
      });
    }

    return matches;
  }, [searchQuery, vehiclesCache, corridorsCache, activeKey, searchParams, setSearchParams, go]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIdx((prev) => (prev + 1) % Math.max(1, suggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIdx(
        (prev) => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length),
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[selectedResultIdx]) {
        suggestions[selectedResultIdx].action();
      } else if (searchQuery.trim()) {
        const current = Object.fromEntries(searchParams.entries());
        setSearchParams({ ...current, tab: activeKey, q: searchQuery.trim() });
        setIsSearchOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const active = VIEWS.find((v) => v.key === activeKey);
  const ActiveComponent = active.Component;

  return (
    <div className="nova-rh">
      <header className="appbar">
        <div className="appbar-in">
          {/* Navigation tab strip */}
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

          {/* Universal Fuzzy Search Bar */}
          <div className="rh-search-wrapper" ref={searchBoxRef}>
            <div className={`rh-search-bar ${isSearchOpen ? 'active' : ''}`}>
              <Ico n="search" s={14} className="rh-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="rh-search-input"
                placeholder="Search vehicle, trip #, corridor (Press '/')"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  setSelectedResultIdx(0);
                }}
                onKeyDown={handleSearchKeyDown}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="rh-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    const current = Object.fromEntries(searchParams.entries());
                    delete current.q;
                    setSearchParams(current);
                    searchInputRef.current?.focus();
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {isSearchOpen && suggestions.length > 0 && (
              <div className="rh-search-dropdown">
                <div className="rh-search-dropdown-header">
                  <span>SUGGESTIONS ({suggestions.length})</span>
                  <span>Use ↑ ↓ to navigate, Enter to select</span>
                </div>
                {suggestions.map((item, idx) => (
                  <div
                    key={item.key}
                    className={`rh-search-item ${idx === selectedResultIdx ? 'selected' : ''}`}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedResultIdx(idx)}
                  >
                    <div className="rh-item-icon">
                      <Ico n={item.icon} s={14} />
                    </div>
                    <div className="rh-item-body">
                      <div className="rh-item-title-row">
                        <span className="rh-item-title">{item.title}</span>
                        <span className="rh-item-badge">{item.category}</span>
                      </div>
                      <div className="rh-item-sub">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="page">
        <Suspense fallback={<ViewSkeleton />}>
          <ActiveComponent go={go} toast={toast} params={searchParams} setBadge={setBadge} />
        </Suspense>
      </main>

      {toastNode}
    </div>
  );
}
