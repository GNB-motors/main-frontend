import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { buildEvents, buildChartData, buildDrillChartData } from './fiData';
import { normaliseWindowsPayload } from './fuelWindows';
import { FuelIntegrityWindowSchema } from '../../schemas/mileageV2.schema';
import FuelWindowDrilldown from './FuelWindowDrilldown';
import InspectorMeter from './eventsFeed/InspectorMeter';
import EventInvestigationDrawer from './EventInvestigationDrawer';
import EventsFeedPanel from './EventsFeedPanel';
import { fillBillView } from './fillBillView';

const window = {
  _id: 'w1',
  registrationNumber: 'WB25R9540',
  mathVersion: 'v2',
  verdict: 'REVIEW_LOSS',
  unaccountedLossL: 40,
  reviewLossL: 40,
  reviewLineL: 15,
  unaccountedLossSigmaL: 3,
  windowFrom: '2026-11-01T00:00:00Z',
  windowTo: '2026-11-02T00:00:00Z',
};

it('accepts the real v2 contract and includes the same loss in events and both charts', () => {
  const record = normaliseWindowsPayload({ records: [window], total: 1 }).records[0];
  expect(FuelIntegrityWindowSchema.safeParse(record).success).toBe(true);
  expect(record.verdictWhy.text).not.toContain('has not been checked');
  const [event] = buildEvents([], [record], 95);
  expect(event).toMatchObject({
    kind: 'loss',
    litres: 40,
    inr: 3800,
    lossLabel: 'Fuel loss to review',
  });
  expect(buildChartData([], [record])[0].loss).toBe(40);
  expect(buildDrillChartData([], [record], window.registrationNumber)[0].loss).toBe(40);
});

it('shows the v2 evidence and its separate threshold without claiming a parked loss', () => {
  const { container } = render(<FuelWindowDrilldown open fuelWindow={window} onClose={vi.fn()} />);
  expect(screen.getByText('Review threshold').parentElement).toHaveTextContent('15 L');
  expect(screen.getByText('Loss uncertainty (1σ)').parentElement).toHaveTextContent('3 L');
  expect(
    screen.getByText('Fuel loss to review', { selector: '.fi-detail-label' }).parentElement,
  ).toHaveTextContent('40 L');
  expect(container.textContent).not.toContain('Fuel down while parked');
  expect(container.textContent).not.toContain('Not checked yet');
});

it('labels the opened v2 event inspector as review loss throughout', () => {
  const events = buildEvents([], [window], 95);
  const { container } = render(
    <MemoryRouter>
      <EventsFeedPanel filteredCount={1} pageEvents={events} />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Show Inspector Panel' }));
  expect(screen.getByText('Fuel loss to review — telematics')).toBeInTheDocument();
  expect(container.textContent).not.toContain('Fuel down while parked');
});

it('shows one signed sensor-minus-bill difference in the meter and drawer, ignoring an old raw variance', () => {
  const event = {
    vehicle: 'WB25R9540',
    litres: 99,
    claimedLitres: 100,
    billVarianceL: -9,
    billFlag: false,
    billComparable: true,
    confirmationStatus: 'CONFIRMED',
  };
  const { container } = render(
    <MemoryRouter>
      <InspectorMeter activeEvent={event} isFill />
      <EventInvestigationDrawer open event={event} onClose={vi.fn()} onMarkReviewed={vi.fn()} />
    </MemoryRouter>,
  );
  expect(screen.getByText('Sensor − billed').parentElement).toHaveTextContent('-1.0 L');
  expect(screen.getAllByText('Within tolerance · -1.0 L (sensor − billed)')).toHaveLength(2);
  expect(container.textContent).not.toContain('-9');
  expect(container.textContent).not.toContain('100% Reconciled');
  expect(fillBillView({ ...event, litres: 101 }).varianceText).toBe('+1.0 L');
});

it('never describes a large-gap or missing-sensor fill as matched', () => {
  const event = { litres: 150, claimedLitres: 100, billComparable: false, billFlag: false };
  render(<InspectorMeter activeEvent={event} isFill />);
  expect(screen.getByText('Bill comparison unavailable')).toBeInTheDocument();
  expect(fillBillView({ ...event, litres: null }).varianceL).toBeNull();
});
