import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeviationFeed from './DeviationFeed.jsx';

const at = (h, m = 0) => new Date(2026, 9, 14, h, m).toISOString();

const ev = (id, tripId, startH, overrides = {}) => ({
  _id: id,
  registrationNumber: 'WB25R9540',
  status: 'OPEN',
  startedAt: at(startH),
  endedAt: at(startH, 30),
  extraKmEstimate: 4,
  estimatedExtraCostInr: 200,
  trip: tripId ? { autoTripId: tripId, leg: 'LADEN' } : null,
  ...overrides,
});

/** The feed as the deviation screen shows it: one group of detours. */
function renderFeed(events) {
  return render(
    <DeviationFeed
      groups={[
        {
          key: 't1',
          autoTripId: 't1',
          trip: events[0].trip,
          registrationNumber: 'WB25R9540',
          events,
        },
      ]}
      selId={null}
      onSelect={vi.fn()}
      first={false}
      error={null}
      pager={null}
    />,
  );
}

describe('DeviationFeed group summary', () => {
  it('shows the known sum and how many detours were not measured', () => {
    const { container } = renderFeed([
      ev('e1', 't1', 9),
      ev('e2', 't1', 11, { extraKmEstimate: null, estimatedExtraCostInr: null }),
      ev('e3', 't1', 13),
    ]);

    expect(container.textContent).toContain('3 detours');
    expect(container.textContent).toContain('+8.0 km');
    expect(container.textContent).toContain('1 of 3 detours not measured');
    expect(container.textContent).toContain('₹400');
  });

  it('shows a dash, never 0 km or ₹0, when nothing in the group was measured', () => {
    const { container } = renderFeed([
      ev('e1', 't1', 9, { extraKmEstimate: null, estimatedExtraCostInr: null }),
      ev('e2', 't1', 11, { extraKmEstimate: null, estimatedExtraCostInr: null }),
    ]);

    expect(container.textContent).toContain('—');
    expect(container.textContent).toContain('2 of 2 detours not measured');
    expect(container.textContent).not.toContain('₹0');
    expect(container.textContent).not.toContain('0 km');
  });

  it('treats a field the old backend never sent as not measured', () => {
    const { container } = renderFeed([
      { _id: 'e1', registrationNumber: 'WB25R9540', startedAt: at(9), trip: { autoTripId: 't1' } },
      { _id: 'e2', registrationNumber: 'WB25R9540', startedAt: at(11), trip: { autoTripId: 't1' } },
    ]);

    expect(container.textContent).toContain('—');
    expect(container.textContent).not.toContain('₹0');
    expect(container.textContent).not.toContain('0 km');
  });

  it('keeps a measured zero a zero', () => {
    const { container } = renderFeed([
      ev('e1', 't1', 9, { extraKmEstimate: 0, estimatedExtraCostInr: 0, maxOffKm: 0.4 }),
      ev('e2', 't1', 11, { extraKmEstimate: 0, estimatedExtraCostInr: 0, maxOffKm: 0.4 }),
    ]);

    expect(container.textContent).toContain('+0.0 km');
    expect(container.textContent).toContain('₹0');
  });
});
