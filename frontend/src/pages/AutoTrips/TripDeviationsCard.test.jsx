import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TripDeviationsCard from './TripDeviationsCard.jsx';

const at = (h, m = 0) => new Date(2026, 9, 14, h, m).toISOString();

const ev = (id, overrides = {}) => ({
  _id: id,
  registrationNumber: 'WB25R9540',
  status: 'OPEN',
  startedAt: at(9),
  endedAt: at(9, 30),
  maxOffKm: 4.2,
  extraKmEstimate: 4,
  estimatedExtraCostInr: 200,
  trip: { autoTripId: 't1', leg: 'LADEN' },
  ...overrides,
});

function renderCard(deviations) {
  return render(
    <MemoryRouter>
      <TripDeviationsCard
        deviations={deviations}
        loading={false}
        playable={() => false}
        onPlay={vi.fn()}
        focusId={null}
      />
    </MemoryRouter>,
  );
}

describe('TripDeviationsCard', () => {
  it('shows the measured distance and cost', () => {
    const { container } = renderCard([ev('e1')]);

    expect(container.textContent).toContain('+4.0 km');
    expect(container.textContent).toContain('₹200 est.');
  });

  it('shows a dash for a distance and a cost nobody measured', () => {
    const { container } = renderCard([
      ev('e1', { extraKmEstimate: null, estimatedExtraCostInr: null }),
    ]);

    expect(container.textContent).toContain('—');
    expect(container.textContent).not.toContain('+0.0 km');
    expect(container.textContent).not.toContain('₹0');
  });

  it('treats a field the old backend never sent as not measured', () => {
    const { container } = renderCard([
      { _id: 'e1', registrationNumber: 'WB25R9540', startedAt: at(9), trip: { autoTripId: 't1' } },
    ]);

    expect(container.textContent).toContain('—');
    expect(container.textContent).not.toContain('₹0');
  });

  it('keeps a measured zero a zero', () => {
    const { container } = renderCard([
      ev('e1', { extraKmEstimate: 0, estimatedExtraCostInr: 0, maxOffKm: 0.4 }),
    ]);

    expect(container.textContent).toContain('+0.0 km');
    expect(container.textContent).toContain('₹0 est.');
  });

  it('shows a dash for a detour with no usual road to compare against', () => {
    const { container } = renderCard([
      ev('e1', { extraKmEstimate: 0, estimatedExtraCostInr: 0, maxOffKm: 5 }),
    ]);

    expect(container.textContent).not.toContain('+0.0 km');
    expect(container.textContent).not.toContain('₹0 est.');
  });
});
