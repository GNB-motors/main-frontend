import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FleetAnalytics from './FleetAnalytics';

const model = (over = {}) => ({
  loadedKm: null,
  emptyKm: null,
  loadedTrips: null,
  runningPartial: false,
  runningReason: null,
  runningCoverage: null,
  runningCoveragePartial: false,
  runsPartial: false,
  runsMissingParts: [],
  runsUnknownKm: null,
  noTripLegs: false,
  cards: {},
  ...over,
});

const renderPanel = (over = {}) =>
  render(
    <MemoryRouter>
      <FleetAnalytics
        model={model(over)}
        fuel={{ data: null, loading: false, error: null, refetch: () => {} }}
        fuelTrend={[]}
        loading={false}
        day="2026-11-04"
      />
    </MemoryRouter>,
  );

describe('the running panel', () => {
  // OLD response: both legs are numbers, so the total is the total.
  it('adds both legs when both were measured', () => {
    const { container } = renderPanel({ loadedKm: 300, emptyKm: 120 });
    expect(container.textContent).toContain('420');
    expect(container.textContent).not.toContain('Partly measured');
    expect(container.querySelector('.db-split')).not.toBeNull();
  });

  // NEW response: one leg was not measured, so there is no total to publish.
  it('shows a dash and names the leg that was not measured', () => {
    const { container } = renderPanel({ loadedKm: 300, emptyKm: null });
    expect(container.querySelector('.db-big-number').textContent).toContain('—');
    expect(container.textContent).toContain('Loaded 300 km · empty not measured');
    expect(container.textContent).toContain('Partly measured');
    expect(container.querySelector('.db-split')).toBeNull();
  });

  it('says no distance only when both legs were measured', () => {
    const one = renderPanel({ loadedKm: 0, emptyKm: null });
    expect(one.container.textContent).not.toContain('No attributed running distance');
    const both = renderPanel({ loadedKm: 0, emptyKm: 0 });
    expect(both.container.textContent).toContain('No attributed running distance');
  });

  it('says how many trucks the distance covers', () => {
    const { container } = renderPanel({
      loadedKm: 300,
      emptyKm: 120,
      runningCoverage: 'over 42 of 51 trucks',
      runningCoveragePartial: true,
    });
    expect(container.textContent).toContain('over 42 of 51 trucks');
    expect(container.textContent).toContain('Partly measured');
  });

  it('shows the unknown distance beside the running figures', () => {
    const { container } = renderPanel({ loadedKm: 300, emptyKm: 120, runsUnknownKm: 80 });
    expect(container.textContent).toContain('Unknown distance');
    expect(container.textContent).toContain('80');
    const none = renderPanel({ loadedKm: 300, emptyKm: 120, runsUnknownKm: 0 });
    expect(none.container.textContent).not.toContain('Unknown distance');
  });

  it('says which leg the digest could not measure', () => {
    const { container } = renderPanel({
      loadedKm: 300,
      emptyKm: 120,
      runsPartial: true,
      runsMissingParts: ['empty'],
    });
    expect(container.textContent).toContain('Empty distance not measured');
    expect(container.textContent).toContain('Partly measured');
  });

  it('says a day without trip legs instead of 0 km', () => {
    const { container } = renderPanel({ runningReason: 'No trip legs for this day' });
    expect(container.textContent).toContain('No trip legs for this day');
    expect(container.textContent).not.toContain('0 km');
  });
});
