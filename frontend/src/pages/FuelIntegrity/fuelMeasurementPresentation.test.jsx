import { expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import IntegrityBentoStrip from './integrity/IntegrityBentoStrip';
import MassBalancePipeline from './integrity/MassBalancePipeline';
import VehicleRiskPanel from './VehicleRiskPanel';
import InspectorMeter from './eventsFeed/InspectorMeter';
import FuelActivityPanel from './FuelActivityPanel';
import { buildEvents } from './fiData';
import { defComparisonLabel } from '../../utils/defComparison';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children, data }) => (
    <div aria-label="Daily fuel bars" data-values={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey }) => <span data-testid="bar-measure">{dataKey}</span>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

it('keeps absent litres, daily rate, value and flag counts unknown', () => {
  const { container } = render(
    <>
      <IntegrityBentoStrip
        totalFillsLitres={null}
        lossL={null}
        billCount={null}
        defCount={null}
        pricePerL={95}
        windowDays={7}
        setChip={() => {}}
      />
      <MassBalancePipeline
        totalFillsLitres={null}
        totalEngineBurnL={null}
        totalNetTankDeltaL={null}
        lossL={null}
        pricePerL={95}
        windowDays={7}
      />
    </>,
  );
  expect(container.textContent).not.toMatch(/0 L|~0|₹0|None flagged|None found/);
  expect(screen.getAllByText('Not measured').length).toBeGreaterThan(1);
  expect(screen.getByText('Fuel value not measured')).toBeInTheDocument();
});

it('preserves zero when the summary explicitly measured no loss or flags', () => {
  render(
    <IntegrityBentoStrip
      totalFillsLitres={0}
      lossL={0}
      billCount={0}
      defCount={0}
      pricePerL={95}
      windowDays={7}
      setChip={() => {}}
    />,
  );
  expect(screen.getAllByText('None flagged')).toHaveLength(2);
  expect(screen.getByText('None found')).toBeInTheDocument();
  expect(screen.getByText('7 days · ~0 L/day')).toBeInTheDocument();
  expect(screen.queryByText('Not measured')).not.toBeInTheDocument();
});

it('uses a positive loss amount in both the pipeline and headline card', () => {
  const { container } = render(
    <>
      <IntegrityBentoStrip
        totalFillsLitres={1000}
        lossL={316.1}
        billCount={0}
        defCount={0}
        pricePerL={95}
        windowDays={7}
        setChip={() => {}}
      />
      <MassBalancePipeline
        totalFillsLitres={1000}
        totalEngineBurnL={500}
        totalNetTankDeltaL={100}
        lossL={316.1}
        pricePerL={95}
        windowDays={7}
      />
    </>,
  );
  expect(screen.getByText('316.1')).toBeInTheDocument();
  expect(screen.getByText('316.1 L')).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/−316|-316/);
});

it('shows implausible losses as data checks, including when the caller supplied Critical', () => {
  render(
    <VehicleRiskPanel
      riskVehicles={[
        {
          registrationNumber: 'WB1',
          risk: 'Critical',
          fillsLitres: 137,
          siphonSuspectedLossL: 118.4,
        },
      ]}
      onDrill={() => {}}
    />,
  );
  expect(screen.getByText('Data check needed')).toBeInTheDocument();
  expect(screen.queryByText('Critical')).not.toBeInTheDocument();
  expect(screen.getByText('0 Clean')).toBeInTheDocument();
});

it('carries the actual DEF comparison band from the API event into the inspector', () => {
  const event = buildEvents(
    [],
    [
      {
        _id: 'def1',
        defRatioFlag: 'LOW',
        defToFuelRatioPct: 2,
        defBand: { min: 3, max: 6 },
        windowTo: '2026-11-24',
      },
    ],
    95,
  )[0];
  render(<InspectorMeter isDef activeEvent={event} />);
  expect(screen.getByText(defComparisonLabel({ min: 3, max: 6 }))).toBeInTheDocument();
  expect(screen.queryByText(/4.0%|7.0%|Standard/)).not.toBeInTheDocument();
});

it('does not supply a generic DEF band when a truck has no calibrated comparison', () => {
  render(<InspectorMeter isDef activeEvent={{ defPct: null, defBand: null }} />);
  expect(screen.getByText('Comparison range not available')).toBeInTheDocument();
  expect(screen.getByText('Measured: —')).toBeInTheDocument();
});

it('plots individual daily totals as bars with their real values', () => {
  const rows = [
    { day: '23 Nov', volume: 100 },
    { day: '24 Nov', volume: 300 },
  ];
  render(
    <FuelActivityPanel
      chartData={rows}
      chartMetric="volume"
      onMetricChange={() => {}}
      onRangeChange={() => {}}
      rangeDays={7}
    />,
  );
  const chart = screen.getByLabelText('Daily fuel bars');
  expect(JSON.parse(chart.getAttribute('data-values'))).toEqual(rows);
  expect(within(chart).getByTestId('bar-measure')).toHaveTextContent('volume');
});
