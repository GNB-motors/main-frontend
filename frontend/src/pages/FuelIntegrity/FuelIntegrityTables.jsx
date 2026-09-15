import { useState } from 'react';
import { Panel } from '../Overview/components/overview.primitives.jsx';
import EventsFeedPanel from './EventsFeedPanel.jsx';
import VehicleRiskPanel from './VehicleRiskPanel.jsx';

const TABS = [
  { key: 'events', label: 'Recent events', question: 'Which event should I investigate first?' },
  { key: 'risk', label: 'Vehicle risk', question: 'Which vehicles carry the most risk?' },
];

/**
 * The two detail tables (fuel events + vehicle risk) share one card, switched
 * by a segmented control. Each table scrolls inside the panel (fi-table-scroll)
 * so the card height stays stable no matter the row count.
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
}) {
  const [tab, setTab] = useState('events');
  const active = TABS.find((t) => t.key === tab) || TABS[0];

  return (
    <Panel
      id="fi-events"
      eyebrow="Fuel integrity review"
      question={active.question}
      action={
        <div className="flex items-center gap-3">
          <span className="text-dim hidden text-xs sm:inline">
            {tab === 'events' ? `${filteredCount} events` : `${riskVehicles.length} vehicles`}
          </span>
          <div className="ov-seg" role="group" aria-label="Detail tables">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {tab === 'events' ? (
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
        />
      ) : (
        <VehicleRiskPanel
          bare
          isLoading={isLoading}
          riskVehicles={riskVehicles}
          onDrill={onDrill}
        />
      )}
    </Panel>
  );
}
