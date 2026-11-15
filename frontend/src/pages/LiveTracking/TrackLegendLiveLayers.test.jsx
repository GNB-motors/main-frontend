import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackLegend from './TrackLegend';
import { defaultLayerSelection } from './trackLegendModel';

function renderLegend(overrides = {}) {
  const props = {
    layerSelection: defaultLayerSelection(),
    onToggleLayer: vi.fn(),
    zoom: 12,
    ...overrides,
  };
  render(<TrackLegend {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /Layers/ }));
  return props;
}

describe('the live layers of the legend', () => {
  it('offers the places still to confirm', () => {
    renderLegend();
    expect(screen.getByRole('button', { name: /Places to confirm/ })).toBeInTheDocument();
  });

  it('asks for the review queue when it is switched on', () => {
    const props = renderLegend({
      layerSelection: { ...defaultLayerSelection(), reviewQueue: false },
      liveCounts: { reviewQueue: 3 },
    });
    const row = screen.getByRole('button', { name: /Places to confirm/ });
    expect(row).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(row);
    expect(props.onToggleLayer).toHaveBeenCalledWith('reviewQueue');
  });

  it('marks the review queue as on when it is on', () => {
    renderLegend({
      layerSelection: { ...defaultLayerSelection(), reviewQueue: true },
      liveCounts: { reviewQueue: 3 },
    });
    expect(screen.getByRole('button', { name: /Places to confirm/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('leaves an unknown count out instead of saying zero', () => {
    renderLegend({ liveCounts: { idling: null } });
    const row = screen.getByRole('button', { name: /Trucks idling now/ });
    expect(row).not.toHaveTextContent('0');
  });
});
