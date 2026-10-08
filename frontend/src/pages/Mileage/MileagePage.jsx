import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Gauge,
  Fuel,
  GitCompare,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Calendar,
} from 'lucide-react';
import LiveRefuelTab from './components/LiveRefuelTab';
import ReconciliationTab from './components/ReconciliationTab';
import DnaAnalyticsTab from './components/DnaAnalyticsTab';
import CompletedCyclesSubtab from './components/CompletedCyclesSubtab';
import FuelComparisonDrawer from '../FuelComparison/FuelComparisonDrawer';
import './MileagePage.css';

export default function MileagePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'live';
  const activeSubtab = searchParams.get('subtab') || 'stream';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState(null);

  const setTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  const setSubtab = (subtab) => {
    const next = new URLSearchParams(searchParams);
    next.set('subtab', subtab);
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      next.set('search', searchQuery.trim());
    } else {
      next.delete('search');
    }
    setSearchParams(next);
  };

  return (
    <div className="mileage-hub">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="mileage-header">
        <div className="mileage-title-block">
          <h1>Mileage & Refuel Command Center</h1>
          <p>
            Unified telematics fuel telemetry, sensor jump verification, financial bill cross-talk,
            and vehicle DNA analytics.
          </p>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              aria-label="Search vehicle, pump, or driver"
              placeholder="Search vehicle, pump, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-64 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Top Executive KPI Bar ──────────────────────────────────── */}
      <div className="mileage-kpi-grid">
        <div className="mileage-kpi-card">
          <div className="mileage-kpi-top">
            <span>Fleet Avg Mileage</span>
            <Gauge className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mileage-kpi-value text-indigo-600 dark:text-indigo-400">3.84 km/L</div>
          <div className="mileage-kpi-sub">
            <span className="text-emerald-600 font-semibold">+0.12 km/L</span>
            <span>vs last 30 days</span>
          </div>
        </div>

        <div className="mileage-kpi-card">
          <div className="mileage-kpi-top">
            <span>Active En-Route Trips</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mileage-kpi-value text-blue-600 dark:text-blue-400">42 Trucks</div>
          <div className="mileage-kpi-sub">
            <span className="text-rose-500 font-bold">2 Pending Refuel</span>
            <span>on active route</span>
          </div>
        </div>

        <div className="mileage-kpi-card">
          <div className="mileage-kpi-top">
            <span>Reconciled Fills</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mileage-kpi-value text-emerald-600 dark:text-emerald-400">96.4%</div>
          <div className="mileage-kpi-sub">
            <span>Sensor jumps backed by bills</span>
          </div>
        </div>

        <div className="mileage-kpi-card">
          <div className="mileage-kpi-top">
            <span>Flagged Variances</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mileage-kpi-value text-amber-600 dark:text-amber-400">3 Incidents</div>
          <div className="mileage-kpi-sub">
            <span>Discrepancy &gt; 8% requiring audit</span>
          </div>
        </div>
      </div>

      {/* ── Primary Tabs Navigation ─────────────────────────────────── */}
      <div className="mileage-tab-nav">
        <button
          type="button"
          onClick={() => setTab('live')}
          className={`mileage-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
        >
          <Fuel className="w-4 h-4" />
          <span>Live Refuels & Watchlist</span>
          <span className="mileage-tab-badge">Live</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('reconciliation')}
          className={`mileage-tab-btn ${activeTab === 'reconciliation' ? 'active' : ''}`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Reconciliation & Cross-Talk</span>
          <span className="mileage-tab-badge">Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('performance')}
          className={`mileage-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Vehicle & Driver DNA</span>
          <span className="mileage-tab-badge">Analytics</span>
        </button>
      </div>

      {/* ── Subtab Selector for Tab 1 (Live vs Completed Cycles) ─────── */}
      {activeTab === 'live' && (
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSubtab('stream')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubtab === 'stream'
                ? 'bg-slate-900 text-white dark:bg-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            ⚡ Live Refuel Stream & Priority Watchlist
          </button>
          <button
            type="button"
            onClick={() => setSubtab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubtab === 'completed'
                ? 'bg-slate-900 text-white dark:bg-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            📋 Completed Refuel Cycles (3-Week Historical Ledger)
          </button>
        </div>
      )}

      {/* ── Tab Content Views ───────────────────────────────────────── */}
      {activeTab === 'live' && activeSubtab === 'stream' && (
        <LiveRefuelTab
          searchQuery={searchQuery}
          onOpenDrawer={(row) => setSelectedTaskForDrawer(row)}
        />
      )}

      {activeTab === 'live' && activeSubtab === 'completed' && (
        <CompletedCyclesSubtab searchQuery={searchQuery} />
      )}

      {activeTab === 'reconciliation' && (
        <ReconciliationTab
          searchQuery={searchQuery}
          onOpenDrawer={(task) => setSelectedTaskForDrawer(task)}
        />
      )}

      {activeTab === 'performance' && <DnaAnalyticsTab />}

      {/* ── Slide-Over Comparison & Forensic Audit Drawer ───────────── */}
      {selectedTaskForDrawer && (
        <FuelComparisonDrawer
          isOpen={Boolean(selectedTaskForDrawer)}
          task={selectedTaskForDrawer}
          onClose={() => setSelectedTaskForDrawer(null)}
          onApproved={() => setSelectedTaskForDrawer(null)}
        />
      )}
    </div>
  );
}
