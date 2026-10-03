import React, { useState } from 'react';
import { AlertTriangle, Truck, Fuel, TrendingUp, Search, X, SlidersHorizontal } from 'lucide-react';
import EventsFeedPanel from './EventsFeedPanel.jsx';
import VehicleRiskPanel from './VehicleRiskPanel.jsx';
import PumpHonestyPanel from './PumpHonestyPanel.jsx';
import FuelActivityPanel from './FuelActivityPanel.jsx';
import AnomalyBreakdownPanel from './AnomalyBreakdownPanel.jsx';

const TABS = [
  {
    key: 'events',
    label: 'Incident & Security Feed',
    icon: AlertTriangle,
    question: 'Live telematics security events and dispensing audit',
  },
  {
    key: 'risk',
    label: 'Vehicle Threat Matrix',
    icon: Truck,
    question: 'Which fleet vehicles carry the highest loss risk?',
  },
  {
    key: 'pumps',
    label: 'Pump Honesty Watchlist',
    icon: Fuel,
    question: 'Which pumps have chronic dispensing shortfalls?',
  },
  {
    key: 'analytics',
    label: 'Telemetry Graphs & Analytics',
    icon: TrendingUp,
    question: 'Fleet fuel consumption & anomaly trends',
  },
];

/**
 * FuelIntegrityTables — The unified Mission Control Workspace.
 */
export default function FuelIntegrityTables({
  isLoading,
  filteredCount,
  pageEvents,
  page,
  totalPages,
  reviewed,
  onOpenEvent,
  onPageChange,
  riskVehicles,
  onDrill,
  // Analytics props
  chartData,
  chartMetric,
  onMetricChange,
  rangeDays,
  onRangeChange,
  defCount,
  billCount,
  lossL,
  affected,
  // Filter controls
  chip,
  onChipChange,
  chipDefs,
  vehicleQuery,
  onVehicleQueryChange,
  eventType,
  onEventTypeChange,
  statusFilter,
  onStatusFilterChange,
  onApplyFilter,
  onResetFilters,
  // Split pane state
  selectedEventId,
  onSelectEvent,
  onMarkReviewed,
  pricePerL = 95,
  fills = [],
}) {
  const [activeTab, setActiveTab] = useState('events');

  return (
    <div className="fi-workspace-card" id="fi-workspace">
      {/* Workspace Tab Header */}
      <div className="fi-workspace-header">
        <div className="fi-workspace-nav" role="tablist" aria-label="Console views">
          {TABS.map((t) => {
            const Icon = t.icon;
            const count =
              t.key === 'events' ? filteredCount : t.key === 'risk' ? riskVehicles?.length : null;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={activeTab === t.key}
                className={`fi-nav-btn ${activeTab === t.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                {count != null && <span className="fi-nav-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Quick Filter Chips (Shown when on events tab) */}
        {activeTab === 'events' && chipDefs && (
          <div className="fi-chips-wrap">
            {chipDefs.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`fi-chip ${chip === c.key ? 'is-active' : ''}`}
                onClick={() => onChipChange(c.key === chip ? 'all' : c.key)}
              >
                <span>{c.label}</span>
                <span className="fi-chip-count">{c.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Embedded Filter Bar for Events Tab */}
      {activeTab === 'events' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="fi-search-wrap">
              <Search size={14} className="fi-search-icon" />
              <input
                type="text"
                className="fi-search-input"
                placeholder="Search vehicle (e.g. WB25R9540)…"
                value={vehicleQuery}
                onChange={(e) => onVehicleQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onApplyFilter()}
              />
              {vehicleQuery && (
                <button
                  type="button"
                  className="fi-search-clear"
                  onClick={() => {
                    onVehicleQueryChange('');
                    onResetFilters();
                  }}
                  title="Clear search"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            <select
              value={eventType}
              onChange={(e) => onEventTypeChange(e.target.value)}
              className="fi-select"
              aria-label="Event type"
            >
              <option value="all">All Event Types</option>
              <option value="fill">Refuel Fills</option>
              <option value="loss">Siphon Losses</option>
              <option value="def">DEF / AdBlue Anomalies</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="fi-select"
              aria-label="Status filter"
            >
              <option value="all">Any Status</option>
              <option value="ESTIMATED">Estimated</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button type="button" className="fi-action-btn" onClick={onApplyFilter}>
              Apply
            </button>
            {(vehicleQuery || eventType !== 'all' || statusFilter !== 'all' || chip !== 'all') && (
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline ml-1"
                onClick={onResetFilters}
              >
                Reset
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{filteredCount}</span>{' '}
            filtered events
          </div>
        </div>
      )}

      {/* Workspace Tab Content */}
      <div className="fi-workspace-body">
        {activeTab === 'events' && (
          <EventsFeedPanel
            bare
            isLoading={isLoading}
            filteredCount={filteredCount}
            pageEvents={pageEvents}
            page={page}
            totalPages={totalPages}
            reviewed={reviewed}
            onOpenEvent={onOpenEvent}
            onPageChange={onPageChange}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            onMarkReviewed={onMarkReviewed}
            pricePerL={pricePerL}
            fills={fills}
          />
        )}

        {activeTab === 'risk' && (
          <div className="p-4">
            <VehicleRiskPanel
              bare
              isLoading={isLoading}
              riskVehicles={riskVehicles}
              onDrill={onDrill}
            />
          </div>
        )}

        {activeTab === 'pumps' && (
          <div className="p-4">
            <PumpHonestyPanel />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="fi-analytics-grid">
            <div className="fi-chart-card">
              <FuelActivityPanel
                isLoading={isLoading}
                chartData={chartData}
                chartMetric={chartMetric}
                onMetricChange={onMetricChange}
                rangeDays={rangeDays}
                onRangeChange={onRangeChange}
              />
            </div>
            <div className="fi-breakdown-card">
              <AnomalyBreakdownPanel
                isLoading={isLoading}
                defCount={defCount}
                billCount={billCount}
                lossL={lossL}
                affected={affected}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
