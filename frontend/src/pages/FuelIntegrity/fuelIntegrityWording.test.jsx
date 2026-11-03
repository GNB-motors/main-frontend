import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import VehicleRiskPanel from './VehicleRiskPanel';
import VehicleDrilldownPanel from './VehicleDrilldownPanel';
import MassBalancePipeline from './integrity/MassBalancePipeline';
import IntegrityBentoStrip from './integrity/IntegrityBentoStrip';
import AnomalyBreakdownPanel from './AnomalyBreakdownPanel';
import EventsFeedTable from './eventsFeed/EventsFeedTable';
import { buildBanner, buildChipDefs, buildEvents } from './fiData';

/**
 * The old page cried "siphon" at the owner, and most of those cries were
 * wrong. This file is the guard: nothing the Fuel Integrity screens render
 * may accuse anybody.
 */

// The drill-down chart measures itself; jsdom has no ResizeObserver.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
});

const WINDOW = {
  _id: 'w1',
  registrationNumber: 'WB11L8862',
  verdict: 'UNEXPLAINED_WHILE_PARKED',
  parkedDropL: 12,
  drivingUseL: 638,
  expectedDrivingUseL: 610,
  km: 1920,
  fillsLitres: 690,
  engineBurnL: 640,
  tankDeltaL: 10,
  windowFrom: '2026-09-14T00:00:00Z',
  windowTo: '2026-10-06T00:00:00Z',
  defRatioFlag: true,
  defToFuelRatioPct: 4.3,
  // The old fields are still on the window; they must not reach the screen.
  siphonSuspected: true,
  unaccountedLossL: 12,
  siphonConfidence: 'high',
};

const FILLS = [
  {
    _id: 'f1',
    registrationNumber: 'WB11L8862',
    litres: 690,
    at: '2026-10-06T00:00:00Z',
    confirmationStatus: 'CONFIRMED',
    billFlag: false,
    lat: 22.57,
    lng: 88.36,
  },
];

const VEHICLE = {
  id: 'v1',
  registrationNumber: 'WB11L8862',
  risk: 'Critical',
  siphonSuspectedLossL: 12,
  siphonSuspectedLossInr: 1140,
  fillsLitres: 690,
  engineBurnL: 640,
  defFlagCount: 1,
  billFlagCount: 0,
};

describe('Fuel Integrity wording', () => {
  it('never says siphon or theft in the rendered output', () => {
    const events = buildEvents(FILLS, [WINDOW], 95);
    const { container } = render(
      <div>
        <VehicleRiskPanel
          isLoading={false}
          riskVehicles={[VEHICLE]}
          onDrill={() => {}}
        />
        <VehicleDrilldownPanel
          vehicle="WB11L8862"
          chartData={[{ day: '06 Oct', fills: 690, loss: 12 }]}
          windows={[WINDOW]}
          onClose={() => {}}
          onShowWorking={() => {}}
        />
        <MassBalancePipeline
          lossL={12}
          pricePerL={95}
          totalEngineBurnL={640}
          totalFillsLitres={690}
          totalNetTankDeltaL={10}
          windowDays={22}
        />
        <IntegrityBentoStrip
          billCount={0}
          defCount={1}
          lossL={12}
          pricePerL={95}
          setChip={() => {}}
          totalFillsLitres={690}
          windowDays={22}
        />
        <AnomalyBreakdownPanel
          defCount={1}
          billCount={0}
          lossL={12}
          affected={{ list: [], max: 1 }}
          onDrill={() => {}}
        />
        <EventsFeedTable
          activeEvent={null}
          handleRowClick={() => {}}
          isInspectorOpen={false}
          onPageChange={() => {}}
          page={1}
          pageEvents={events}
          reviewed={new Set()}
          totalPages={1}
        />
      </div>,
    );

    const text = container.textContent.toLowerCase();
    expect(text).not.toMatch(/siphon/);
    expect(text).not.toMatch(/theft/);
    expect(text).not.toMatch(/stolen/);
  });

  it('never says siphon or theft in the words the page builds', () => {
    const events = buildEvents(FILLS, [WINDOW], 95);
    const words = [
      buildBanner(12, 0, 95).title,
      buildBanner(12, 0, 95).msg,
      buildBanner(0, 0, 95).msg,
      buildBanner(null, 0, 95).msg,
      ...buildChipDefs(events).map((c) => c.label),
      ...events.map((e) => e.kind),
    ]
      .join(' ')
      .toLowerCase();
    expect(words).not.toMatch(/siphon/);
    expect(words).not.toMatch(/theft/);
  });

  it('says the fuel went down while parked, as a fact', () => {
    const { container } = render(
      <VehicleDrilldownPanel
        vehicle="WB11L8862"
        chartData={[]}
        windows={[WINDOW]}
        onClose={() => {}}
        onShowWorking={() => {}}
      />,
    );
    expect(container.textContent).toContain('Fuel down while parked');
    expect(container.textContent).toContain('Went down while parked');
  });

  it('says the litres the driving explains, when the window knows them', () => {
    const { container } = render(
      <VehicleDrilldownPanel
        vehicle="WB11L8862"
        chartData={[]}
        windows={[WINDOW]}
        onClose={() => {}}
        onShowWorking={() => {}}
      />,
    );
    expect(container.textContent).toContain(
      'Used 638 L for 1,920 km; this truck usually needs 610 L for that.',
    );
  });
});
